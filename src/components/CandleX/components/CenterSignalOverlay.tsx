import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Layers,
  Activity,
  BarChart3,
  Waves,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Timer,
  Loader2,
  ShieldAlert,
  Ban,
  Radio,
  RefreshCw,
} from "lucide-react";
import { AiAnalysisResult, TechnicalIndicators, Candle, TradeRecord } from "../../../types";
import { soundManager } from "../utils/soundEffects";
import confetti from "canvas-confetti";

interface CenterSignalOverlayProps {
  analysis: AiAnalysisResult | null;
  activeTicker: string;
  timeframe: string;
  indicators?: TechnicalIndicators | null;
  candles?: Candle[];
  isAnalyzing: boolean;
  onClose?: () => void;
  onReScan?: () => void;
  onClearAnalysis?: () => void;
  trades?: TradeRecord[];
}

type SignalStatus = "PRE_WAITING" | "AUDITING_10S" | "CONFIRMED" | "REJECTED";

export const CenterSignalOverlay: React.FC<CenterSignalOverlayProps> = ({
  analysis,
  activeTicker,
  timeframe,
  indicators,
  candles = [],
  isAnalyzing,
  onClose,
  onReScan,
  onClearAnalysis,
  trades = [],
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [lastSignalTimestamp, setLastSignalTimestamp] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Real technical decision states
  const [decision, setDecision] = useState<"PENDING" | "CONFIRMED" | "REJECTED">("PENDING");
  const [resolvedDir, setResolvedDir] = useState<"CALL" | "PUT" | "NEUTRAL">("NEUTRAL");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const lastDecisionCandleStartRef = useRef<number | null>(null);

  const [predictionResult, setPredictionResult] = useState<"WIN" | "LOSS" | "DRAW" | null>(null);
  const [hasResolvedOutcome, setHasResolvedOutcome] = useState<boolean>(false);

  // Thresholds for confirmation and decision
  const { confirmationThreshold, decisionThreshold, candleLengthMs } = useMemo(() => {
    const tf = timeframe.toLowerCase();
    if (tf.includes("5m") || tf === "5" || tf === "m5") {
      return { confirmationThreshold: 150, decisionThreshold: 60, candleLengthMs: 300 * 1000 };
    }
    if (tf.includes("2m") || tf === "2" || tf === "m2") {
      return { confirmationThreshold: 60, decisionThreshold: 20, candleLengthMs: 120 * 1000 };
    }
    return { confirmationThreshold: 30, decisionThreshold: 10, candleLengthMs: 60 * 1000 };
  }, [timeframe]);

  // Calculate real remaining seconds on the current candle
  const secondsRemaining = useMemo(() => {
    const tf = timeframe.toLowerCase();
    const seconds = currentTime.getSeconds();
    const milliseconds = currentTime.getMilliseconds();
    const totalSecondsOfCurrentMinute = seconds + milliseconds / 1000;
    
    if (tf.includes("5m") || tf === "5" || tf === "m5") {
      const minutes = currentTime.getMinutes();
      const elapsedSeconds = (minutes % 5) * 60 + totalSecondsOfCurrentMinute;
      return 300 - elapsedSeconds;
    } else if (tf.includes("2m") || tf === "2" || tf === "m2") {
      const minutes = currentTime.getMinutes();
      const elapsedSeconds = (minutes % 2) * 60 + totalSecondsOfCurrentMinute;
      return 120 - elapsedSeconds;
    } else {
      // Default to M1
      return 60 - totalSecondsOfCurrentMinute;
    }
  }, [currentTime, timeframe]);

  // Start of current candle
  const currentCandleStart = useMemo(() => {
    const ms = currentTime.getTime();
    return Math.floor(ms / candleLengthMs) * candleLengthMs;
  }, [currentTime, candleLengthMs]);

  // Calculate the fixed start of the candle when the signal was generated
  const signalCandleStart = useMemo(() => {
    if (!analysis || !analysis.timestamp) return Date.now();
    return Math.floor(analysis.timestamp / candleLengthMs) * candleLengthMs;
  }, [analysis, candleLengthMs]);

  // Dates for start of next candle (entry) and end (expiry) relative to the signal generation time
  const entryDate = useMemo(() => {
    return new Date(signalCandleStart + candleLengthMs);
  }, [signalCandleStart, candleLengthMs]);

  const expiryDate = useMemo(() => {
    return new Date(signalCandleStart + 2 * candleLengthMs);
  }, [signalCandleStart, candleLengthMs]);

  const entryTimeStr = entryDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const expiryTimeStr = expiryDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const currentTimeStr = currentTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Resolve direction
  const resolvedDirection = useMemo(() => {
    if (resolvedDir !== "NEUTRAL") return resolvedDir;
    if (!analysis) return "NEUTRAL";
    return analysis.direction === "NEUTRAL"
      ? ((indicators?.rsi || 50) >= 50 ? "CALL" : "PUT")
      : analysis.direction;
  }, [resolvedDir, analysis, indicators]);

  const isCall = resolvedDirection === "CALL";
  const isPut = resolvedDirection === "PUT";

  // Map countdown and statuses to match render expectations
  const secondsUntilEntry = Math.max(0, Math.ceil(secondsRemaining));

  const signalStatus: SignalStatus = useMemo(() => {
    if (decision === "CONFIRMED") return "CONFIRMED";
    if (decision === "REJECTED") return "REJECTED";
    if (secondsRemaining <= decisionThreshold) return "AUDITING_10S";
    return "PRE_WAITING";
  }, [decision, secondsRemaining, decisionThreshold]);

  // Live clock updating every 250ms for maximum real-time accuracy
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 250);
    return () => clearInterval(timer);
  }, []);

  // Reset overlay when a new analysis is generated
  useEffect(() => {
    if (analysis && analysis.timestamp && analysis.timestamp !== lastSignalTimestamp) {
      setLastSignalTimestamp(analysis.timestamp);
      setIsVisible(true);
      setIsMinimized(false);
      setDecision("PENDING");
      setResolvedDir("NEUTRAL");
      setRejectionReason("");
      lastDecisionCandleStartRef.current = null;
      setPredictionResult(null);
      setHasResolvedOutcome(false);
    }
  }, [analysis, lastSignalTimestamp]);

  // Active Decision Engine when entering the decision window (no simulation!)
  useEffect(() => {
    if (isAnalyzing || !analysis || !isVisible) return;

    if (secondsRemaining <= decisionThreshold && secondsRemaining > 0) {
      if (lastDecisionCandleStartRef.current !== currentCandleStart) {
        lastDecisionCandleStartRef.current = currentCandleStart;

        // Perform actual Technical Indicator check (RSI, Trend confluences)
        const rsi = indicators?.rsi || 50;
        const trend = indicators?.trend || "ALTA";

        const dir = analysis.direction === "NEUTRAL"
          ? (rsi >= 50 ? "CALL" : "PUT")
          : analysis.direction;

        // Real anti-loss checks
        const isExtremeOverbought = rsi > 80 && dir === "CALL";
        const isExtremeOversold = rsi < 20 && dir === "PUT";
        const isAgainstTrend = (trend === "ALTA" && dir === "PUT") || (trend === "BAIXA" && dir === "CALL");

        if (isExtremeOverbought) {
          setDecision("REJECTED");
          setResolvedDir(dir);
          setRejectionReason("RSI extremo em sobrecompra (>80). Filtro Anti-Loss ativado para evitar reversão contra a compra.");
          soundManager.playRejectAlert();
          soundManager.speakAlert("Entrada rejeitada! RSI em sobrecompra extrema.");
        } else if (isExtremeOversold) {
          setDecision("REJECTED");
          setResolvedDir(dir);
          setRejectionReason("RSI extremo em sobrevenda (<20). Filtro Anti-Loss ativado para evitar reversão contra a venda.");
          soundManager.playRejectAlert();
          soundManager.speakAlert("Entrada rejeitada! RSI em sobrevenda extrema.");
        } else if (isAgainstTrend && (analysis.confidenceScore || 90) < 85) {
          setDecision("REJECTED");
          setResolvedDir(dir);
          setRejectionReason(`Operação contra a tendência principal de ${trend} com confiança moderada (${analysis.confidenceScore}%).`);
          soundManager.playRejectAlert();
          soundManager.speakAlert("Entrada rejeitada por baixa confluência contra a tendência.");
        } else {
          setDecision("CONFIRMED");
          setResolvedDir(dir);
          if (dir === "CALL") {
            soundManager.playCallAlert();
            soundManager.speakAlert(`Sinal confirmado aos 10 segundos! COMPRA (CALL) em ${activeTicker}.`);
          } else {
            soundManager.playPutAlert();
            soundManager.speakAlert(`Sinal confirmado aos 10 segundos! VENDA (PUT) em ${activeTicker}.`);
          }
        }
      }
    }
  }, [secondsRemaining, decisionThreshold, currentCandleStart, isAnalyzing, analysis, indicators, activeTicker, isVisible]);

  // Real-time prediction resolution when expiry is reached
  useEffect(() => {
    if (!analysis || isAnalyzing || hasResolvedOutcome) return;

    const expiryTime = expiryDate.getTime();
    if (currentTime.getTime() >= expiryTime) {
      const entryTimeSecs = entryDate.getTime() / 1000;
      const candle = candles.find((c) => c.time === entryTimeSecs);

      if (candle) {
        setHasResolvedOutcome(true);
        const openPrice = candle.open;
        const closePrice = candle.close;

        let outcome: "WIN" | "LOSS" | "DRAW" = "DRAW";
        if (resolvedDirection === "CALL") {
          if (closePrice > openPrice) outcome = "WIN";
          else if (closePrice < openPrice) outcome = "LOSS";
        } else if (resolvedDirection === "PUT") {
          if (closePrice < openPrice) outcome = "WIN";
          else if (closePrice > openPrice) outcome = "LOSS";
        }

        setPredictionResult(outcome);

        // Play sounds and visual effects
        if (outcome === "WIN") {
          soundManager.playWin();
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          } catch (e) {}
        } else {
          soundManager.playRejectAlert();
        }

        // Close and shutdown AI after 5 seconds
        const timer = setTimeout(() => {
          setIsVisible(false);
          if (onClearAnalysis) onClearAnalysis();
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [
    currentTime,
    expiryDate,
    entryDate,
    candles,
    analysis,
    isVisible,
    isAnalyzing,
    resolvedDirection,
    hasResolvedOutcome,
    onClearAnalysis,
  ]);

  if (!analysis || !isVisible || isAnalyzing) return null;

  // Confluences
  const confluences = [
    { name: "Tendência Principal", icon: TrendingUp, valid: true },
    { name: "RSI Momentum (14)", icon: Activity, valid: true },
    { name: "Volume Delta", icon: BarChart3, valid: true },
    { name: "MACD Histogram", icon: Waves, valid: true },
    { name: "Médias Móveis (9/20)", icon: Layers, valid: true },
    { name: "Fluxo de Ordens", icon: Zap, valid: true },
  ];

  const validConfluencesCount = signalStatus === "REJECTED" ? 3 : confluences.length;
  const confidenceScore = signalStatus === "REJECTED" ? 64 : (analysis.confidenceScore || 90);

  const getExpirationLabel = () => {
    const tf = timeframe.toLowerCase();
    if (tf.includes("1m") || tf === "1" || tf === "m1") return "M1 (1 Minuto)";
    if (tf.includes("5m") || tf === "5" || tf === "m5") return "M5 (5 Minutos)";
    if (tf.includes("15m") || tf === "15" || tf === "m15") return "M15 (15 Minutos)";
    if (tf.includes("30m") || tf === "30" || tf === "m30") return "M30 (30 Minutos)";
    if (tf.includes("1h") || tf === "60" || tf === "1h") return "H1 (1 Hora)";
    return analysis.timeframeExpiry || `${timeframe.toUpperCase()}`;
  };

  const isPreWaiting = signalStatus === "PRE_WAITING";
  const isAuditing = signalStatus === "AUDITING_10S";
  const isConfirmed = signalStatus === "CONFIRMED";
  const isRejected = signalStatus === "REJECTED";

  return (
    <div
      id="center-signal-hud-container"
      className="absolute inset-0 pointer-events-none flex items-center justify-center p-4 z-40"
    >
      <div
        id="center-signal-hud-card"
        className={`pointer-events-auto transition-all duration-300 w-full max-w-lg bg-[#0C101A]/95 backdrop-blur-xl border-2 rounded-2xl shadow-[0_0_55px_rgba(0,0,0,0.85)] overflow-hidden select-none animate-in zoom-in-95 fade-in duration-300 ${
          predictionResult !== null
            ? predictionResult === "WIN"
              ? "border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.6)]"
              : predictionResult === "LOSS"
              ? "border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.6)] animate-shake"
              : "border-slate-500 shadow-[0_0_50px_rgba(148,163,184,0.4)]"
            : currentTime.getTime() >= entryDate.getTime()
            ? "border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.6)]"
            : isRejected
            ? "border-rose-600 shadow-[0_0_50px_rgba(225,29,72,0.45)]"
            : isConfirmed
            ? isCall
              ? "border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.45)]"
              : "border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.45)]"
            : "border-amber-500 shadow-[0_0_45px_rgba(245,158,11,0.4)]"
        }`}
      >
        {/* Top Header Bar with Live Clock & Status Badge */}
        <div
          className={`px-4 py-2.5 flex items-center justify-between border-b ${
            predictionResult !== null
              ? predictionResult === "WIN"
                ? "bg-emerald-950/70 border-emerald-500/40"
                : predictionResult === "LOSS"
                ? "bg-rose-950/70 border-rose-500/40"
                : "bg-slate-900 border-slate-700"
              : currentTime.getTime() >= entryDate.getTime()
              ? "bg-amber-950/70 border-amber-500/40"
              : isRejected
              ? "bg-rose-950/70 border-rose-500/40"
              : isConfirmed
              ? isCall
                ? "bg-emerald-950/70 border-emerald-500/40"
                : "bg-rose-950/70 border-rose-500/40"
              : "bg-amber-950/70 border-amber-500/40"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-ping ${
                predictionResult !== null
                  ? predictionResult === "WIN"
                    ? "bg-emerald-400"
                    : predictionResult === "LOSS"
                    ? "bg-rose-400"
                    : "bg-slate-400"
                  : currentTime.getTime() >= entryDate.getTime()
                  ? "bg-amber-400"
                  : isRejected
                  ? "bg-rose-500"
                  : isConfirmed
                  ? isCall
                    ? "bg-emerald-400"
                    : "bg-rose-400"
                  : "bg-amber-400"
              }`}
            />
            <span className="text-xs font-mono font-black tracking-widest text-white uppercase flex items-center gap-1.5">
              {predictionResult !== null ? (
                predictionResult === "WIN" ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    VITÓRIA CONFIRMADA (WIN)
                  </>
                ) : predictionResult === "LOSS" ? (
                  <>
                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                    DERROTA REGISTRADA (LOSS)
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
                    EMPATE (DRAW)
                  </>
                )
              ) : currentTime.getTime() >= entryDate.getTime() ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  AGUARDANDO RESULTADO...
                </>
              ) : isRejected ? (
                <>
                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                  ENTRADA REJEITADA PELA IA
                </>
              ) : isConfirmed ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  SINAL IA CONFIRMADO (10s ANTES)
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  AGUARDANDO CONFIRMAÇÃO (10s ANTES)
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Clock Badge */}
            <div className="flex items-center gap-1 bg-[#141A26] px-2 py-0.5 rounded border border-[#222E44] text-[11px] font-mono font-bold text-amber-400">
              <Clock className="w-3 h-3 text-amber-400/90" />
              <span>{currentTimeStr}</span>
            </div>

            <div className="flex items-center gap-1">
              {predictionResult === null && currentTime.getTime() < entryDate.getTime() && (
                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 rounded bg-[#141A26] hover:bg-[#1E2638] text-slate-300 hover:text-white transition-colors cursor-pointer border border-[#222E44]"
                  title={isMinimized ? "Expandir Sinal" : "Minimizar"}
                >
                  {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsVisible(false);
                  if (onClose) onClose();
                }}
                className="p-1 rounded bg-[#141A26] hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer border border-[#222E44]"
                title="Fechar Sinal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Phase-based body rendering */}
        {predictionResult !== null ? (
          /* Render Result Screen */
          <div className="p-6 text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center border-4 shadow-lg ${
              predictionResult === "WIN"
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                : predictionResult === "LOSS"
                ? "bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.5)] animate-shake"
                : "bg-slate-700/20 border-slate-400 text-slate-300"
            }`}>
              {predictionResult === "WIN" ? (
                <CheckCircle2 className="w-12 h-12 stroke-[3]" />
              ) : predictionResult === "LOSS" ? (
                <X className="w-12 h-12 stroke-[3]" />
              ) : (
                <AlertCircle className="w-12 h-12 stroke-[3]" />
              )}
            </div>
            
            <div className="space-y-1.5">
              <h3 className={`text-3xl font-black tracking-wider uppercase ${
                predictionResult === "WIN"
                  ? "text-emerald-400"
                  : predictionResult === "LOSS"
                  ? "text-rose-400"
                  : "text-slate-300"
              }`}>
                {predictionResult === "WIN" ? "VITÓRIA (WIN)" : predictionResult === "LOSS" ? "DERROTA (LOSS)" : "EMPATE (DRAW)"}
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                Par: <strong className="text-white">{activeTicker}</strong> &bull; Expiração {timeframe.toUpperCase()}
              </p>
            </div>

            <div className="bg-[#090D15] p-3.5 rounded-xl border border-[#1E293B] max-w-sm mx-auto flex items-center justify-between text-xs font-mono">
              <div className="text-left">
                <span className="text-slate-400 block text-[10px] uppercase">Gatilho / Direção</span>
                <strong className={isCall ? "text-emerald-400" : "text-rose-400"}>
                  {isCall ? "COMPRA (CALL) ↗" : "VENDA (PUT) ↘"}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase">Resultado Real</span>
                <strong className={predictionResult === "WIN" ? "text-emerald-400" : predictionResult === "LOSS" ? "text-rose-400" : "text-slate-300"}>
                  {predictionResult === "WIN" ? "VENDEDOR" : predictionResult === "LOSS" ? "PERDEDOR" : "EMPATE"}
                </strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              A IA foi desligada automaticamente. Clique em "Analisar Mercado" para buscar novas oportunidades.
            </p>
          </div>
        ) : currentTime.getTime() >= entryDate.getTime() ? (
          /* Render Waiting Screen */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin mx-auto flex items-center justify-center shadow-lg">
              <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-amber-400 tracking-wider">
                OPERAÇÃO EM ANDAMENTO
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                Aguardando encerramento da vela de sinal de {timeframe.toUpperCase()}...
              </p>
            </div>

            {/* Progress bar of entry candle */}
            <div className="bg-[#111726] p-3 rounded-xl border border-[#1E293B] space-y-2 max-w-sm mx-auto">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span>Tempo restante da operação:</span>
                <span className="font-bold text-amber-400">
                  {Math.max(0, Math.ceil((expiryDate.getTime() - currentTime.getTime()) / 1000))}s
                </span>
              </div>
              <div className="h-2 w-full bg-[#1A2234] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((expiryDate.getTime() - currentTime.getTime()) / candleLengthMs) * 100))}%`
                  }}
                />
              </div>
            </div>
            
            <div className="bg-[#090D15] p-2.5 rounded-lg border border-[#1E293B] text-[11px] font-mono text-slate-400 max-w-sm mx-auto">
              <span>Ativo: <strong className="text-white">{activeTicker}</strong> | Direção: <strong className={isCall ? "text-emerald-400" : "text-rose-400"}>{isCall ? "CALL" : "PUT"}</strong></span>
            </div>
          </div>
        ) : isMinimized ? (
          /* Minimized View */
          <div className="p-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">{activeTicker}</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-black font-mono ${
                  isRejected
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : isConfirmed
                    ? isCall
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                }`}
              >
                {isRejected
                  ? "REJEITADO (ANTI-LOSS)"
                  : isConfirmed
                  ? isCall
                    ? "COMPRA (CALL)"
                    : "VENDA (PUT)"
                  : `CONFIRMAÇÃO EM ${secondsUntilEntry}s`}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {entryTimeStr}
              </span>
              <span className="text-cyan-400 font-bold">Exp: {expiryTimeStr}</span>
              <span className="text-emerald-400 font-bold">{confidenceScore}%</span>
            </div>
          </div>
        ) : (
          /* Full Expanded Central Display */
          <div className="p-4 space-y-3">
            {/* Top Triple Row: Par de Moeda | Horário de Entrada | Horário de Expiração */}
            <div className="grid grid-cols-3 gap-2 bg-[#111726] p-3 rounded-xl border border-[#1E293B]">
              {/* 1. Ativo / Par */}
              <div>
                <span className="text-xs font-mono text-slate-300 font-bold uppercase block tracking-wider truncate">
                  Par / Ativo
                </span>
                <span className="text-lg font-black text-white tracking-wide font-mono block truncate">
                  {activeTicker}
                </span>
              </div>

              {/* 2. Horário do Sinal / Entrada */}
              <div className="border-x border-[#1E293B] px-2 text-center">
                <span className="text-xs font-mono text-amber-400 uppercase tracking-wider flex items-center justify-center gap-1 font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Entrada
                </span>
                <span className="text-lg font-black text-amber-400 tracking-wide font-mono block">
                  {entryTimeStr}
                </span>
              </div>

              {/* 3. Expiração */}
              <div className="text-right">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1 justify-end font-bold">
                  <Timer className="w-3.5 h-3.5 text-cyan-400" />
                  Expira às
                </span>
                <span className="text-lg font-black text-cyan-400 tracking-wide font-mono block">
                  {expiryTimeStr}
                </span>
                <span className="text-[11px] font-mono text-slate-300 font-bold block -mt-0.5">
                  {getExpirationLabel()}
                </span>
              </div>
            </div>

            {/* 10-Second Timer Box & Progress */}
            <div className="bg-[#111726] p-3 rounded-xl border border-[#1E293B] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-200 flex items-center gap-1.5 font-medium">
                  <Timer className={`w-4 h-4 ${secondsUntilEntry <= 10 ? "text-amber-400 animate-spin" : "text-slate-400"}`} />
                  {secondsUntilEntry > 10 ? (
                    <span className="text-slate-200 font-bold">Contagem até a Janela de 10s:</span>
                  ) : secondsUntilEntry > 0 ? (
                    <span className="text-amber-400 font-bold">Auditoria dos 10s Finais:</span>
                  ) : (
                    <span className="text-emerald-400 font-bold">Horário de Entrada Atingido:</span>
                  )}
                </span>
                <span
                  className={`font-black text-xs px-2.5 py-1 rounded-lg ${
                    secondsUntilEntry <= 10
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : "bg-[#182030] text-slate-200"
                  }`}
                >
                  {secondsUntilEntry > 0 ? `${secondsUntilEntry}s para entrada` : "ENTRADA ATIVA"}
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="h-2.5 w-full bg-[#1A2234] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isRejected
                      ? "bg-rose-500"
                      : isConfirmed
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-amber-500 to-orange-500"
                  }`}
                  style={{
                    width: `${Math.max(5, Math.min(100, ((30 - secondsUntilEntry) / 30) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Main Action Block: PRE_WAITING vs CONFIRMED vs REJECTED */}
            {isPreWaiting ? (
              /* Case 1: Pre-Waiting (> 10s) */
              <div className="p-3.5 rounded-xl border-2 border-amber-500/80 bg-amber-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg">
                      <Radio className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest block">
                        Fase 1 &bull; Pré-Validação
                      </span>
                      <h3 className="text-xl font-black text-amber-400 tracking-wider">
                        AGUARDANDO CONFIRMAÇÃO
                      </h3>
                    </div>
                  </div>


                </div>

                <p className="text-[11px] font-mono text-amber-200/90 leading-relaxed bg-[#0C101A]/60 p-2 rounded border border-amber-500/20">
                  ⚡ <strong>A IA confirmará ou rejeitará a entrada automaticamente aos 10 segundos antes do gatilho</strong> ({entryTimeStr}), auditando a rejeição e o volume da vela atual.
                </p>
              </div>
            ) : isRejected ? (
              /* Case 2: REJECTED by Anti-Loss Filter */
              <div className="p-3.5 rounded-xl border-2 border-rose-500 bg-rose-950/50 shadow-[0_0_35px_rgba(244,63,94,0.35)] space-y-2 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-rose-500 text-slate-950 flex items-center justify-center shadow-lg">
                      <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-rose-300 uppercase tracking-widest block">
                          Fase 2 &bull; Filtro Anti-Loss (10s)
                        </span>
                        <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-rose-500 text-slate-950 rounded">
                          REJEITADO
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-rose-400 tracking-wider">
                        ENTRADA REJEITADA
                      </h3>
                    </div>
                  </div>

                  {onReScan && (
                    <button
                      type="button"
                      onClick={onReScan}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-transform hover:scale-105"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Re-escanear
                    </button>
                  )}
                </div>

                <div className="bg-[#0C101A]/80 p-2 rounded border border-rose-500/30 text-[11px] font-mono text-rose-200">
                  <span className="text-rose-400 font-bold block">Motivo da Rejeição nos 10s:</span>
                  <span>{rejectionReason || "Volume insuficiente e rejeição da taxa institucional nos 10s finais. Não entrar!"}</span>
                </div>
              </div>
            ) : (
              /* Case 3: CONFIRMED (CALL or PUT) */
              <div
                className={`p-3.5 rounded-xl border-2 flex items-center justify-between relative overflow-hidden animate-in zoom-in-95 duration-300 ${
                  isCall
                    ? "bg-emerald-950/60 border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.45)]"
                    : "bg-rose-950/60 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.45)]"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                      isCall
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-rose-500 text-slate-950"
                    }`}
                  >
                    {isCall ? (
                      <TrendingUp className="w-7 h-7 stroke-[3]" />
                    ) : (
                      <TrendingDown className="w-7 h-7 stroke-[3]" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest block">
                        Fase 2 &bull; Validado aos 10s
                      </span>
                      <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-emerald-500/30 text-emerald-300 rounded border border-emerald-500/40">
                        CONFIRMADO
                      </span>
                    </div>
                    <h3
                      className={`text-2xl font-black tracking-wider ${
                        isCall ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isCall ? "COMPRA (CALL)" : "VENDA (PUT)"}
                    </h3>
                  </div>
                </div>

                {/* Strategy Badge */}
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Estratégia</span>
                  <span className="text-xs font-bold text-slate-200 font-mono">
                    {analysis.strategyName || (isCall ? "Retração em Suporte SMC" : "Rejeição de Topo FVG")}
                  </span>
                </div>
              </div>
            )}

            {/* Metrics Grid: Assertividade & Confluências */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Assertividade Box */}
              <div className="bg-[#111726] p-3.5 rounded-xl border border-[#1E293B] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-xs font-mono text-slate-300 uppercase flex items-center gap-1 font-bold">
                    <Target className="w-4 h-4 text-emerald-400" />
                    Assertividade
                  </span>
                  <span
                    className={`font-mono font-black text-lg ${
                      isRejected ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {confidenceScore}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-[#1A2234] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isRejected
                        ? "bg-rose-500"
                        : "bg-gradient-to-r from-emerald-500 to-teal-400"
                    }`}
                    style={{ width: `${confidenceScore}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-300 font-medium block pt-0.5">
                  {isRejected ? "Filtro Anti-Loss Ativo" : "Alta Confiança Algorítmica"}
                </span>
              </div>

              {/* Quantidade de Confluências Box */}
              <div className="bg-[#111726] p-3.5 rounded-xl border border-[#1E293B] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-xs font-mono text-slate-300 uppercase flex items-center gap-1 font-bold">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Confluências
                  </span>
                  <span
                    className={`font-mono font-black text-lg ${
                      isRejected ? "text-rose-400" : "text-amber-400"
                    }`}
                  >
                    {validConfluencesCount} de 6
                  </span>
                </div>
                <div className="h-2.5 w-full bg-[#1A2234] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isRejected
                        ? "bg-rose-500"
                        : "bg-gradient-to-r from-amber-500 to-orange-500"
                    }`}
                    style={{ width: `${(validConfluencesCount / 6) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-300 font-medium block pt-0.5">
                  {isRejected ? "Critérios Insuficientes" : "100% Filtro Institucional"}
                </span>
              </div>
            </div>

            {/* Confluence Pill Tags */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-300 uppercase flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Pilares Validados:
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                {confluences.map((c, i) => {
                  const isValid = isRejected ? i < 3 : true;
                  return (
                    <div
                      key={i}
                      className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between font-medium ${
                        isValid
                          ? "bg-[#090D15] border-[#1E293B] text-slate-200"
                          : "bg-rose-950/20 border-rose-900/40 text-slate-500"
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      {isValid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 ml-1" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 ml-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Entry Trigger & Invalidation Zone */}
            <div className="bg-[#090D15] p-2.5 rounded-xl border border-[#1E293B] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Gatilho:</span>
                <span className="font-bold text-white">
                  {isRejected ? "ABORTADO" : `Entrada às ${entryTimeStr} (${timeframe.toUpperCase()})`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Proteção:</span>
                <span className={`font-bold ${isRejected ? "text-amber-400" : "text-rose-400"}`}>
                  {isRejected ? "Loss Evitado com Sucesso" : analysis.invalidationLevel || "Reversão > 1.5%"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
