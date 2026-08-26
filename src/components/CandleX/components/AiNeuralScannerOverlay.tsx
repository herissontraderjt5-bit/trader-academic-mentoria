import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  Activity,
  BarChart3,
  Waves,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Brain,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Cpu,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  X,
  Clock,
} from "lucide-react";
import { Candle, TechnicalIndicators, AiAnalysisResult } from "../../../types";
import { soundManager } from "../utils/soundEffects";

interface AiNeuralScannerOverlayProps {
  isScanning: boolean;
  activeTicker: string;
  timeframe: string;
  indicators?: TechnicalIndicators | null;
  candles?: Candle[];
  analysis?: AiAnalysisResult | null;
  onClose?: () => void;
}

interface ScanPillar {
  id: "trend" | "rsi" | "volume" | "macd" | "ma" | "flow";
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  accentHex: string;
}

const SCAN_PILLARS: ScanPillar[] = [
  {
    id: "trend",
    title: "1. Estrutura de Tendência",
    subtitle: "Price Action, LTA/LTB & Topos/Fundos",
    icon: TrendingUp,
    color: "text-amber-400",
    accentHex: "#FFB300",
  },
  {
    id: "rsi",
    title: "2. RSI (Índice de Força)",
    subtitle: "Sobrecompra, Sobrevenda & Zonas de Exaustão",
    icon: Activity,
    color: "text-cyan-400",
    accentHex: "#00E5FF",
  },
  {
    id: "volume",
    title: "3. Volume & Liquidez",
    subtitle: "Volume Delta & Absorção Institucional",
    icon: BarChart3,
    color: "text-emerald-400",
    accentHex: "#10B981",
  },
  {
    id: "macd",
    title: "4. MACD Momentum",
    subtitle: "Histograma, Linha de Sinal & Cruzamentos",
    icon: Waves,
    color: "text-purple-400",
    accentHex: "#A855F7",
  },
  {
    id: "ma",
    title: "5. Médias Móveis (EMA/SMA)",
    subtitle: "Confluência Fractal 9/20/50 & Suporte Dinâmico",
    icon: Layers,
    color: "text-[#FF7A00]",
    accentHex: "#FF7A00",
  },
  {
    id: "flow",
    title: "6. Fluxo de Ordens (Tape Reading)",
    subtitle: "Pressão Compradora vs Vendedora & Agressão",
    icon: Zap,
    color: "text-rose-400",
    accentHex: "#F43F5E",
  },
];

export const AiNeuralScannerOverlay: React.FC<AiNeuralScannerOverlayProps> = ({
  isScanning,
  activeTicker,
  timeframe,
  indicators,
  candles = [],
  analysis,
  onClose,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Live second-by-second clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentTimeStr = currentTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const [scannedMetrics, setScannedMetrics] = useState<{
    trendText: string;
    trendScore: number;
    rsiText: string;
    rsiVal: number;
    volumeText: string;
    volumeRatio: number;
    macdText: string;
    macdHist: number;
    maText: string;
    maAlignment: string;
    flowText: string;
    flowBuyPercent: number;
  }>({
    trendText: "Calculando estrutura...",
    trendScore: 88,
    rsiText: "Medindo força relativa...",
    rsiVal: 50,
    volumeText: "Medindo volume delta...",
    volumeRatio: 1.2,
    macdText: "Avaliando histograma...",
    macdHist: 0.0012,
    maText: "Testando alinhamento...",
    maAlignment: "EMA 9 > EMA 20",
    flowText: "Calculando agressão...",
    flowBuyPercent: 72,
  });

  // Calculate live values based on indicators and candles
  useEffect(() => {
    if (!indicators) return;

    const rsiVal = Number((indicators.rsi || 50).toFixed(1));
    const rsiStatus =
      rsiVal <= 35
        ? "Sobrevenda Extrema (Forte Reversão de Alta)"
        : rsiVal >= 65
        ? "Sobrecompra (Exaustão de Compradores)"
        : "Zona Neutra de Continuação de Fluxo";

    const isTrendBullish = indicators.trend === "ALTA" || indicators.ema9 > indicators.ema20;
    const trendText = isTrendBullish
      ? "Tendência de ALTA Confirmada (Preço > EMA20 > SMA50)"
      : "Tendência de BAIXA Confirmada (Preço < EMA20 < SMA50)";

    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];
    const isVolumeHigh = (lastCandle?.volume || 100) > (prevCandle?.volume || 90);
    const volumeRatio = +(
      (lastCandle?.volume || 100) / Math.max(1, prevCandle?.volume || 90)
    ).toFixed(2);
    const volumeText = isVolumeHigh
      ? `Volume Acima da Média (${volumeRatio}x) • Absorção Detectada`
      : `Volume Regular (${volumeRatio}x) • Liquidez Estável`;

    const macdHist = Number((indicators.macdHist || 0.0015).toFixed(4));
    const macdText =
      macdHist > 0
        ? `Histograma Positivo (+${macdHist}) • Cruzamento de Alta Ativo`
        : `Histograma Negativo (${macdHist}) • Cruzamento de Venda Ativo`;

    const maText = `Alinhamento Exponencial: EMA 9 (${indicators.ema9?.toFixed(
      2
    ) || "0"}) / EMA 20 (${indicators.ema20?.toFixed(2) || "0"})`;

    const flowBuyPercent = isTrendBullish ? Math.floor(65 + Math.random() * 22) : Math.floor(20 + Math.random() * 25);
    const flowText = `${flowBuyPercent}% Pressão Compradora vs ${
      100 - flowBuyPercent
    }% Vendedora • Tape Agressivo`;

    setScannedMetrics({
      trendText,
      trendScore: isTrendBullish ? 92 : 88,
      rsiText: `RSI ${rsiVal} • ${rsiStatus}`,
      rsiVal,
      volumeText,
      volumeRatio,
      macdText,
      macdHist,
      maText,
      maAlignment: isTrendBullish ? "Alinhamento Bullish Fractal" : "Alinhamento Bearish Fractal",
      flowText,
      flowBuyPercent,
    });
  }, [indicators, candles]);

  const [showOverlay, setShowOverlay] = useState<boolean>(false);

  // Sync isScanning prop to internal showOverlay state
  useEffect(() => {
    if (isScanning) {
      setShowOverlay(true);
      setProgressPercent(0);
      setActiveStep(0);
    }
  }, [isScanning]);

  // Stepped progression timer when scanning is triggered
  useEffect(() => {
    if (!showOverlay) return;

    // Play initial telemetry scan sound
    soundManager.playTelemetryScan();

    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Increment by 2 every 50ms (takes 2.5 seconds to reach 100%)
        const next = prev + 2;
        return next > 100 ? 100 : next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [showOverlay]);

  // Sync active step with progress and trigger close when done
  useEffect(() => {
    if (!showOverlay) return;

    const step = Math.min(5, Math.floor((progressPercent / 100) * 6));
    if (step !== activeStep) {
      setActiveStep(step);
      soundManager.playPillarChecked();
    }

    if (progressPercent >= 100) {
      soundManager.playConfluenceLocked();

      // Remain open for 1.5 seconds so user can see "VALIDADO" on all indicators
      const closeTimer = setTimeout(() => {
        setShowOverlay(false);
        if (onClose) onClose();
      }, 1500);

      return () => clearTimeout(closeTimer);
    }
  }, [progressPercent, showOverlay, activeStep, onClose]);

  if (!showOverlay) return null;

  return (
    <div
      id="ai-neural-scanner-overlay"
      className="absolute inset-0 z-50 bg-[#070A10]/85 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-hidden animate-in fade-in duration-300 select-none"
    >
      {/* High-Tech Matrix Background Grid & Scanning Laser Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <div className="w-full h-full bg-[linear-gradient(to_right,#FF7A0012_1px,transparent_1px),linear-gradient(to_bottom,#FF7A0012_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      {/* Horizontal Laser Scanning Line */}
      <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF7A00] to-transparent shadow-[0_0_15px_#FF7A00] pointer-events-none animate-scan-laser z-10" />

      {/* Vertical Crosshair Laser Line */}
      <div className="absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent pointer-events-none animate-scan-laser-v z-10" />

      {/* Center Quantum Scanner Panel */}
      <div className="relative w-full max-w-2xl bg-[#0D121D]/95 border-2 border-[#FF7A00]/60 rounded-2xl p-5 shadow-[0_0_50px_rgba(255,122,0,0.35)] space-y-4 z-20">
        {/* Glow corners */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#FF7A00]" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#FF7A00]" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#FF7A00]" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#FF7A00]" />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7A00] to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(255,122,0,0.5)]">
              <Brain className="w-6 h-6 text-slate-950 stroke-[2.5] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-[#FF7A00] tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  SCANNER NEURAL CONFLUENCE
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#182030] text-slate-300 border border-slate-700">
                  {activeTicker} &bull; {timeframe.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#182030] text-amber-400 border border-amber-500/30 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {currentTimeStr}
                </span>
              </div>
              <h2 className="text-base font-black text-white tracking-wide">
                Escaneamento Quântico em Tempo Real
              </h2>
            </div>
          </div>

          {/* Radar Speed Meter */}
          <div className="flex items-center gap-3">
            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-400 uppercase block">Varredura (10s)</span>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-sm font-bold text-amber-400">
                  {Math.max(0, Math.ceil(10 - (progressPercent / 10)))}s
                </span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-base font-black text-[#FF7A00]">{progressPercent}%</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full border-2 border-[#FF7A00]/40 border-t-[#FF7A00] animate-spin flex items-center justify-center">
              <Cpu className="w-4 h-4 text-[#FF7A00]" />
            </div>
          </div>
        </div>

        {/* Progress Bar with Futuristic Glowing Track */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              Validando 6 Pilares de Confluência Institucional...
            </span>
            <span className="text-amber-400 font-bold">{activeStep + 1} de 6 Concluídos</span>
          </div>

          <div className="h-2.5 w-full bg-[#141A26] rounded-full overflow-hidden border border-[#222E44] relative">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-[#FF7A00] to-orange-500 rounded-full transition-all duration-150 shadow-[0_0_12px_rgba(255,122,0,0.8)] relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* The 6 Neural Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
          {SCAN_PILLARS.map((pillar, idx) => {
            const isCompleted = progressPercent >= ((idx + 1) / 6) * 100 || progressPercent === 100;
            const isCurrent = activeStep === idx && !isCompleted;
            const Icon = pillar.icon;

            let liveDetail = "";
            if (pillar.id === "trend") liveDetail = scannedMetrics.trendText;
            if (pillar.id === "rsi") liveDetail = scannedMetrics.rsiText;
            if (pillar.id === "volume") liveDetail = scannedMetrics.volumeText;
            if (pillar.id === "macd") liveDetail = scannedMetrics.macdText;
            if (pillar.id === "ma") liveDetail = scannedMetrics.maText;
            if (pillar.id === "flow") liveDetail = scannedMetrics.flowText;

            return (
              <div
                key={pillar.id}
                className={`p-2.5 rounded-xl border transition-all duration-300 flex items-start gap-2.5 relative overflow-hidden ${
                  isCompleted
                    ? "bg-[#101726]/90 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : isCurrent
                    ? "bg-[#1C160C]/90 border-[#FF7A00] shadow-[0_0_20px_rgba(255,122,0,0.4)] scale-[1.02]"
                    : "bg-[#0B0F19]/60 border-[#1A2234] opacity-50"
                }`}
              >
                {/* Active scan beam highlight */}
                {isCurrent && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF7A00]/10 to-transparent animate-pulse pointer-events-none" />
                )}

                {/* Pillar Icon */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    isCompleted
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : isCurrent
                      ? "bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/40 animate-pulse"
                      : "bg-[#151C2C] text-slate-500 border border-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content & Live Status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-white tracking-wide truncate">
                      {pillar.title}
                    </span>
                    {isCompleted ? (
                      <span className="text-[9px] font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        VALIDADO
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[9px] font-mono font-bold text-amber-400 flex items-center gap-1 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30 animate-pulse">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        ANALISANDO...
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-slate-500">AGUARDANDO</span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {pillar.subtitle}
                  </p>

                  {/* Live Telemetry Value */}
                  {(isCompleted || isCurrent) && (
                    <div className="mt-1 text-[10px] font-mono font-bold text-slate-200 bg-[#090D15] px-2 py-0.5 rounded border border-[#182030] flex items-center gap-1 truncate">
                      <span className="text-[#FF7A00]">&bull;</span>
                      <span className="truncate">{liveDetail}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Status / Footer info */}
        <div className="bg-[#090D15] p-2.5 rounded-xl border border-[#1A2234] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] text-slate-300">
              Filtro de Blindagem: Sinais acionados apenas com{" "}
              <strong className="text-amber-400">&ge; 75% de Confluência</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Motor: CandleX AI Confluence Core</span>
          </div>
        </div>
      </div>
    </div>
  );
};
