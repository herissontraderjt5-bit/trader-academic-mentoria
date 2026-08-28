import React, { useState } from "react";
import {
  Plus,
  X,
  Eye,
  EyeOff,
  Percent,
  Wallet,
  User,
  ChevronDown,
  Sparkles,
  Bot,
  Scan,
  MessageSquare,
  BookOpen,
  Calendar,
  Sliders,
  Volume2,
  VolumeX,
  Activity,
  Zap,
} from "lucide-react";
import { BankrollConfig } from "../../../types";

interface HioveUnifiedTopBarProps {
  activeTicker: string;
  onSelectTicker: (ticker: string) => void;
  openTabs: Array<{ id: string; label: string; type: string }>;
  onCloseTab: (id: string) => void;
  onAddTab: () => void;
  bankroll: BankrollConfig;
  onOpenDeposit: () => void;
  onOpenWithdrawal: () => void;
  onOpenJournal: () => void;
  onOpenCalendar: () => void;
  onOpenIndicators: () => void;
  onOpenAutoTrader: () => void;
  onOpenVision: () => void;
  onOpenChat: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  syncStatus: 'syncing' | 'synced' | 'local';
  hioveToken?: string | null;
  chartEngine: "HIOVE_REAL" | "TRADINGVIEW";
  onSelectChartEngine: (engine: "HIOVE_REAL" | "TRADINGVIEW") => void;
  timeframe: string;
}

export const HioveUnifiedTopBar: React.FC<HioveUnifiedTopBarProps> = ({
  activeTicker,
  onSelectTicker,
  openTabs,
  onCloseTab,
  onAddTab,
  bankroll,
  onOpenDeposit,
  onOpenWithdrawal,
  onOpenJournal,
  onOpenCalendar,
  onOpenIndicators,
  onOpenAutoTrader,
  onOpenVision,
  onOpenChat,
  soundEnabled,
  onToggleSound,
  syncStatus,
  hioveToken,
  chartEngine,
  onSelectChartEngine,
  timeframe,
}) => {
  const [hideBalance, setHideBalance] = useState(true);
  const balance = bankroll.currentBalance;

  return (
    <header className="h-[52px] bg-[#0E121B] border-b border-[#1B2230] flex items-center justify-between px-3 select-none z-30 flex-shrink-0 text-slate-200">
      {/* Left: Logo & Chart Engine Selector */}
      <div className="flex items-center gap-4 h-full">
        {/* Hiove Logo */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#FF7A00] to-amber-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-[0_0_10px_rgba(255,122,0,0.4)]">
            H
          </div>
          <span className="font-black text-base text-white tracking-wider hidden sm:inline">
            hiove
          </span>
        </div>

        <div className="w-[1px] h-5 bg-[#1B2230] hidden sm:block" />

        {/* Chart Engine Selector */}
        <div className="flex items-center gap-1 bg-[#121622] p-0.5 rounded-lg border border-[#1E2638] flex-shrink-0">
          <button
            type="button"
            onClick={() => onSelectChartEngine("HIOVE_REAL")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-black transition-all cursor-pointer ${
              chartEngine === "HIOVE_REAL"
                ? "bg-gradient-to-r from-[#FF7A00] to-amber-500 text-slate-950 shadow-[0_0_10px_rgba(255,122,0,0.35)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden md:inline">Hiove Oficial (Real)</span>
            <span className="md:hidden">Hiove Real</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectChartEngine("TRADINGVIEW")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              chartEngine === "TRADINGVIEW"
                ? "bg-[#1C2538] text-white border border-[#2D3B59]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="hidden md:inline">TradingView Pro</span>
            <span className="md:hidden">TradingView</span>
          </button>
        </div>
      </div>

      {/* Right: Ticker, Trade button & Tool Actions */}
      <div className="flex items-center gap-3.5 flex-shrink-0">
        {/* Ativo details */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Ativo: <strong className="text-white">{activeTicker}</strong> &bull; {timeframe}
          </span>
          <button
            type="button"
            onClick={() => window.open(`https://app.hiove.com/traderoom?ticker=${activeTicker}`, "_blank")}
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-[#141A26] hover:bg-[#1E2638] text-[10px] text-amber-400 border border-[#1E2638] cursor-pointer font-bold transition-all"
          >
            <span>Negociar no site da Hiove</span>
            <span className="text-[9px]">↗</span>
          </button>
        </div>

        <div className="w-[1px] h-5 bg-[#1B2230] hidden md:block" />

        {/* Sleek Tool Actions Bar */}
        <div className="flex items-center gap-1 bg-[#121622]/60 border border-[#1E2638] rounded-lg p-0.5 max-w-[190px] sm:max-w-none overflow-x-auto no-scrollbar">
          {/* Auto Trader Button */}
          <button
            type="button"
            onClick={onOpenAutoTrader}
            className="p-1.5 rounded hover:bg-[#1E2638] text-slate-400 hover:text-[#FF7A00] transition-colors cursor-pointer"
            title="IA Auto Trader"
          >
            <Bot className="w-4 h-4" />
          </button>

          {/* AI Vision Scanner */}
          <button
            type="button"
            onClick={onOpenVision}
            className="p-1.5 rounded hover:bg-[#1E2638] text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
            title="Vision Scanner IA"
          >
            <Scan className="w-4 h-4" />
          </button>

          {/* AI Mentor Chat */}
          <button
            type="button"
            onClick={onOpenChat}
            className="p-1.5 rounded hover:bg-[#1E2638] text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
            title="Mentor de Trading IA"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-[#1E2638] mx-0.5" />

          {/* Operations Journal */}
          <button
            type="button"
            onClick={onOpenJournal}
            className="p-1.5 rounded hover:bg-[#1E2638] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            title="Diário de Operações"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Economic Calendar */}
          <button
            type="button"
            onClick={onOpenCalendar}
            className="p-1.5 rounded hover:bg-[#1E2638] text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Calendário Econômico"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {/* Indicators Modal */}
          <button
            type="button"
            onClick={onOpenIndicators}
            className="p-1.5 rounded hover:bg-[#1E2638] text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Indicadores de Gráfico"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-[#1E2638] mx-0.5" />

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className={`p-1.5 rounded hover:bg-[#1E2638] transition-colors cursor-pointer ${
              soundEnabled ? "text-emerald-400" : "text-slate-500 hover:text-slate-400"
            }`}
            title={soundEnabled ? "Alertas de Áudio Ativados" : "Alertas de Áudio Mudos"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

