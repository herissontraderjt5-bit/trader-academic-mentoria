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
  BookOpen,
} from "lucide-react";
import { AiAnalysisResult, TechnicalIndicators, Candle, TradeRecord, BankrollConfig } from "../../../types";
import { soundManager } from "../utils/soundEffects";
import { candlexApiService } from "../services/apiService";
import { getCandleTimeRemaining, getSynchronizedDate, getSynchronizedTimestamp, detectColorAlternation } from "../utils/technicalIndicators";
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
  onSaveSignalTrade?: (trade: TradeRecord) => void;
  onDeleteSignalTrade?: (id: string) => void;
  onOpenOperations?: () => void;
  bankrollConfig?: BankrollConfig;
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
  onSaveSignalTrade,
  onDeleteSignalTrade,
  onOpenOperations,
  bankrollConfig,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [lastSignalTimestamp, setLastSignalTimestamp] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(getSynchronizedDate());
  
  // Real technical decision states
  const [decision, setDecision] = useState<"PENDING" | "CONFIRMED" | "REJECTED">("PENDING");
  const [resolvedDir, setResolvedDir] = useState<"CALL" | "PUT" | "NEUTRAL">("NEUTRAL");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const lastDecisionCandleStartRef = useRef<number | null>(null);
  const hasAnnouncedDecisionRef = useRef<boolean>(false);
  const hasRegisteredPendingRef = useRef<boolean>(false);
  const lockedEntryPriceRef = useRef<number | null>(null);
  const isResolvingRef = useRef<boolean>(false);

  const [predictionResult, setPredictionResult] = useState<"WIN" | "LOSS" | "DRAW" | null>(null);
  const [hasResolvedOutcome, setHasResolvedOutcome] = useState<boolean>(false);

  const handleRecordOutcomeDirectly = (outcome: "WIN" | "LOSS" | "DRAW") => {
    isResolvingRef.current = true;
    setHasResolvedOutcome(true);
    setPredictionResult(outcome);

    const entryCandleSecs = Math.floor(entryDate.getTime() / 1000);
    const candleLengthSecs = Math.max(60, Math.floor(candleLengthMs / 1000));
    let tradeCandle = candles.find((c) => c.time === entryCandleSecs);
    if (!tradeCandle) {
      tradeCandle = candles.find((c) => Math.abs(c.time - entryCandleSecs) < (candleLengthSecs / 2));
    }
    if (!tradeCandle && candles.length > 0) {
      const pastCandles = candles.filter((c) => c.time <= entryCandleSecs);
      tradeCandle = pastCandles.length > 0 ? pastCandles[pastCandles.length - 1] : candles[candles.length - 1];
    }

    const entryPrice = lockedEntryPriceRef.current || (tradeCandle ? tradeCandle.open : (analysis?.priceAtAnalysis || 100));
    const expiryPrice = tradeCandle ? tradeCandle.close : entryPrice;

    if (outcome === "WIN") {
      soundManager.playWin();
      soundManager.speakAlert(`Vitória confirmada em ${activeTicker}!`);
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } catch {}
    } else if (outcome === "LOSS") {
      soundManager.playLoss();
      soundManager.speakAlert(`Derrota registrada em ${activeTicker}.`);
    } else {
      soundManager.speakAlert(`Empate registrado em ${activeTicker}.`);
    }

    if (onSaveSignalTrade && analysis) {
      const expiryMins = timeframe.toLowerCase().includes("5m") || timeframe === "5" ? 5 : timeframe.toLowerCase().includes("2m") || timeframe === "2" ? 2 : 1;
      const stakeAmount = bankrollConfig?.initialBalance ? +(bankrollConfig.initialBalance * 0.01).toFixed(2) : 10;
      const payout = 89;
      const pnl = outcome === "WIN" ? +((stakeAmount * payout) / 100).toFixed(2) : outcome === "LOSS" ? -stakeAmount : 0;

      const finalizedTrade: TradeRecord = {
        id: signalTradeId,
        timestamp: entryDate.getTime(),
        ticker: activeTicker,
        direction: resolvedDirection === "CALL" ? "CALL" : "PUT",
        entryPrice,
        expiryPrice,
        stake: stakeAmount,
        payoutPercent: payout,
        expiryMinutes: expiryMins,
        result: outcome,
        pnl,
        strategyUsed: analysis.strategyName || "CandleX Confluence Core",
        confidenceAtEntry: analysis.confidenceScore || 90,
        notes: `Resultado: ${outcome} (Entrada: ${entryPrice} / Saída: ${expiryPrice})`,
      };
      onSaveSignalTrade(finalizedTrade);
    }
  };

  const handleCloseModal = () => {
    setIsVisible(false);
    if (onClearAnalysis) {
      onClearAnalysis();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleCancelAnalysis = () => {
    // 1. ONLY remove trade from operations if the operation was NOT already finalized (e.g. while still pending/in-progress)
    const isAlreadyFinalized = predictionResult !== null || hasResolvedOutcome;
    if (!isAlreadyFinalized && hasRegisteredPendingRef.current && onDeleteSignalTrade) {
      onDeleteSignalTrade(signalTradeId);
    }
    
    // 2. Reset internal state
    setIsVisible(false);
    setPredictionResult(null);
    setHasResolvedOutcome(false);
    isResolvingRef.current = false;
    hasRegisteredPendingRef.current = false;
    lockedEntryPriceRef.current = null;
    
    // 3. Clear analysis on parent workstation (deactivating AI until next click on Analisar Mercado)
    if (onClearAnalysis) {
      onClearAnalysis();
    }
    if (onClose) {
      onClose();
    }
  };

  // Dragging state for overlay
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only allow left click
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input")) return;

    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    if (isVisible) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isVisible]);

  // Thresholds for confirmation and decision
  const { confirmationThreshold, decisionThreshold, candleLengthMs } = useMemo(() => {
    const tf = timeframe.toLowerCase();
    if (tf.includes("1h") || tf === "60" || tf === "m60" || tf === "60m") {
      return { confirmationThreshold: 1800, decisionThreshold: 300, candleLengthMs: 3600 * 1000 };
    }
    if (tf.includes("30m") || tf === "30" || tf === "m30") {
      return { confirmationThreshold: 900, decisionThreshold: 120, candleLengthMs: 1800 * 1000 };
    }
    if (tf.includes("15m") || tf === "15" || tf === "m15") {
      return { confirmationThreshold: 450, decisionThreshold: 60, candleLengthMs: 900 * 1000 };
    }
    if (tf.includes("5m") || tf === "5" || tf === "m5") {
      return { confirmationThreshold: 150, decisionThreshold: 30, candleLengthMs: 300 * 1000 };
    }
    if (tf.includes("3m") || tf === "3" || tf === "m3") {
      return { confirmationThreshold: 90, decisionThreshold: 15, candleLengthMs: 180 * 1000 };
    }
    if (tf.includes("2m") || tf === "2" || tf === "m2") {
      return { confirmationThreshold: 60, decisionThreshold: 15, candleLengthMs: 120 * 1000 };
    }
    // M1 / default timeframe: 15 seconds decision window (confirms strictly between 15s and 1s before candle expiration)
    return { confirmationThreshold: 30, decisionThreshold: 15, candleLengthMs: 60 * 1000 };
  }, [timeframe]);

  // Calculate real remaining seconds on the current candle using unified time utility
  const { remainingSeconds: secondsRemaining } = useMemo(() => {
    return getCandleTimeRemaining(currentTime, timeframe);
  }, [currentTime, timeframe]);

  // Check how many seconds were remaining on the candle at the exact moment analysis was requested
  const secondsRemainingAtAnalysis = useMemo(() => {
    const ts = analysis?.timestamp || getSynchronizedTimestamp();
    const tsDate = new Date(ts);
    return getCandleTimeRemaining(tsDate, timeframe).remainingSeconds;
  }, [analysis?.timestamp, timeframe]);

  // Start of current candle
  const currentCandleStart = useMemo(() => {
    const ms = currentTime.getTime();
    return Math.floor(ms / candleLengthMs) * candleLengthMs;
  }, [currentTime, candleLengthMs]);

  // Target candle entry start time: Entry is ALWAYS set to the open of the NEXT candle
  const signalCandleStart = useMemo(() => {
    const ts = analysis?.timestamp || getSynchronizedTimestamp();
    const baseStart = Math.floor(ts / candleLengthMs) * candleLengthMs;
    return baseStart + candleLengthMs;
  }, [analysis?.timestamp, candleLengthMs]);

  const isNextCandleSignal = true;

  // Dates for entry and expiry corresponding strictly to the target candle
  const entryDate = useMemo(() => {
    return new Date(signalCandleStart);
  }, [signalCandleStart]);

  const signalTradeId = useMemo(() => {
    return `candlex_sig_${analysis?.timestamp || signalCandleStart}`;
  }, [analysis?.timestamp, signalCandleStart]);

  const expiryDate = useMemo(() => {
    return new Date(signalCandleStart + candleLengthMs);
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
  const secondsUntilEntry = Math.max(0, Math.ceil((entryDate.getTime() - currentTime.getTime()) / 1000));

  const signalStatus: SignalStatus = useMemo(() => {
    if (decision === "CONFIRMED") return "CONFIRMED";
    if (decision === "REJECTED") return "REJECTED";
    if (secondsRemaining <= decisionThreshold && currentTime.getTime() < entryDate.getTime()) return "AUDITING_10S";
    return "PRE_WAITING";
  }, [decision, secondsRemaining, decisionThreshold, currentTime, entryDate]);

  // Live clock updating every 100ms with Exchange/TradingView synchronized time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getSynchronizedDate());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Reset overlay when a new analysis is generated
  useEffect(() => {
    if (analysis && analysis.timestamp && analysis.timestamp !== lastSignalTimestamp) {
      setLastSignalTimestamp(analysis.timestamp);
      setIsVisible(true);
      setIsMinimized(false);
      lastDecisionCandleStartRef.current = null;
      hasAnnouncedDecisionRef.current = false;
      hasRegisteredPendingRef.current = false;
      lockedEntryPriceRef.current = null;
      isResolvingRef.current = false;
      setPredictionResult(null);
      setHasResolvedOutcome(false);
      setPosition({ x: 0, y: 0 }); // Reset drag position to center

      // Initialize in PENDING phase - strictly aguardando auditoria dos 15s a 1s da expiração da vela
      setDecision("PENDING");
      setResolvedDir("NEUTRAL");
      setRejectionReason("");

      // Check if this analysis is cancelled at generation time (Quadrant, < 5 confluences, < 80% assertiveness)
      const patterns = analysis.detectedPatterns || [];
      const hasQuadrantWarning = patterns.some((p) =>
        p.toLowerCase().includes("quadrante") ||
        p.toLowerCase().includes("mercado xadrez") ||
        p.toLowerCase().includes("sem fluxo direcional")
      );

      const isNeutral = analysis.direction === "NEUTRAL";
      const isLowConfidence = (analysis.confidenceScore || 0) < 80;
      const isLowConfluence = patterns.length < 5;

      if (isNeutral || isLowConfidence || isLowConfluence || hasQuadrantWarning) {
        setDecision("REJECTED");
        setResolvedDir("NEUTRAL");
        hasAnnouncedDecisionRef.current = true;
        if (hasRegisteredPendingRef.current && onDeleteSignalTrade) {
          onDeleteSignalTrade(signalTradeId);
          hasRegisteredPendingRef.current = false;
        }
        const rejectTxt = analysis.rationale ||
          (hasQuadrantWarning
            ? "Filtro Anti-Loss Ativado: Quadrante de cores alternadas (mercado xadrez sem fluxo direcional)."
            : isLowConfluence
            ? `Filtro Anti-Loss Ativado: Apenas ${patterns.length} confluência(s) detectada(s). O CandleX exige no mínimo 5 confluências.`
            : `Assertividade insuficiente (${analysis.confidenceScore}% < 80%).`);
        setRejectionReason(rejectTxt);
        soundManager.playRejectAlert();
        soundManager.speakAlert("Sinal cancelado pelo Filtro Anti-Loss");
      }
    }
  }, [analysis, lastSignalTimestamp, activeTicker, onDeleteSignalTrade, signalTradeId]);

  // Active Decision Engine when entering the decision window (only during preparation candle!)
  useEffect(() => {
    if (isAnalyzing || !analysis || !isVisible) return;

    // Only evaluate during the preparation candle BEFORE entryDate and only once per signal
    const nowMs = currentTime.getTime();
    if (nowMs >= entryDate.getTime() || decision !== "PENDING" || hasAnnouncedDecisionRef.current) {
      return;
    }

    if (secondsRemaining <= decisionThreshold && secondsRemaining > 0) {
      try {
        hasAnnouncedDecisionRef.current = true;
        lastDecisionCandleStartRef.current = currentCandleStart;

        const patterns = analysis.detectedPatterns || [];
        const confluenceCount = patterns.length;
        const confidence = analysis.confidenceScore || 0;
        const dir = analysis.direction;

        // RULE 0: PREVIOUS / PREPARATION CANDLE COLOR ALIGNMENT
        const lastClosedCandle = candles.length > 0 ? candles[candles.length - 1] : null;
        if (lastClosedCandle) {
          const isCandleGreen = lastClosedCandle.close > lastClosedCandle.open;
          const isCandleRed = lastClosedCandle.close < lastClosedCandle.open;

          if (dir === "CALL" && isCandleRed) {
            setDecision("REJECTED");
            setResolvedDir("NEUTRAL");
            setRejectionReason("Filtro Anti-Loss Ativado: A vela anterior fechou negativa (Vermelha), contrariando o gatilho de Compra (CALL). O CandleX exige vela a favor do fluxo para confirmação.");
            soundManager.playRejectAlert();
            soundManager.speakAlert("Sinal cancelado: Vela anterior fechou negativa");
            return;
          }

          if (dir === "PUT" && isCandleGreen) {
            setDecision("REJECTED");
            setResolvedDir("NEUTRAL");
            setRejectionReason("Filtro Anti-Loss Ativado: A vela anterior fechou positiva (Verde), contrariando o gatilho de Venda (PUT). O CandleX exige vela a favor do fluxo para confirmação.");
            soundManager.playRejectAlert();
            soundManager.speakAlert("Sinal cancelado: Vela anterior fechou positiva");
            return;
          }
        }

        // RULE 1: QUADRANT COLOR ALTERNATION CHECK
        const hasQuadrantWarning = patterns.some((p) =>
          p.toLowerCase().includes("quadrante") ||
          p.toLowerCase().includes("mercado xadrez") ||
          p.toLowerCase().includes("sem fluxo direcional") ||
          p.toLowerCase().includes("alternância") ||
          p.toLowerCase().includes("alternancia")
        );

        if (indicators?.isAlternatingQuadrant || hasQuadrantWarning || detectColorAlternation(candles).isAlternating) {
          setDecision("REJECTED");
          setResolvedDir("NEUTRAL");
          setRejectionReason("Filtro Anti-Loss Ativado: Quadrante de cores alternadas (mercado xadrez sem fluxo direcional). Entrada cancelada para proteger seu capital contra falso rompimento.");
          soundManager.playRejectAlert();
          soundManager.speakAlert("Sinal cancelado: Quadrante de cores alternadas detectado");
          return;
        }

        // RULE 2: LOW CONFLUENCES CHECK (< 5 CONFLUENCES)
        if (confluenceCount < 5) {
          setDecision("REJECTED");
          setResolvedDir(dir);
          setRejectionReason(`Filtro Anti-Loss Ativado: Confluências insuficientes (${confluenceCount} < 5 confluências). O CandleX exige no mínimo 5 confluências institucionais para validar a entrada com segurança.`);
          soundManager.playRejectAlert();
          soundManager.speakAlert("Sinal cancelado por confluências insuficientes");
          return;
        }

        // RULE 3: LOW ACCURACY CHECK (< 80%)
        if (confidence < 80 || dir === "NEUTRAL") {
          setDecision("REJECTED");
          setResolvedDir(dir);
          setRejectionReason(`Assertividade insuficiente (${confidence}% < 80%). O CandleX exige no mínimo 80% de assertividade institucional para validar a entrada com segurança.`);
          soundManager.playRejectAlert();
          soundManager.speakAlert("Sinal cancelado: Assertividade abaixo de 80%");
          return;
        }

        // ALL RULES PASSED -> CONFIRM SIGNAL!
        setDecision("CONFIRMED");
        setResolvedDir(dir);
        if (dir === "CALL") {
          soundManager.playCallAlert();
          soundManager.speakAlert(`Sinal confirmado: COMPRA em ${activeTicker}`);
        } else {
          soundManager.playPutAlert();
          soundManager.speakAlert(`Sinal confirmado: VENDA em ${activeTicker}`);
        }
      } catch (err) {
        console.error("Erro na auditoria de decisão do sinal:", err);
      }
    }
  }, [
    secondsRemaining,
    decisionThreshold,
    currentCandleStart,
    isAnalyzing,
    analysis,
    indicators,
    candles,
    activeTicker,
    isVisible,
    currentTime,
    entryDate,
    decision,
  ]);



  // Lock entry price and register pending trade when entry candle starts
  useEffect(() => {
    if (!analysis || isAnalyzing || !isVisible || decision === "REJECTED") return;

    const nowMs = currentTime.getTime();
    if (nowMs >= entryDate.getTime()) {
      if (decision === "PENDING") {
        setDecision("CONFIRMED");
      }
      if (lockedEntryPriceRef.current === null) {
        const entryCandleSecs = Math.floor(entryDate.getTime() / 1000);
        const candleLengthSecs = Math.max(60, Math.floor(candleLengthMs / 1000));
        
        // Try exact match or match within current timeframe candle
        let exactCandle = candles.find((c) => c.time === entryCandleSecs);
        if (!exactCandle) {
          exactCandle = candles.find((c) => Math.abs(c.time - entryCandleSecs) < (candleLengthSecs / 2));
        }

        if (isNextCandleSignal) {
          // For NEXT CANDLE signal (<=20s remaining), entry price is the OPEN price of the next candle
          if (exactCandle) {
            lockedEntryPriceRef.current = exactCandle.open;
          } else if (candles.length > 0) {
            const lastCandle = candles[candles.length - 1];
            lockedEntryPriceRef.current = lastCandle.close;
          } else {
            lockedEntryPriceRef.current = analysis.priceAtAnalysis || 100;
          }
        } else {
          // For CURRENT CANDLE signal (>20s remaining), entry price is the exact price at signal generation time
          lockedEntryPriceRef.current = analysis.priceAtAnalysis || (exactCandle ? exactCandle.open : 100);
        }
      }

      if (!hasRegisteredPendingRef.current && onSaveSignalTrade) {
        hasRegisteredPendingRef.current = true;
        const expiryMins = Math.max(1, Math.round(candleLengthMs / 60000));
        const stakeAmount = bankrollConfig?.initialBalance ? +(bankrollConfig.initialBalance * 0.01).toFixed(2) : 10;
        const targetLabel = isNextCandleSignal ? "Próxima Vela" : "Vela Atual";
        
        const pendingTrade: TradeRecord = {
          id: signalTradeId,
          timestamp: entryDate.getTime(),
          ticker: activeTicker,
          direction: resolvedDirection === "CALL" ? "CALL" : "PUT",
          entryPrice: lockedEntryPriceRef.current || analysis.priceAtAnalysis || 100,
          stake: stakeAmount,
          payoutPercent: 89,
          expiryMinutes: expiryMins,
          result: "PENDING",
          pnl: 0,
          strategyUsed: analysis.strategyName || "CandleX Confluence Core",
          confidenceAtEntry: analysis.confidenceScore || 90,
          notes: `Entrada aos ${entryTimeStr} (${targetLabel}) - Assertividade ${analysis.confidenceScore}%`,
        };
        onSaveSignalTrade(pendingTrade);
      }
    }
  }, [currentTime, entryDate, decision, analysis, isAnalyzing, isVisible, candles, activeTicker, resolvedDirection, timeframe, candleLengthMs, bankrollConfig, onSaveSignalTrade, entryTimeStr, signalTradeId, isNextCandleSignal]);

  // AUTOMATIC OUTCOME RESOLUTION (WIN / LOSS / DOJI) WHEN EXPIRY TIME IS REACHED
  useEffect(() => {
    if (!analysis || isAnalyzing || !isVisible || decision === "REJECTED") return;

    const nowMs = currentTime.getTime();
    if (nowMs >= expiryDate.getTime() && !hasResolvedOutcome && !isResolvingRef.current) {
      isResolvingRef.current = true;
      setHasResolvedOutcome(true);

      const entryCandleSecs = Math.floor(entryDate.getTime() / 1000);
      const candleLengthSecs = Math.max(60, Math.floor(candleLengthMs / 1000));

      // Locate the exact operational candle (starts at entryDate)
      let tradeCandle = candles.find((c) => c.time === entryCandleSecs);
      if (!tradeCandle) {
        tradeCandle = candles.find((c) => Math.abs(c.time - entryCandleSecs) < (candleLengthSecs / 2));
      }
      if (!tradeCandle && candles.length > 0) {
        // Take the candle that covers the trade period
        const pastCandles = candles.filter((c) => c.time <= entryCandleSecs);
        tradeCandle = pastCandles.length > 0 ? pastCandles[pastCandles.length - 1] : candles[candles.length - 1];
      }

      const entryPrice = lockedEntryPriceRef.current || (isNextCandleSignal ? (tradeCandle ? tradeCandle.open : (analysis.priceAtAnalysis || 100)) : (analysis.priceAtAnalysis || (tradeCandle ? tradeCandle.open : 100)));
      const expiryPrice = tradeCandle ? tradeCandle.close : entryPrice;
      const priceDiff = +(expiryPrice - entryPrice).toFixed(6);

      const dir = resolvedDirection === "CALL" ? "CALL" : "PUT";
      let outcome: "WIN" | "LOSS" | "DRAW" = "DRAW";

      if (Math.abs(priceDiff) <= 0.000001) {
        outcome = "DRAW";
      } else if (dir === "CALL") {
        // COMPRA (CALL): Win se a vela fechou acima da entrada (close > entryPrice)
        // Loss se a vela fechou abaixo da entrada (close < entryPrice)
        outcome = expiryPrice > entryPrice ? "WIN" : "LOSS";
      } else if (dir === "PUT") {
        // VENDA (PUT): Win se a vela fechou abaixo da entrada (close < entryPrice)
        // Loss se a vela fechou acima da entrada (close > entryPrice)
        outcome = expiryPrice < entryPrice ? "WIN" : "LOSS";
      }

      setPredictionResult(outcome);

      // Sound, speech and celebratory effects
      if (outcome === "WIN") {
        soundManager.playWin();
        soundManager.speakAlert(`Vitória confirmada! Operação em ${activeTicker} finalizada com WIN.`);
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      } else if (outcome === "LOSS") {
        soundManager.playLoss();
        soundManager.speakAlert(`Derrota registrada em ${activeTicker}. Siga o gerenciamento de banca.`);
      } else {
        soundManager.speakAlert(`Operação encerrada em Empate (Doji) em ${activeTicker}. Capital protegido.`);
      }

      // Update trade in history & bankroll
      if (onSaveSignalTrade) {
        const expiryMins = Math.max(1, Math.round(candleLengthMs / 60000));
        const stakeAmount = bankrollConfig?.initialBalance ? +(bankrollConfig.initialBalance * 0.01).toFixed(2) : 10;
        const payout = 89;
        const pnl = outcome === "WIN" ? +((stakeAmount * payout) / 100).toFixed(2) : outcome === "LOSS" ? -stakeAmount : 0;

        const finalizedTrade: TradeRecord = {
          id: signalTradeId,
          timestamp: entryDate.getTime(),
          ticker: activeTicker,
          direction: dir,
          entryPrice,
          expiryPrice,
          stake: stakeAmount,
          payoutPercent: payout,
          expiryMinutes: expiryMins,
          result: outcome,
          pnl,
          strategyUsed: analysis.strategyName || "CandleX Confluence Core",
          confidenceAtEntry: analysis.confidenceScore || 90,
          notes: `Resultado: ${outcome} (Entrada: ${entryPrice} / Saída: ${expiryPrice})`,
        };
        onSaveSignalTrade(finalizedTrade);
      }
    }
  }, [
    currentTime,
    expiryDate,
    hasResolvedOutcome,
    decision,
    analysis,
    isAnalyzing,
    isVisible,
    candles,
    resolvedDirection,
    activeTicker,
    timeframe,
    candleLengthMs,
    bankrollConfig,
    entryDate,
    onSaveSignalTrade,
    signalTradeId,
  ]);

  // Keep rejected modal visible so the trader can read the reason and decide next action (no auto-blackout)

  // Auto-dismiss confirmation after the entry candle begins to let user view chart cleanly
  useEffect(() => {
    if (!analysis || isAnalyzing || !isVisible) return;
    if (currentTime.getTime() >= entryDate.getTime() + 6000 && !isMinimized && predictionResult === null) {
      setIsMinimized(true);
    }
  }, [currentTime, entryDate, analysis, isAnalyzing, isVisible, isMinimized, predictionResult]);

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

  const isRejected = decision === "REJECTED" || analysis.direction === "NEUTRAL";
  const isConfirmed = decision === "CONFIRMED" && !isRejected;
  const isAuditing = decision === "PENDING" && secondsRemaining <= decisionThreshold && secondsRemaining > 0 && !isRejected;
  const isPreWaiting = decision === "PENDING" && secondsRemaining > decisionThreshold && !isRejected;

  const validConfluencesCount = isRejected ? (analysis.detectedPatterns?.length || 3) : confluences.length;
  const confidenceScore = isRejected ? (analysis.confidenceScore || 50) : (analysis.confidenceScore || 90);

  const getExpirationLabel = () => {
    const tf = timeframe.toLowerCase();
    if (tf.includes("1m") || tf === "1" || tf === "m1") return "M1 (1 Minuto)";
    if (tf.includes("5m") || tf === "5" || tf === "m5") return "M5 (5 Minutos)";
    if (tf.includes("15m") || tf === "15" || tf === "m15") return "M15 (15 Minutos)";
    if (tf.includes("30m") || tf === "30" || tf === "m30") return "M30 (30 Minutos)";
    if (tf.includes("1h") || tf === "60" || tf === "1h") return "H1 (1 Hora)";
    return analysis.timeframeExpiry || `${timeframe.toUpperCase()}`;
  };

  return (
    <div
      id="center-signal-hud-container"
      className="absolute inset-0 pointer-events-none flex items-center justify-center p-4 z-40"
    >
      <div
        id="center-signal-hud-card"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
        className={`pointer-events-auto transition-[border-color,background-color,box-shadow] duration-300 w-full max-w-lg bg-[#0C101A]/95 backdrop-blur-xl border-2 rounded-2xl shadow-[0_0_55px_rgba(0,0,0,0.85)] overflow-hidden select-none animate-in zoom-in-95 fade-in duration-300 ${
          predictionResult !== null
            ? predictionResult === "WIN"
              ? "border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.6)]"
              : predictionResult === "LOSS"
              ? "border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.6)] animate-shake"
              : "border-slate-500 shadow-[0_0_50px_rgba(148,163,184,0.4)]"
            : isRejected
            ? "border-rose-600 shadow-[0_0_50px_rgba(225,29,72,0.45)]"
            : currentTime.getTime() >= entryDate.getTime() && decision === "CONFIRMED"
            ? "border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.6)]"
            : isConfirmed
            ? isCall
              ? "border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.45)]"
              : "border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.45)]"
            : "border-amber-500 shadow-[0_0_45px_rgba(245,158,11,0.4)]"
        }`}
      >
        {/* Top Header Bar with Live Clock & Status Badge */}
        <div
          onMouseDown={handleMouseDown}
          className={`px-4 py-2.5 flex items-center justify-between border-b cursor-grab active:cursor-grabbing ${
            predictionResult !== null
              ? predictionResult === "WIN"
                ? "bg-emerald-950/70 border-emerald-500/40"
                : predictionResult === "LOSS"
                ? "bg-rose-950/70 border-rose-500/40"
                : "bg-slate-900 border-slate-700"
              : isRejected
              ? "bg-rose-950/70 border-rose-500/40"
              : currentTime.getTime() >= entryDate.getTime() && decision === "CONFIRMED"
              ? "bg-amber-950/70 border-amber-500/40"
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
                  : isRejected
                  ? "bg-rose-500"
                  : currentTime.getTime() >= entryDate.getTime() && decision === "CONFIRMED"
                  ? "bg-amber-400"
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
              ) : isRejected ? (
                <>
                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                  SINAL CANCELADO (ANTI-LOSS)
                </>
              ) : currentTime.getTime() >= entryDate.getTime() && decision === "CONFIRMED" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  AGUARDANDO RESULTADO...
                </>
              ) : isConfirmed ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  SINAL IA CONFIRMADO (DOS {decisionThreshold}s AOS 1s)
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  AGUARDANDO CONFIRMAÇÃO (DOS {decisionThreshold}s AOS 1s)
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

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCancelAnalysis}
                className="px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-white transition-all cursor-pointer text-[11px] font-mono font-bold flex items-center gap-1 shadow-sm"
                title="Cancelar esta análise e desativar sem contabilizar no histórico"
              >
                <Ban className="w-3.5 h-3.5 text-rose-400" />
                <span>Cancelar Análise</span>
              </button>

              {predictionResult === null && !isRejected && currentTime.getTime() < entryDate.getTime() && (
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
                onClick={predictionResult !== null || isRejected ? handleCloseModal : handleCancelAnalysis}
                className="p-1 rounded bg-[#141A26] hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer border border-[#222E44]"
                title="Fechar Janela"
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
                  {predictionResult === "WIN" ? "VENCEDOR" : predictionResult === "LOSS" ? "PERDEDOR" : "EMPATE"}
                </strong>
              </div>
            </div>

            <p className="text-[11px] text-emerald-400/90 font-mono font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Operação registrada com sucesso no Diário de Trades!
            </p>

            {/* Action Buttons: Diário de Trades, Nova Análise & Fechar */}
            <div className="flex flex-col sm:flex-row items-center gap-2 max-w-sm mx-auto pt-1">
              {onOpenOperations && (
                <button
                  type="button"
                  onClick={onOpenOperations}
                  className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF7A00]/20 via-amber-500/20 to-orange-600/20 hover:from-[#FF7A00]/30 hover:to-orange-600/30 border border-[#FF7A00]/50 text-amber-200 hover:text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg font-mono"
                >
                  <BookOpen className="w-4 h-4 text-[#FF7A00]" />
                  <span>Diário ({trades.length})</span>
                </button>
              )}

              {onReScan && (
                <button
                  type="button"
                  onClick={onReScan}
                  className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-[#1A2234] hover:bg-[#26324D] text-slate-200 hover:text-white border border-[#2D3A54] font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Nova Análise</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono"
              >
                <X className="w-3.5 h-3.5" />
                <span>Fechar</span>
              </button>
            </div>
          </div>
        ) : isRejected ? (
          /* Render Rejected Screen by Anti-Loss Filter */
          <div className="p-6 text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-rose-500/20 border-4 border-rose-500 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.5)] animate-shake">
              <ShieldAlert className="w-9 h-9 stroke-[2.5]" />
            </div>
            
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest block">
                Filtro Institucional Anti-Loss
              </span>
              <h3 className="text-2xl font-black text-rose-400 tracking-wider uppercase">
                SINAL CANCELADO PELA IA
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                Ativo: <strong className="text-white">{activeTicker}</strong> &bull; Timeframe {timeframe.toUpperCase()}
              </p>
            </div>

            <div className="bg-[#0C101A]/90 p-3.5 rounded-xl border border-rose-500/30 max-w-sm mx-auto text-left space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400">
                <Ban className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Auditoria dos {decisionThreshold}s Finais:</span>
              </div>
              <p className="text-xs font-mono text-rose-200/90 leading-relaxed bg-[#14101A] p-2.5 rounded-lg border border-rose-500/20">
                {rejectionReason || "Sinal cancelado por baixa confluência institucional (< 4 confluências). Nenhuma operação foi aberta para proteger seu capital."}
              </p>
            </div>

            <div className="flex items-center gap-2.5 max-w-sm mx-auto pt-1">
              {onReScan && (
                <button
                  type="button"
                  onClick={() => {
                    if (onReScan) onReScan();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600/30 via-rose-500/20 to-amber-600/30 hover:from-rose-600/40 hover:to-amber-600/40 border border-rose-500/50 text-rose-200 hover:text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Escanear Outro Ativo</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsVisible(false);
                  if (onClearAnalysis) onClearAnalysis();
                  if (onClose) onClose();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#1A2234] hover:bg-[#26324D] text-slate-200 hover:text-white border border-[#2D3A54] font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
                <span>Fechar Tela</span>
              </button>
            </div>
          </div>
        ) : decision === "CONFIRMED" && currentTime.getTime() >= entryDate.getTime() && currentTime.getTime() < expiryDate.getTime() ? (
          /* Render Waiting Screen for Active Operation */
          <div className="p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full border-4 border-amber-500/30 border-t-amber-400 animate-spin mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
            
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-widest block">
                {isNextCandleSignal ? "Sinal em Cima da Hora: Próxima Vela Ativa" : "Vela Atual em Operação"}
              </span>
              <h3 className="text-2xl font-black text-amber-400 tracking-wider uppercase">
                OPERAÇÃO EM ANDAMENTO
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                Aguardando encerramento da vela de {timeframe.toUpperCase()} às {expiryTimeStr}...
              </p>
            </div>

            {/* Signal direction & entry price summary card */}
            <div className="grid grid-cols-2 gap-2 bg-[#0D121F] p-3 rounded-xl border border-[#1E293B] max-w-sm mx-auto text-left font-mono">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold block">DIREÇÃO</span>
                <span className={`text-sm font-black flex items-center gap-1 ${isCall ? "text-emerald-400" : "text-rose-400"}`}>
                  {isCall ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {isCall ? "COMPRA (CALL)" : "VENDA (PUT)"}
                </span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-[10px] text-slate-400 font-bold block">TAXA DE ENTRADA</span>
                <span className="text-sm font-black text-amber-300">
                  ${(lockedEntryPriceRef.current || analysis?.priceAtAnalysis || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Progress bar of entry candle */}
            <div className="bg-[#111726] p-3 rounded-xl border border-[#1E293B] space-y-2 max-w-sm mx-auto">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span>Tempo restante da vela:</span>
                <span className="font-bold text-amber-400 text-sm">
                  {Math.max(0, Math.ceil((expiryDate.getTime() - currentTime.getTime()) / 1000))}s
                </span>
              </div>
              <div className="h-2.5 w-full bg-[#1A2234] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((expiryDate.getTime() - currentTime.getTime()) / candleLengthMs) * 100))}%`
                  }}
                />
              </div>
            </div>
            
            <div className="bg-[#090D15] p-2.5 rounded-lg border border-[#1E293B] text-[11px] font-mono text-slate-300 max-w-sm mx-auto">
              <span>Ativo: <strong className="text-white">{activeTicker}</strong> | Expiração: <strong className="text-cyan-400">{expiryTimeStr}</strong></span>
            </div>

            {/* Action buttons during operation */}
            <div className="flex flex-col gap-2 max-w-sm mx-auto w-full">
              {onOpenOperations && (
                <button
                  type="button"
                  onClick={onOpenOperations}
                  className="w-full py-2 px-3.5 rounded-xl bg-[#141A26] hover:bg-[#1E2638] text-amber-300 hover:text-white border border-amber-500/30 flex items-center justify-center gap-2 text-xs font-bold font-mono transition-all cursor-pointer shadow-md"
                >
                  <BookOpen className="w-4 h-4 text-[#FF7A00]" />
                  <span>Ver no Diário de Trades / Operações ({trades.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCancelAnalysis}
                className="w-full py-2.5 px-3.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-200 hover:text-white border border-rose-500/50 flex items-center justify-center gap-2 text-xs font-black font-mono uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                <Ban className="w-4 h-4 text-rose-400" />
                <span>Cancelar Análise (Sem Contabilizar)</span>
              </button>
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
          <div className="p-4 space-y-3.5">
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

            {/* Decision Window Timer Box & Progress */}
            <div className="bg-[#111726] p-3 rounded-xl border border-[#1E293B] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-200 flex items-center gap-1.5 font-medium">
                  <Timer className={`w-4 h-4 ${secondsUntilEntry <= decisionThreshold ? "text-amber-400 animate-spin" : "text-slate-400"}`} />
                  {secondsUntilEntry > decisionThreshold ? (
                    <span className="text-slate-200 font-bold">Contagem até Janela de {decisionThreshold}s:</span>
                  ) : secondsUntilEntry > 0 ? (
                    <span className="text-amber-400 font-bold">Auditoria dos {decisionThreshold}s Finais:</span>
                  ) : (
                    <span className="text-emerald-400 font-bold">Horário de Entrada Atingido:</span>
                  )}
                </span>
                <span
                  className={`font-black text-xs px-2.5 py-1 rounded-lg ${
                    secondsUntilEntry <= decisionThreshold
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse"
                      : "bg-[#182030] text-slate-200"
                  }`}
                >
                  {secondsUntilEntry > 0 ? `${secondsUntilEntry}s para entrada` : "ENTRADA ATIVA"}
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="h-2 w-full bg-[#1A2234] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isRejected
                      ? "bg-rose-500"
                      : isConfirmed
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-amber-500 to-orange-500"
                  }`}
                  style={{
                    width: `${Math.max(5, Math.min(100, ((decisionThreshold * 2 - secondsUntilEntry) / (decisionThreshold * 2)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Main Action Block: PRE_WAITING vs CONFIRMED vs REJECTED */}
            {isPreWaiting ? (
              /* Case 1: Pre-Waiting */
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 text-center space-y-1">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                  FASE 1 &bull; PRÉ-VALIDAÇÃO
                </span>
                <span className="text-sm font-black text-amber-300 block uppercase">
                  AGUARDANDO CONFIRMAÇÃO DO ROBÔ
                </span>
                <p className="text-[10px] text-amber-200/70 font-mono leading-relaxed mt-1">
                  Varredura em tempo real ativa. A auditoria final e confirmação ocorrerão estritamente entre {decisionThreshold}s a 1s da expiração da vela.
                </p>
              </div>
            ) : isRejected ? (
              /* Case 2: REJECTED by Anti-Loss Filter */
              <div className="p-3.5 rounded-xl border border-rose-500 bg-rose-950/30 space-y-2 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                    <div>
                      <span className="text-[9px] font-mono font-bold text-rose-400 uppercase block">
                        Filtro Anti-Loss Ativado
                      </span>
                      <h3 className="text-sm font-black text-rose-400 uppercase tracking-wider">
                        ENTRADA REJEITADA PELA IA
                      </h3>
                    </div>
                  </div>

                  {onReScan && (
                    <button
                      type="button"
                      onClick={onReScan}
                      className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Re-escanear
                    </button>
                  )}
                </div>

                <p className="bg-[#0C101A]/80 p-2 rounded border border-rose-500/20 text-[10px] font-mono text-rose-200 leading-relaxed">
                  {rejectionReason || `Sinal cancelado por baixa confluência nos ${decisionThreshold}s finais.`}
                </p>
              </div>
            ) : (
              /* Case 3: CONFIRMED (CALL or PUT) */
              <div
                className={`p-3 rounded-xl border flex items-center justify-between relative overflow-hidden animate-in zoom-in-95 duration-200 ${
                  isCall
                    ? "bg-emerald-950/40 border-emerald-500/50"
                    : "bg-rose-950/40 border-rose-500/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isCall ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-slate-950"
                    }`}
                  >
                    {isCall ? (
                      <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <TrendingDown className="w-5 h-5 stroke-[2.5]" />
                    )}
                  </div>

                  <div>
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block">
                      Fase 2 &bull; Confirmado aos {decisionThreshold}s
                    </span>
                    <h3
                      className={`text-base font-black uppercase tracking-wider ${
                        isCall ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isCall ? "ENTRADA CONFIRMADA: COMPRA (CALL) ↗" : "ENTRADA CONFIRMADA: VENDA (PUT) ↘"}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Bar: Assertividade & Confluências */}
            <div className="flex items-center justify-between gap-4 bg-[#111726] p-3 rounded-xl border border-[#1E293B] text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">Assertividade:</span>
                <strong className="text-emerald-400 font-bold">{confidenceScore}%</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">Validações:</span>
                <strong className="text-amber-400 font-bold">
                  {analysis.detectedPatterns?.length || 4} Confluências
                </strong>
              </div>
            </div>

            {/* Real Confluences List */}
            <div className="space-y-2 bg-[#090D15] p-3.5 rounded-xl border border-[#1E293B]">
              <span className="text-xs font-mono text-slate-300 uppercase flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-[#FF7A00]" />
                Confluências Detectadas:
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {(analysis.detectedPatterns && analysis.detectedPatterns.length > 0
                  ? analysis.detectedPatterns
                  : [
                      "Estrutura e Alinhamento de Médias Móveis",
                      "RSI em Região Estratégica",
                      "Rejeição de Preço em Zona Relevante"
                    ]
                ).map((pattern, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-200 bg-[#121622] px-2.5 py-1.5 rounded-lg border border-[#1E2638]"
                  >
                    <span className="text-[#FF7A00] font-black">•</span>
                    <span className="leading-snug">{pattern}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Entry Trigger & Invalidation Zone */}
            <div className="bg-[#111726] p-3 rounded-xl border border-[#1E293B] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Gatilho:</span>
                <span className="font-bold text-white">
                  {isRejected ? "ABORTADO" : `Entrada às ${entryTimeStr} (${timeframe.toUpperCase()})`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Defesa Imediata:</span>
                <span className={`font-bold ${isRejected ? "text-amber-400" : "text-rose-400"}`}>
                  {isRejected ? "Loss Evitado" : analysis.defenseZone?.label || analysis.invalidationLevel || "Microestrutura Imediata"}
                </span>
              </div>
            </div>

            {/* Prominent Cancel Button in Full View */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleCancelAnalysis}
                className="w-full py-2.5 px-4 rounded-xl bg-[#141A26] hover:bg-rose-950/40 border border-[#222E44] hover:border-rose-500/50 text-slate-300 hover:text-rose-300 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Ban className="w-4 h-4 text-rose-400" />
                <span>Cancelar Análise e Desativar IA</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
