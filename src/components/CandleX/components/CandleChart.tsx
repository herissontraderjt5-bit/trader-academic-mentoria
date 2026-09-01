import React, { useRef, useEffect, useState } from "react";
import { Candle, TechnicalIndicators } from "../../../types";
import { getCandleTimeRemaining } from "../utils/technicalIndicators";
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Sliders,
  SplitSquareVertical,
  Minus,
  Box,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";

interface CandleChartProps {
  candles: Candle[];
  ticker: string;
  interval: string;
  onChangeInterval: (interval: string) => void;
  indicators?: TechnicalIndicators;
  lastAiDirection?: "CALL" | "PUT" | "NEUTRAL";
  currentPrice: number;
  onOpenIndicatorsModal?: () => void;
}

export const CandleChart: React.FC<CandleChartProps> = ({
  candles,
  ticker,
  interval,
  onChangeInterval,
  indicators,
  lastAiDirection,
  currentPrice,
  onOpenIndicatorsModal,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [showEMAs, setShowEMAs] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showLevels, setShowLevels] = useState(true);
  const [activeDrawingTool, setActiveDrawingTool] = useState<string>("none");
  const [drawnLines, setDrawnLines] = useState<Array<{ y: number; label: string; color: string }>>([]);

  // High-frequency live tick to ensure canvas timer is always fresh and never frozen
  const [tick, setTick] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(Date.now());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = Math.max(rect.height, 350);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Dark obsidian background
    ctx.fillStyle = "#0B0E14";
    ctx.fillRect(0, 0, width, height);

    // Padding & Dimensions
    const paddingTop = 30;
    const paddingBottom = 40;
    const paddingRight = 75; // Right price scale
    const paddingLeft = 10;
    const chartHeight = height - paddingTop - paddingBottom;
    const chartWidth = width - paddingLeft - paddingRight;

    // Last 50 visible candles
    const visibleCandles = candles.slice(-50);
    if (visibleCandles.length === 0) return;

    let minPrice = Math.min(...visibleCandles.map((c) => c.low));
    let maxPrice = Math.max(...visibleCandles.map((c) => c.high));

    // Pad price range by 6%
    const priceRange = maxPrice - minPrice || 1;
    minPrice -= priceRange * 0.06;
    maxPrice += priceRange * 0.06;

    const maxVolume = Math.max(...visibleCandles.map((c) => c.volume), 1);
    const volumeHeight = chartHeight * 0.16;

    const candleCount = visibleCandles.length;
    const candleSpacing = chartWidth / (candleCount + 5); // extra room for expiration line
    const candleWidth = Math.max(candleSpacing * 0.65, 4);

    const getY = (price: number) => {
      return (
        paddingTop +
        (1 - (price - minPrice) / (maxPrice - minPrice)) * chartHeight
      );
    };

    const getX = (index: number) => {
      return paddingLeft + index * candleSpacing + candleSpacing / 2;
    };

    // Draw Horizontal Grid & Clean Price Labels (Exact Style of Screenshot)
    const gridSteps = 8;
    ctx.lineWidth = 1;

    for (let i = 0; i <= gridSteps; i++) {
      const price = minPrice + (i / gridSteps) * (maxPrice - minPrice);
      const y = getY(price);

      // Subtle grid line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      // Right Axis Price Label
      ctx.fillStyle = "#64748B";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(price.toFixed(2), width - paddingRight + 8, y);
    }

    // Draw Support & Resistance Zones
    if (showLevels && indicators) {
      if (
        indicators.support > 0 &&
        indicators.support >= minPrice &&
        indicators.support <= maxPrice
      ) {
        const supY = getY(indicators.support);
        ctx.strokeStyle = "rgba(0, 230, 118, 0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, supY);
        ctx.lineTo(width - paddingRight, supY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (
        indicators.resistance > 0 &&
        indicators.resistance >= minPrice &&
        indicators.resistance <= maxPrice
      ) {
        const resY = getY(indicators.resistance);
        ctx.strokeStyle = "rgba(255, 51, 75, 0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, resY);
        ctx.lineTo(width - paddingRight, resY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw Volume Bars at the bottom
    visibleCandles.forEach((c, index) => {
      const x = getX(index);
      const isBull = c.close >= c.open;
      const vHeight = (c.volume / maxVolume) * volumeHeight;
      const y = paddingTop + chartHeight - vHeight;

      ctx.fillStyle = isBull
        ? "rgba(0, 230, 118, 0.12)"
        : "rgba(255, 51, 75, 0.12)";
      ctx.fillRect(x - candleWidth / 2, y, candleWidth, vHeight);
    });

    // Draw Japanese Candlesticks (High Contrast Neon Green / Neon Red)
    visibleCandles.forEach((c, index) => {
      const x = getX(index);
      const isBull = c.close >= c.open;
      const candleColor = isBull ? "#00E676" : "#FF334B";

      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);

      // Wick (Upper & Lower)
      ctx.strokeStyle = candleColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const bodyY = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 2);

      ctx.fillStyle = candleColor;
      ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight);
    });

    // Vertical Expiration Dashed Line ("Tempo da Vela 03:47") matching screenshot
    const expirationX = getX(visibleCandles.length + 1);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(expirationX, paddingTop);
    ctx.lineTo(expirationX, paddingTop + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    const { formatted: liveCountdownStr } = getCandleTimeRemaining(new Date(), interval);

    // Expiration Line Header Badge
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Tempo da Vela", expirationX + 4, paddingTop + 10);
    ctx.font = "bold 11px monospace";
    ctx.fillText(liveCountdownStr, expirationX + 4, paddingTop + 26);

    // Live Price Horizontal Dotted Ray Line
    const latestCandle = visibleCandles[visibleCandles.length - 1];
    const livePrice = latestCandle.close;
    const livePriceY = getY(livePrice);
    const isLiveBull = livePrice >= latestCandle.open;
    const liveColor = isLiveBull ? "#00E676" : "#FF334B";

    ctx.strokeStyle = liveColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(paddingLeft, livePriceY);
    ctx.lineTo(width - paddingRight, livePriceY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Live Price Tag Badge on Right Axis (with live price and seconds countdown)
    const tagWidth = paddingRight - 4;
    const tagHeight = 22;
    ctx.fillStyle = liveColor;
    ctx.fillRect(
      width - paddingRight,
      livePriceY - tagHeight / 2,
      tagWidth,
      tagHeight
    );

    // Price Text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      livePrice.toFixed(2),
      width - paddingRight + tagWidth / 2,
      livePriceY - 2
    );

    // Seconds timer below price
    ctx.font = "bold 8.5px monospace";
    ctx.fillText(
      liveCountdownStr,
      width - paddingRight + tagWidth / 2,
      livePriceY + 8
    );

    // AI Direction Annotation Arrow
    if (lastAiDirection && lastAiDirection !== "NEUTRAL") {
      const lastIndex = visibleCandles.length - 1;
      const lastX = getX(lastIndex);
      const isCall = lastAiDirection === "CALL";
      const arrowY = isCall
        ? getY(latestCandle.low) + 24
        : getY(latestCandle.high) - 24;

      ctx.fillStyle = isCall ? "#00E676" : "#FF334B";
      ctx.beginPath();
      if (isCall) {
        ctx.moveTo(lastX, arrowY - 12);
        ctx.lineTo(lastX - 7, arrowY + 2);
        ctx.lineTo(lastX + 7, arrowY + 2);
      } else {
        ctx.moveTo(lastX, arrowY + 12);
        ctx.lineTo(lastX - 7, arrowY - 2);
        ctx.lineTo(lastX + 7, arrowY - 2);
      }
      ctx.closePath();
      ctx.fill();

      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `IA ${lastAiDirection}`,
        lastX,
        isCall ? arrowY + 14 : arrowY - 6
      );
    }

    // Time Axis (X-Axis) at bottom
    const stepCount = 8;
    for (let i = 0; i <= stepCount; i++) {
      const cIndex = Math.floor(
        (i / stepCount) * (visibleCandles.length - 1)
      );
      const candle = visibleCandles[cIndex];
      if (!candle) continue;

      const x = getX(cIndex);
      const date = new Date(candle.time * 1000);
      const timeStr = date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      ctx.fillStyle = "#64748B";
      ctx.font = "9.5px monospace";
      ctx.textAlign = "center";
      ctx.fillText(timeStr, x, height - 12);
    }

    // Active timestamp badge at bottom center (e.g. "25 Ago '26 20:35")
    const now = new Date();
    const todayBadge = `${now.getDate()} ${now.toLocaleString("pt-BR", {
      month: "short",
    })} '${String(now.getFullYear()).slice(2)} ${now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    ctx.fillStyle = "#1E293B";
    ctx.fillRect(expirationX - 45, height - 26, 90, 18);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 8.5px monospace";
    ctx.textAlign = "center";
    ctx.fillText(todayBadge, expirationX, height - 14);

    // Crosshair on hover
    if (
      mousePos &&
      mousePos.x >= paddingLeft &&
      mousePos.x <= width - paddingRight
    ) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, paddingTop);
      ctx.lineTo(mousePos.x, height - paddingBottom);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(paddingLeft, mousePos.y);
      ctx.lineTo(width - paddingRight, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [
    candles,
    indicators,
    lastAiDirection,
    mousePos,
    showLevels,
    tick,
    interval,
  ]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoveredCandle(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0B0E14] overflow-hidden flex flex-col select-none"
    >
      {/* Top Left Chart Controls: Timeframe, Candle Type, fx Indicadores */}
      <div className="absolute top-2.5 left-3 z-10 flex items-center gap-2">
        {/* Timeframe Dropdown */}
        <div className="flex items-center gap-1 bg-[#12161F]/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#1E2638] text-xs font-bold text-slate-200">
          <span>{interval}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>

        {/* Candle Type Icon */}
        <div
          className="p-1.5 bg-[#12161F]/90 backdrop-blur-md rounded-md border border-[#1E2638] text-slate-300 hover:text-white cursor-pointer"
          title="Tipo de Gráfico: Velas Japonesas"
        >
          <div className="flex items-center gap-0.5">
            <div className="w-1 h-3.5 bg-emerald-400 rounded-sm" />
            <div className="w-1 h-2.5 bg-rose-400 rounded-sm" />
          </div>
        </div>

        {/* fx Indicadores */}
        <button
          type="button"
          onClick={onOpenIndicatorsModal}
          className="flex items-center gap-1.5 bg-[#12161F]/90 backdrop-blur-md px-3 py-1 rounded-md border border-[#1E2638] hover:border-[#FF7A00]/50 text-xs font-bold text-slate-200 hover:text-[#FF7A00] transition-colors cursor-pointer"
        >
          <span className="font-serif italic font-black text-slate-400">fx</span>
          <span>Indicadores</span>
        </button>
      </div>

      {/* Center Floating Drawing Palette (from screenshot) */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-[#12161F]/90 backdrop-blur-md p-1 rounded-lg border border-[#1E2638] shadow-xl">
        <button
          type="button"
          onClick={() => setActiveDrawingTool("line")}
          className={`p-1.5 rounded hover:bg-[#1C2436] cursor-pointer ${
            activeDrawingTool === "line"
              ? "text-[#FF7A00] bg-[#1C2436]"
              : "text-slate-400"
          }`}
          title="Linha Livre"
        >
          <Minus className="w-3.5 h-3.5 -rotate-45" />
        </button>
        <button
          type="button"
          onClick={() => setActiveDrawingTool("channels")}
          className={`p-1.5 rounded hover:bg-[#1C2436] cursor-pointer ${
            activeDrawingTool === "channels"
              ? "text-[#FF7A00] bg-[#1C2436]"
              : "text-slate-400"
          }`}
          title="Canais"
        >
          <SplitSquareVertical className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setActiveDrawingTool("box")}
          className={`p-1.5 rounded hover:bg-[#1C2436] cursor-pointer ${
            activeDrawingTool === "box"
              ? "text-[#FF7A00] bg-[#1C2436]"
              : "text-slate-400"
          }`}
          title="Retângulo de Suporte"
        >
          <Box className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setActiveDrawingTool("trend")}
          className={`p-1.5 rounded hover:bg-[#1C2436] cursor-pointer ${
            activeDrawingTool === "trend"
              ? "text-[#FF7A00] bg-[#1C2436]"
              : "text-slate-400"
          }`}
          title="Vetor de Tendência"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Right Asset Label in Chart */}
      <div className="absolute top-2.5 right-20 z-10">
        <div className="bg-[#12161F]/80 backdrop-blur-md px-2.5 py-1 rounded text-xs font-mono font-bold text-slate-400 border border-[#1E2638]/60">
          {ticker}
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full flex-1 cursor-crosshair"
      />
    </div>
  );
};
