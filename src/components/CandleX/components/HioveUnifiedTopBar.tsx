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
  ChevronUp,
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
import { BankrollConfig, AutoTraderConfig } from "../../../types";

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
  onOpenVision: () => void;
  onOpenChat: () => void;
  onOpenAutoTrader?: () => void;
  autoTraderConfig?: AutoTraderConfig;
  soundEnabled: boolean;
  onToggleSound: () => void;
  syncStatus: 'syncing' | 'synced' | 'local';
  hioveToken?: string | null;
  chartEngine: "HIOVE_REAL" | "TRADINGVIEW";
  onSelectChartEngine: (engine: "HIOVE_REAL" | "TRADINGVIEW") => void;
  timeframe: string;
  isGlobalHeaderVisible?: boolean;
  onToggleGlobalHeader?: () => void;
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
  onOpenVision,
  onOpenChat,
  onOpenAutoTrader,
  autoTraderConfig,
  soundEnabled,
  onToggleSound,
  syncStatus,
  hioveToken,
  chartEngine,
  onSelectChartEngine,
  timeframe,
  isGlobalHeaderVisible,
  onToggleGlobalHeader,
}) => {
  const [hideBalance, setHideBalance] = useState(true);
  const balance = bankroll.currentBalance;

  return (
    <header className="h-[52px] bg-[#0E121B] border-b border-[#1B2230] flex items-center justify-between px-3 select-none z-30 flex-shrink-0 text-slate-200">
      {/* Left: Logo & Chart Engine Selector */}
      <div className="flex items-center gap-4 h-full">
        {/* Hiove Logo & Toggle Top Header Button */}
        <button
          type="button"
          id="btn-toggle-global-topbar"
          onClick={onToggleGlobalHeader}
          className="flex items-center gap-1.5 flex-shrink-0 px-2 py-1 rounded-xl bg-gradient-to-r from-[#161C28] to-[#0E121B] hover:from-[#20293C] hover:to-[#141A26] border border-[#222E44] hover:border-[#FF7A00]/50 transition-all cursor-pointer group shadow-sm"
          title={isGlobalHeaderVisible ? "Ocultar painel superior (Trader Academic)" : "Mostrar painel superior (Trader Academic)"}
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#FF7A00] to-amber-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-[0_0_10px_rgba(255,122,0,0.4)] group-hover:scale-105 transition-transform">
            H
          </div>
          <span className="font-black text-base text-white tracking-wider hidden sm:inline">
            hiove
          </span>
          <span className="text-slate-400 group-hover:text-[#FF7A00] transition-colors ml-0.5">
            {isGlobalHeaderVisible ? (
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </span>
        </button>

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

      {/* Middle: Open Asset Tabs (SOL, ETH, BTC, etc.) */}
      <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-md">
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onSelectTicker(tab.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
              activeTicker === tab.id
                ? "bg-[#181D26] text-[#FF7A00] border-[#FF7A00]/60 shadow-[0_0_10px_rgba(255,122,0,0.25)]"
                : "bg-[#121622] text-slate-400 hover:text-white border-[#1E2638]"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeTicker === tab.id ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
            <span>{tab.label}</span>
            {openTabs.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="p-0.5 hover:text-rose-400 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={onAddTab}
          className="p-1 rounded-lg bg-[#121622] hover:bg-[#1C2538] text-slate-400 hover:text-white border border-[#1E2638] transition-colors cursor-pointer"
          title="Adicionar Par de Moeda"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
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
          {/* Auto Trader IA */}
          <button
            type="button"
            onClick={onOpenAutoTrader}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-black transition-all cursor-pointer border ${
              autoTraderConfig?.enabled
                ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse"
                : "bg-[#141A26] text-amber-400 border-[#1E2638] hover:bg-[#1E2638] hover:text-amber-300"
            }`}
            title="Auto Trader IA & Bot Hiove"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auto Trader</span>
          </button>

          <div className="w-[1px] h-4 bg-[#1E2638] mx-0.5" />

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

