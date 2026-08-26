import React from "react";
import {
  Flame,
  Activity,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  Layers,
  BookOpen,
  PieChart,
  Scan,
  RefreshCw,
  ExternalLink,
  BotMessageSquare,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  Monitor,
  LineChart,
  Landmark,
} from "lucide-react";
import { TickerSummary, ActiveWindowId, MultiLayoutMode } from "../../../types";

interface NavbarProps {
  activeTicker: string;
  onSelectTicker: (ticker: string) => void;
  tickerSummary: TickerSummary | null;
  activeWindow: ActiveWindowId;
  onChangeWindow: (windowId: ActiveWindowId) => void;
  multiLayoutMode: MultiLayoutMode;
  onChangeMultiLayout: (mode: MultiLayoutMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  autoAnalyze: boolean;
  onToggleAutoAnalyze: () => void;
  onManualAnalyze: () => void;
  isAnalyzing: boolean;
  tradeCount: number;
}

const POPULAR_TICKERS = [
  { symbol: "ETHUSDT", name: "ETH/USDT" },
  { symbol: "BTCUSDT", name: "BTC/USDT" },
  { symbol: "SOLUSDT", name: "SOL/USDT" },
  { symbol: "BNBUSDT", name: "BNB/USDT" },
  { symbol: "XRPUSDT", name: "XRP/USDT" },
  { symbol: "DOGEUSDT", name: "DOGE/USDT" },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTicker,
  onSelectTicker,
  tickerSummary,
  activeWindow,
  onChangeWindow,
  multiLayoutMode,
  onChangeMultiLayout,
  soundEnabled,
  onToggleSound,
  voiceEnabled,
  onToggleVoice,
  autoAnalyze,
  onToggleAutoAnalyze,
  onManualAnalyze,
  isAnalyzing,
  tradeCount,
}) => {
  const isPositive = (tickerSummary?.priceChangePercent ?? 0) >= 0;

  const WINDOW_TABS = [
    {
      id: "hiove" as ActiveWindowId,
      label: "Hiove Traderoom",
      shortLabel: "Hiove",
      icon: <Landmark className="w-4 h-4 text-emerald-400" />,
      accent: "text-emerald-400",
      bgActive: "bg-emerald-950/70 border-emerald-500/50 text-emerald-300",
    },
    {
      id: "ai" as ActiveWindowId,
      label: "CandleX IA",
      shortLabel: "IA Sinais",
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      accent: "text-amber-400",
      bgActive: "bg-amber-950/70 border-amber-500/50 text-amber-300",
    },
    {
      id: "chart" as ActiveWindowId,
      label: "Gráfico Analítico",
      shortLabel: "Gráfico",
      icon: <LineChart className="w-4 h-4 text-indigo-400" />,
      accent: "text-indigo-400",
      bgActive: "bg-indigo-950/70 border-indigo-500/50 text-indigo-300",
    },
    {
      id: "performance" as ActiveWindowId,
      label: "Diário & Banca",
      shortLabel: "Banca/Diário",
      icon: <PieChart className="w-4 h-4 text-rose-400" />,
      badge: tradeCount > 0 ? tradeCount : undefined,
      accent: "text-rose-400",
      bgActive: "bg-rose-950/70 border-rose-500/50 text-rose-300",
    },
    {
      id: "vision" as ActiveWindowId,
      label: "Print Vision",
      shortLabel: "Vision",
      icon: <Scan className="w-4 h-4 text-purple-400" />,
      accent: "text-purple-400",
      bgActive: "bg-purple-950/70 border-purple-500/50 text-purple-300",
    },
    {
      id: "chat" as ActiveWindowId,
      label: "Mentor IA",
      shortLabel: "Mentor",
      icon: <BotMessageSquare className="w-4 h-4 text-blue-400" />,
      accent: "text-blue-400",
      bgActive: "bg-blue-950/70 border-blue-500/50 text-blue-300",
    },
    {
      id: "multi" as ActiveWindowId,
      label: "Multi-Janelas",
      shortLabel: "Multi",
      icon: <LayoutGrid className="w-4 h-4 text-teal-400" />,
      accent: "text-teal-400",
      bgActive: "bg-teal-950/70 border-teal-500/50 text-teal-300",
    },
  ];

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 px-3 py-2 flex flex-col gap-2 select-none shrink-0 shadow-lg">
      {/* Top Row: Brand, Ticker Selector & Main Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Brand & Ticker Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400/30" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-wider bg-gradient-to-r from-amber-300 via-[#FF9500] to-[#FF7A00] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(255,122,0,0.8)]">
                  Candle<span className="text-amber-200 drop-shadow-[0_0_14px_rgba(254,240,138,0.9)]">X</span>
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/40 shadow-[0_0_8px_rgba(255,122,0,0.3)]">
                  PRO
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium leading-none mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Hiove Traderoom Integrada</span>
              </div>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>

          {/* Ticker Selector Dropdown / Badges */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-800">
            <select
              id="ticker-select"
              value={activeTicker}
              onChange={(e) => onSelectTicker(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-100 border-none outline-none cursor-pointer pr-1 focus:ring-0"
            >
              {POPULAR_TICKERS.map((t) => (
                <option key={t.symbol} value={t.symbol} className="bg-slate-900 text-slate-100">
                  {t.name}
                </option>
              ))}
            </select>

            {tickerSummary && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800 text-xs">
                <span className="font-mono font-black text-white">
                  ${tickerSummary.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  className={`flex items-center text-[10px] font-bold ${
                    isPositive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {isPositive ? "+" : ""}
                  {tickerSummary.priceChangePercent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Tools & Audio */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Manual Analyze Button */}
          <button
            id="btn-analyze-now"
            onClick={onManualAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/50 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Executar análise de confluência do CandleX AI agora"
          >
            {isAnalyzing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            )}
            <span>{isAnalyzing ? "Analisando..." : "Análise IA"}</span>
          </button>

          {/* Auto Analyze Switch */}
          <button
            id="btn-auto-analyze"
            onClick={onToggleAutoAnalyze}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              autoAnalyze
                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title="Ativar/Desativar análise automática periódica"
          >
            <Activity className={`w-3.5 h-3.5 ${autoAnalyze ? "text-emerald-400 animate-pulse" : ""}`} />
            <span className="hidden sm:inline text-[11px]">Auto IA:</span>
            <span className="font-bold text-[11px]">{autoAnalyze ? "ON" : "OFF"}</span>
          </button>

          {/* Audio / Voice Toggles */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              id="btn-toggle-sound"
              onClick={onToggleSound}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                soundEnabled ? "text-emerald-400 hover:bg-slate-800" : "text-slate-500 hover:text-slate-400"
              }`}
              title={soundEnabled ? "Sons ativados" : "Sons silenciados"}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              id="btn-toggle-voice"
              onClick={onToggleVoice}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                voiceEnabled ? "text-amber-400 hover:bg-slate-800" : "text-slate-500 hover:text-slate-400"
              }`}
              title={voiceEnabled ? "Voz IA ativada" : "Voz IA desativada"}
            >
              {voiceEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Clean Modular Window Navigation Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 no-scrollbar border-t border-slate-800/80 pt-1.5">
        <div className="flex items-center gap-1.5">
          {WINDOW_TABS.map((tab) => {
            const isActive = activeWindow === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-window-${tab.id}`}
                onClick={() => onChangeWindow(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? `${tab.bgActive} shadow-sm font-extrabold scale-[1.02]`
                    : "bg-slate-900/80 hover:bg-slate-800/90 text-slate-400 hover:text-slate-200 border-slate-800/80"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                {tab.badge !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono font-black">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* When in Multi-Window Mode, show layout choices */}
        {activeWindow === "multi" && (
          <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-xl border border-slate-800 text-xs shrink-0">
            <button
              onClick={() => onChangeMultiLayout("split-50")}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                multiLayoutMode === "split-50" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Lado a Lado 50/50: Hiove + CandleX IA"
            >
              50/50
            </button>
            <button
              onClick={() => onChangeMultiLayout("tri-pane")}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                multiLayoutMode === "tri-pane" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Três Painéis: Hiove + Gráfico + IA"
            >
              3 Janelas
            </button>
            <button
              onClick={() => onChangeMultiLayout("quad-grid")}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                multiLayoutMode === "quad-grid" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Grid Quádruplo: Hiove, Gráfico, IA e Radar"
            >
              4 Janelas
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
