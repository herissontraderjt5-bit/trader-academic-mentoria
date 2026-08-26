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
} from "lucide-react";

interface HioveUnifiedTopBarProps {
  activeTicker: string;
  onSelectTicker: (ticker: string) => void;
  openTabs: Array<{ id: string; label: string; type: string }>;
  onCloseTab: (id: string) => void;
  onAddTab: () => void;
  balance: number;
  onOpenDeposit: () => void;
  onOpenBonus: () => void;
}

export const HioveUnifiedTopBar: React.FC<HioveUnifiedTopBarProps> = ({
  activeTicker,
  onSelectTicker,
  openTabs,
  onCloseTab,
  onAddTab,
  balance,
  onOpenDeposit,
  onOpenBonus,
}) => {
  const [hideBalance, setHideBalance] = useState(true);

  return (
    <header className="h-[52px] bg-[#0E121B] border-b border-[#1B2230] flex items-center justify-between px-3 select-none z-30 flex-shrink-0 text-slate-200">
      {/* Left: Logo & Asset Tabs */}
      <div className="flex items-center gap-2 h-full overflow-x-auto no-scrollbar">
        {/* Hiove Logo (from screenshot) */}
        <div className="flex items-center gap-1.5 pr-3 border-r border-[#1B2230] flex-shrink-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#FF7A00] to-amber-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-[0_0_10px_rgba(255,122,0,0.4)]">
            H
          </div>
          <span className="font-black text-base text-white tracking-wider">
            hiove
          </span>
        </div>

        {/* Add Tab (+) button */}
        <button
          type="button"
          onClick={onAddTab}
          className="w-7 h-7 rounded-lg bg-[#141A26] hover:bg-[#1E2638] border border-[#1E2638] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
          title="Abrir Novo Ativo"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Active Asset Tabs */}
        <div className="flex items-center gap-1.5 h-full py-1.5">
          {openTabs.map((tab) => {
            const isActive = tab.id === activeTicker;
            return (
              <div
                key={tab.id}
                onClick={() => onSelectTicker(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  isActive
                    ? "bg-[#141A26] text-white border-[#2A364F] shadow-sm"
                    : "bg-transparent text-slate-400 border-transparent hover:bg-[#141A26]/50 hover:text-slate-200"
                }`}
              >
                {/* Crypto/Asset Icon */}
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px] text-indigo-300 font-bold">
                  {tab.label.charAt(0)}
                </div>

                <div>
                  <div className="text-xs font-black leading-tight text-white">
                    {tab.label}
                  </div>
                  <div className="text-[8.5px] font-mono text-slate-400 leading-tight">
                    {tab.type}
                  </div>
                </div>

                {/* Mini Sparkline Line */}
                <div className="w-8 h-3 flex items-center opacity-60">
                  <svg className="w-full h-full" viewBox="0 0 32 12">
                    <path
                      d="M0,8 L6,4 L12,9 L18,3 L24,6 L32,2"
                      fill="none"
                      stroke={isActive ? "#00E676" : "#64748B"}
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>

                {/* Close tab */}
                {openTabs.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Rewards %, Balance, Deposit Button, User Avatar (from screenshot) */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Rewards / % Button */}
        <button
          type="button"
          onClick={onOpenBonus}
          className="w-8 h-8 rounded-lg bg-[#141A26] hover:bg-[#1E2638] border border-[#1E2638] flex items-center justify-center text-slate-300 hover:text-[#FF7A00] transition-colors cursor-pointer"
          title="Promoções e Bônus"
        >
          <Percent className="w-4 h-4" />
        </button>

        {/* Account Balance Selector: REAL ▾ $ •••••• */}
        <div className="flex items-center gap-2 bg-[#121622] border border-[#1E2638] rounded-lg px-3 py-1.5">
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
            <span>REAL</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>

          <div className="w-[1px] h-4 bg-[#1E2638]" />

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-black text-white">
              {hideBalance ? "$ ••••••" : `$ ${balance.toFixed(2)}`}
            </span>
            <button
              type="button"
              onClick={() => setHideBalance(!hideBalance)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={hideBalance ? "Mostrar Saldo" : "Ocultar Saldo"}
            >
              {hideBalance ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Big Orange Depositar Button */}
        <button
          type="button"
          onClick={onOpenDeposit}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#FF8C00] via-[#FF7A00] to-[#E65100] hover:from-[#FFA022] hover:to-[#FF6D00] text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(255,122,0,0.35)] transition-all active:scale-[0.98] cursor-pointer"
        >
          <Wallet className="w-3.5 h-3.5 text-slate-950" />
          <span>Depositar</span>
        </button>

        {/* User Profile Avatar with SMC TRADER badge */}
        <div className="flex items-center gap-1.5 cursor-pointer pl-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1E293B] to-[#0F172A] border border-[#334155] flex items-center justify-center relative shadow-sm">
            <User className="w-4 h-4 text-slate-300" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0E121B]" />
          </div>
          <div className="hidden sm:block">
            <div className="text-[10px] font-black text-emerald-400 leading-none">
              SMC TRADER
            </div>
            <div className="text-[8.5px] text-slate-400 font-mono">VIP PRO</div>
          </div>
        </div>
      </div>
    </header>
  );
};
