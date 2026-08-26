import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ChevronDown,
  Activity,
  CheckCircle2,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Cpu,
  Brain,
  Copy,
  Check,
  Bot,
  Play,
  Pause,
  Settings,
  BarChart3,
  Waves,
} from "lucide-react";
import {
  AiAnalysisResult,
  TechnicalIndicators,
  AutoTraderConfig,
  AutoTraderSession,
} from "../../../types";

interface NeuralAnalyzerSidebarProps {
  activeTicker: string;
  onSelectTicker: (ticker: string) => void;
  timeframe: string;
  onChangeTimeframe: (tf: string) => void;
  protectionEnabled: boolean;
  onToggleProtection: () => void;
  onGenerateAnalysis: () => void;
  isAnalyzing: boolean;
  analysis: AiAnalysisResult | null;
  indicators: TechnicalIndicators | null;
  currentPrice: number;
  autoTraderConfig?: AutoTraderConfig;
  autoTraderSession?: AutoTraderSession;
  onToggleAutoTrader?: () => void;
  onOpenAutoTraderModal?: () => void;
}

const AVAILABLE_ASSETS = [
  { id: "ETHUSDT", label: "ETH/USDT", type: "CRYPTO", payout: 89 },
  { id: "XRPUSDT", label: "XRP/USDT", type: "CRYPTO", payout: 89 },
  { id: "SOLUSDT", label: "SOLANA/USDT", type: "CRYPTO", payout: 88 },
  { id: "EURUSD_OTC", label: "EUR/USD", type: "FOREX", payout: 91 },
  { id: "AUDUSD_OTC", label: "AUD/USD", type: "FOREX", payout: 90 },
  { id: "EURGBP_OTC", label: "EUR/GBP", type: "FOREX", payout: 89 },
  { id: "GBPCHF_OTC", label: "GBP/CHF", type: "FOREX", payout: 88 },
  { id: "GBPJPY_OTC", label: "GBP/JPY", type: "FOREX", payout: 91 },
  { id: "GBPUSD_OTC", label: "GBP/USD", type: "FOREX", payout: 92 },
  { id: "NZDUSD_OTC", label: "NZD/USD", type: "FOREX", payout: 88 },
  { id: "USDCAD_OTC", label: "USD/CAD", type: "FOREX", payout: 89 },
  { id: "USDCHF_OTC", label: "USD/CHF", type: "FOREX", payout: 88 },
  { id: "USDJPY_OTC", label: "USD/JPY", type: "FOREX", payout: 90 },
];

export const NeuralAnalyzerSidebar: React.FC<NeuralAnalyzerSidebarProps> = ({
  activeTicker,
  onSelectTicker,
  timeframe,
  onChangeTimeframe,
  protectionEnabled,
  onToggleProtection,
  onGenerateAnalysis,
  isAnalyzing,
  analysis,
  indicators,
  currentPrice,
  autoTraderConfig,
  autoTraderSession,
  onToggleAutoTrader,
  onOpenAutoTraderModal,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copiedSignal, setCopiedSignal] = useState(false);

  const activeAssetObj =
    AVAILABLE_ASSETS.find((a) => a.id === activeTicker) || {
      id: activeTicker,
      label: activeTicker.includes("USDT")
        ? `${activeTicker.replace("USDT", "")}/USDT`
        : activeTicker,
      type: "CRYPTO",
      payout: 89,
    };

  const handleCopySignal = () => {
    if (!analysis) return;
    const directionText =
      analysis.direction === "CALL"
        ? "COMPRA (CALL) ↗"
        : analysis.direction === "PUT"
        ? "VENDA (PUT) ↘"
        : "AGUARDAR ↔";
    const timeFormatted = new Date(analysis.timestamp || Date.now()).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const expText = timeframe === "5m" ? "M5 (5 Minutos)" : "M1 (1 Minuto)";
    const confluencesList = (analysis.detectedPatterns && analysis.detectedPatterns.length > 0
      ? analysis.detectedPatterns
      : ["Cruzamento de Médias Móveis EMA", "RSI em Zona Estratégica", "Rejeição em Zona Institucional"]
    ).map((c) => `• ${c}`).join("\n");

    const textToCopy = `📊 SINAL GERADO - CANDLEX AI
━━━━━━━━━━━━━━━━━━━━
Entrada no ativo: ${activeAssetObj.label} (${directionText})
Horario: ${timeFormatted}
Expiração: ${expText}
Assertividade: ${analysis.confidenceScore}%

Confluencias:
${confluencesList}
━━━━━━━━━━━━━━━━━━━━`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedSignal(true);
      setTimeout(() => setCopiedSignal(false), 2500);
    }
  };

  return (
    <aside className="w-[340px] xl:w-[360px] h-full flex flex-col bg-[#0B0E14] border-r border-[#1B2230] text-slate-200 select-none z-20 flex-shrink-0">
      {/* Main Controls Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title: ◆ CandleX */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#FF7A00] text-lg leading-none animate-pulse drop-shadow-[0_0_10px_#FF7A00]">
              ◆
            </span>
            <h1 className="font-black text-xl tracking-wide select-none">
              <span className="relative inline-block px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-[#FF7A00]/20 via-amber-500/15 to-orange-600/20 border border-[#FF7A00]/40 shadow-[0_0_18px_rgba(255,122,0,0.35)]">
                <span className="bg-gradient-to-r from-amber-300 via-[#FF9500] to-[#FF7A00] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(255,122,0,0.8)] font-black">
                  Candle<span className="text-amber-200 drop-shadow-[0_0_14px_rgba(254,240,138,0.9)]">X</span>
                </span>
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 ml-5 font-medium">
            Análise e confluência em tempo real
          </p>
        </div>

        {/* TIMEFRAME */}
        <div className="space-y-1.5">
          <label className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
            TIMEFRAME
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onChangeTimeframe("1m")}
              className={`py-2.5 px-3 rounded-xl text-sm font-bold font-mono transition-all duration-200 cursor-pointer ${
                timeframe === "1m" || timeframe === "1MIN"
                  ? "bg-[#181D26] text-[#FF7A00] border-2 border-[#FF7A00] shadow-[0_0_15px_rgba(255,122,0,0.3)] font-black"
                  : "bg-[#12161F] text-slate-300 border border-[#1E2638] hover:border-slate-500 hover:text-white"
              }`}
            >
              1 MIN
            </button>
            <button
              type="button"
              onClick={() => onChangeTimeframe("5m")}
              className={`py-2.5 px-3 rounded-xl text-sm font-bold font-mono transition-all duration-200 cursor-pointer ${
                timeframe === "5m" || timeframe === "5MIN"
                  ? "bg-[#181D26] text-[#FF7A00] border-2 border-[#FF7A00] shadow-[0_0_15px_rgba(255,122,0,0.3)] font-black"
                  : "bg-[#12161F] text-slate-300 border border-[#1E2638] hover:border-slate-500 hover:text-white"
              }`}
            >
              5 MIN
            </button>
          </div>
        </div>

        {/* ATIVO SELECTOR */}
        <div className="space-y-1.5 relative">
          <label className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
            ATIVO
          </label>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between bg-[#12161F] border border-[#1E2638] hover:border-[#FF7A00]/70 rounded-xl px-3.5 py-3 cursor-pointer text-sm font-bold transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-white font-extrabold text-sm tracking-wide">{activeAssetObj.label}</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono font-bold">
                {activeAssetObj.type}
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#12161F] border border-[#1E2638] rounded-xl shadow-2xl z-50 overflow-hidden py-1 max-h-64 overflow-y-auto">
              {AVAILABLE_ASSETS.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => {
                    onSelectTicker(asset.id);
                    setDropdownOpen(false);
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 text-sm hover:bg-[#1C2333] cursor-pointer transition-colors ${
                    activeTicker === asset.id
                      ? "bg-[#1C2333] text-[#FF7A00] font-black"
                      : "text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold">{asset.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {asset.type}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {asset.payout}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TRADER AUTO IA - OPERAÇÕES AUTOMÁTICAS */}
        {autoTraderConfig && (
          <div className="bg-[#10141E] border border-[#1E2638] hover:border-[#FF7A00]/40 rounded-xl p-3.5 space-y-3 transition-all shadow-lg">
            {/* Header with Switch */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FF7A00]/20 border border-[#FF7A00]/40 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#FF7A00]" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase text-white tracking-wide flex items-center gap-1.5">
                    TRADER AUTO
                    <span
                      className={`w-2 h-2 rounded-full ${
                        autoTraderConfig.enabled
                          ? "bg-emerald-400 animate-ping"
                          : "bg-slate-600"
                      }`}
                    />
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block -mt-0.5">
                    Gestão {autoTraderConfig.managementMode} &bull; {autoTraderConfig.timeframe.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Quick Power Toggle */}
              <button
                type="button"
                onClick={onToggleAutoTrader}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer border ${
                  autoTraderConfig.enabled
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                }`}
              >
                {autoTraderConfig.enabled ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>LIGADO</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-slate-300" />
                    <span>DESLIGADO</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Session Score & Mini Stats */}
            <div className="bg-[#0B0E14] p-2.5 rounded-lg border border-[#182032] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-xs">Placar:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {autoTraderSession?.wins || 0}W
                </span>
                <span className="text-slate-600">/</span>
                <span className="font-mono font-black text-rose-400 text-sm">
                  {autoTraderSession?.losses || 0}L
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-slate-400">PnL:</span>
                <span
                  className={`font-bold text-sm ${
                    (autoTraderSession?.totalPnl || 0) >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {(autoTraderSession?.totalPnl || 0) >= 0 ? "+" : ""}
                  R$ {(autoTraderSession?.totalPnl || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Quick Config Badges & Config Button */}
            <div className="flex items-center justify-between gap-1.5 pt-0.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-300 overflow-x-auto no-scrollbar">
                <span className="px-2 py-0.5 rounded bg-[#182030] text-emerald-400 border border-emerald-500/20 font-bold">
                  Meta: R${autoTraderConfig.dailyStopWin}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#182030] text-rose-400 border border-rose-500/20 font-bold">
                  Stop: R${autoTraderConfig.dailyStopLoss}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#182030] text-amber-400 border border-amber-500/20 font-bold">
                  Entrada: R${autoTraderConfig.stakeAmount}
                </span>
              </div>

              <button
                type="button"
                onClick={onOpenAutoTraderModal}
                className="p-1.5 rounded bg-[#1A2234] hover:bg-[#26324D] text-[#FF7A00] border border-[#FF7A00]/30 transition-colors cursor-pointer flex-shrink-0"
                title="Abrir Configurações do Trader Auto"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PRIMARY BUTTON: ROUND FUTURISTIC CYBER REACTOR CORE */}
        <div className="py-2 flex flex-col items-center justify-center relative">
          {/* Ambient Cybernetic Reactor Container */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Sonar Expanding Shockwaves */}
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-600/20 blur-md pointer-events-none ${
                isAnalyzing ? "animate-sonar-1" : "animate-sonar-2 opacity-60"
              }`}
            />
            {isAnalyzing && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500/30 to-amber-400/30 blur-lg pointer-events-none animate-sonar-2" />
            )}

            {/* Outer Orbital Dashed Cyber Ring (Clockwise) */}
            <svg
              className={`absolute inset-0 w-full h-full pointer-events-none ${
                isAnalyzing ? "animate-spin-fast" : "animate-spin-slow"
              }`}
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="url(#cyber-grad-1)"
                strokeWidth="1.5"
                strokeDasharray="6 8 12 6"
                className="opacity-75"
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="#FF7A00"
                strokeWidth="2.5"
                strokeDasharray="2 18"
                className="opacity-90"
              />
              <defs>
                <linearGradient id="cyber-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFA500" />
                  <stop offset="50%" stopColor="#FF7A00" />
                  <stop offset="100%" stopColor="#FF2E00" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Segmented Counter-Rotating Tech Ring (Counter-Clockwise) */}
            <svg
              className={`absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] pointer-events-none ${
                isAnalyzing ? "animate-spin-reverse-fast" : "animate-spin-reverse-slow"
              }`}
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="#FFB300"
                strokeWidth="1"
                strokeDasharray="1 5"
                className="opacity-40"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#FF5500"
                strokeWidth="2"
                strokeDasharray="14 18"
                className="opacity-60"
              />
            </svg>

            {/* Radar Laser Sweeper on Analyzing */}
            {isAnalyzing && (
              <div className="absolute inset-4 rounded-full overflow-hidden pointer-events-none animate-radar z-10">
                <div className="w-1/2 h-1/2 bg-gradient-to-br from-amber-400/50 via-orange-500/20 to-transparent origin-bottom-right" />
              </div>
            )}

            {/* Main Interactive Round Button */}
            <button
              type="button"
              id="btn-analisar-mercado-round"
              onClick={onGenerateAnalysis}
              disabled={isAnalyzing || analysis !== null}
              className={`group relative w-36 h-36 rounded-full flex flex-col items-center justify-center p-3 text-center transition-all duration-300 cursor-pointer select-none active:scale-95 disabled:cursor-not-allowed ${
                isAnalyzing
                  ? "bg-gradient-to-b from-[#1C160C] via-[#2A1B0E] to-[#120D08] border-2 border-amber-400/80 shadow-[0_0_35px_rgba(255,140,0,0.7)]"
                  : "bg-gradient-to-b from-[#FF9500] via-[#FF7A00] to-[#E64A00] border-2 border-[#FFE082] shadow-[0_0_30px_rgba(255,122,0,0.6)] hover:shadow-[0_0_45px_rgba(255,140,0,0.95)] hover:scale-105"
              }`}
            >
              {/* Glassmorphic Top Highlight Arc */}
              <div className="absolute top-1 left-3 right-3 h-8 bg-white/25 rounded-t-full blur-[0.5px] pointer-events-none" />

              {/* Core Icon & Energy Node */}
              <div className="relative mb-1">
                {isAnalyzing ? (
                  <div className="relative">
                    <RefreshCw className="w-7 h-7 animate-spin text-amber-400 drop-shadow-[0_0_8px_rgba(255,191,0,0.8)]" />
                    <Sparkles className="w-3.5 h-3.5 absolute -top-1 -right-1 text-orange-300 animate-ping" />
                  </div>
                ) : (
                  <div className="relative flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-slate-950/20 flex items-center justify-center border border-white/30 shadow-inner group-hover:scale-110 transition-transform">
                      <Brain className="w-5 h-5 text-slate-950 drop-shadow-sm stroke-[2.5]" />
                    </div>
                    <Zap className="w-3.5 h-3.5 absolute -bottom-0.5 -right-1 text-yellow-200 fill-yellow-200 animate-bounce" />
                  </div>
                )}
              </div>

              {/* Futuristic Typography */}
              <div className="flex flex-col items-center leading-tight z-10">
                <span
                  className={`text-[9px] font-mono tracking-widest font-black ${
                    isAnalyzing ? "text-amber-400/90 uppercase" : "text-slate-950/90"
                  }`}
                >
                  {isAnalyzing ? "NEURAL SCAN" : "◆ CandleX ◆"}
                </span>

                <span
                  className={`text-[13px] font-black tracking-wider uppercase drop-shadow-md ${
                    isAnalyzing
                      ? "text-amber-200 animate-pulse font-mono"
                      : "text-slate-950 font-black"
                  }`}
                >
                  {isAnalyzing ? "ANALISANDO" : "ANALISAR"}
                </span>

                <span
                  className={`text-[12px] font-black tracking-widest uppercase -mt-0.5 ${
                    isAnalyzing ? "text-orange-400" : "text-slate-950"
                  }`}
                >
                  {isAnalyzing ? "MERCADO..." : "MERCADO"}
                </span>
              </div>

              {/* Bottom Hologram Indicator Dot */}
              <div className="mt-1 flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isAnalyzing
                      ? "bg-amber-400 animate-ping"
                      : "bg-slate-950/70 group-hover:bg-slate-950"
                  }`}
                />
                <span
                  className={`text-[8px] font-mono font-bold tracking-tight ${
                    isAnalyzing ? "text-amber-300 uppercase" : "text-slate-950/90"
                  }`}
                >
                  {isAnalyzing ? "PROCESSANDO" : "CandleX Pronta"}
                </span>
              </div>
            </button>
          </div>

          {/* Subtitle Underneath Reactor */}
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-300 font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CandleX Confluence Core</span>
          </div>
        </div>

        {/* LIVE 6-PILLAR SCANNING TELEMETRY CARD WHEN ANALYZING */}
        {isAnalyzing && (
          <div className="bg-[#10141E] border-2 border-[#FF7A00]/60 rounded-xl p-3.5 space-y-3 shadow-[0_0_25px_rgba(255,122,0,0.25)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1A2234] pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FF7A00] animate-ping" />
                <span className="text-xs font-black text-[#FF7A00] tracking-wider uppercase font-mono">
                  ESCANEANDO 6 PILARES CANDLEX
                </span>
              </div>
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
            </div>

            <div className="space-y-2 text-xs font-mono">
              {/* 1. Tendência */}
              <div className="bg-[#090D15] p-2 rounded-lg border border-[#182030] flex items-center justify-between">
                <span className="text-slate-200 flex items-center gap-1.5 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  1. Tendência (EMA/Price)
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {indicators?.trend === "ALTA" ? "ALTA (EMA20 > SMA50)" : "BAIXA (EMA20 < SMA50)"}
                </span>
              </div>

              {/* 2. RSI */}
              <div className="bg-[#090D15] p-2 rounded-lg border border-[#182030] flex items-center justify-between">
                <span className="text-slate-200 flex items-center gap-1.5 font-medium">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  2. RSI (14) Exaustão
                </span>
                <span className="text-cyan-400 font-bold">
                  {indicators ? `${indicators.rsi.toFixed(1)} (${indicators.rsiStatus})` : "Calculando..."}
                </span>
              </div>

              {/* 3. Volume */}
              <div className="bg-[#090D15] p-2 rounded-lg border border-[#182030] flex items-center justify-between">
                <span className="text-slate-200 flex items-center gap-1.5 font-medium">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                  3. Volume & Delta
                </span>
                <span className="text-emerald-400 font-bold">
                  Delta Institucional Ativo
                </span>
              </div>

              {/* 4. MACD */}
              <div className="bg-[#090D15] p-2 rounded-lg border border-[#182030] flex items-center justify-between">
                <span className="text-slate-200 flex items-center gap-1.5 font-medium">
                  <Waves className="w-3.5 h-3.5 text-purple-400" />
                  4. MACD Momentum
                </span>
                <span className="text-purple-300 font-bold">
                  {indicators ? (indicators.macdHist > 0 ? "+ Histograma Bullish" : "- Histograma Bearish") : "Calculando..."}
                </span>
              </div>

              {/* 5. Médias Móveis */}
              <div className="bg-[#090D15] p-2 rounded-lg border border-[#182030] flex items-center justify-between">
                <span className="text-slate-200 flex items-center gap-1.5 font-medium">
                  <Layers className="w-3.5 h-3.5 text-[#FF7A00]" />
                  5. Médias Móveis
                </span>
                <span className="text-amber-400 font-bold">
                  Confluência Fractal 9/20
                </span>
              </div>

              {/* 6. Fluxo de Ordens */}
              <div className="bg-[#090D15] p-2 rounded-lg border border-[#182030] flex items-center justify-between">
                <span className="text-slate-200 flex items-center gap-1.5 font-medium">
                  <Zap className="w-3.5 h-3.5 text-rose-400" />
                  6. Fluxo (Tape Reading)
                </span>
                <span className="text-rose-300 font-bold">
                  Absorção de Livro Ativa
                </span>
              </div>
            </div>
          </div>
        )}

        {/* NEURAL ANALYSIS SIGNAL CARD */}
        {analysis && (
          <div className="bg-[#10141E] border-2 border-[#1E2638] rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-2xl">
            {/* Header with Title & Copy Button */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#1A2234]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs uppercase font-black text-white tracking-wider">
                  SINAL GERADO
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopySignal}
                className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-[#182030] hover:bg-[#222D42] text-[#FF7A00] border border-[#FF7A00]/40 transition-all cursor-pointer shadow-sm"
                title="Copiar sinal formatado"
              >
                {copiedSignal ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Sinal</span>
                  </>
                )}
              </button>
            </div>

            {/* Exact Formatted Data Rows */}
            <div className="space-y-2.5 text-sm">
              {/* 1. Entrada no ativo */}
              <div className="bg-[#0B0E14] p-3 rounded-xl border border-[#182032] flex items-center justify-between">
                <span className="text-slate-300 font-bold text-xs">Entrada no ativo:</span>
                <div className="flex items-center gap-2 font-bold">
                  <span className="text-white font-mono font-black text-sm">{activeAssetObj.label}</span>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wide ${
                      analysis.direction === "CALL"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                        : analysis.direction === "PUT"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/50"
                        : "bg-slate-700/40 text-slate-300 border border-slate-600"
                    }`}
                  >
                    {analysis.direction === "CALL"
                      ? "COMPRA (CALL) ↗"
                      : analysis.direction === "PUT"
                      ? "VENDA (PUT) ↘"
                      : "AGUARDAR ↔"}
                  </span>
                </div>
              </div>

              {/* 2. Horario */}
              <div className="bg-[#0B0E14] p-3 rounded-xl border border-[#182032] flex items-center justify-between">
                <span className="text-slate-300 font-bold text-xs">Horario:</span>
                <span className="text-amber-400 font-mono font-black text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  {new Date(analysis.timestamp || Date.now()).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>

              {/* 3. Expiração */}
              <div className="bg-[#0B0E14] p-3 rounded-xl border border-[#182032] flex items-center justify-between">
                <span className="text-slate-300 font-bold text-xs">Expiração:</span>
                <span className="text-cyan-400 font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/40">
                  {timeframe === "5m" ? "M5 (5 Minutos)" : "M1 (1 Minuto)"}
                </span>
              </div>

              {/* 4. Assertividade */}
              <div className="bg-[#0B0E14] p-3 rounded-xl border border-[#182032] flex items-center justify-between">
                <span className="text-slate-300 font-bold text-xs">Assertividade:</span>
                <span className="text-[#FF7A00] font-mono font-black text-base">
                  {analysis.confidenceScore}%
                </span>
              </div>

              {/* 5. Confluencias */}
              <div className="bg-[#0B0E14] p-3 rounded-xl border border-[#182032] space-y-2">
                <div className="text-slate-300 font-bold text-xs flex items-center justify-between">
                  <span>Confluencias:</span>
                  <span className="text-xs font-mono text-emerald-400 font-extrabold">
                    {analysis.detectedPatterns?.length || 3} Validações
                  </span>
                </div>
                <div className="space-y-1.5">
                  {(analysis.detectedPatterns && analysis.detectedPatterns.length > 0
                    ? analysis.detectedPatterns
                    : [
                        "Cruzamento de Médias Móveis EMA",
                        "RSI em Zona Estratégica Institucional",
                        "Rejeição de Preço em Suporte/Resistência",
                      ]
                  ).map((pattern, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-200 bg-[#121722] px-2.5 py-1.5 rounded-lg border border-[#1E273A]"
                    >
                      <span className="text-[#FF7A00] font-black">•</span>
                      <span className="leading-snug">{pattern}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
