import React, { useState, useRef, useEffect } from 'react';
import {
  TrendingUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Menu,
  Power,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { getMonthsForYear, getTodayDateString } from '../../utils/formatters';

interface HeaderProps {
  onOpenNewOp?: () => void;
  onOpenSessionSummary?: () => void;
  onOpenAuth?: () => void;
  onToggleMobileMenu: () => void;
  onBackToHome?: () => void;
  onOpenCandleX?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSessionSummary,
  onToggleMobileMenu,
  onBackToHome,
  onOpenCandleX,
}) => {
  const {
    monthConfig,
    currentMonthId,
    setCurrentMonthId,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    operations,
  } = useTrading();

  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Active year in dropdown (can be browsed independently)
  const currentYear = parseInt(currentMonthId.split('-')[0], 10) || new Date().getFullYear();
  const [dropdownYear, setDropdownYear] = useState<number>(currentYear);

  // Sync dropdown year when currentMonthId changes
  useEffect(() => {
    setDropdownYear(currentYear);
  }, [currentYear]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMonthDropdown(false);
      }
    }
    if (showMonthDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMonthDropdown]);

  const monthsInSelectedYear = getMonthsForYear(dropdownYear);
  const todayMonthId = getTodayDateString().slice(0, 7);

  // Set of month IDs that have operations
  const monthsWithOps = new Set(operations.map((op) => op.monthId || op.date.slice(0, 7)));

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 bg-[#0c1017]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-3 transition-all"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left Side: Mobile Menu Button & Brand */}
        <div className="flex items-center space-x-3">
          <button
            id="btn-mobile-menu-toggle"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 ring-1 ring-orange-400/40">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-extrabold tracking-wider text-white">
                  TRADER <span className="text-orange-500">ACADEMIC</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-tight">
                Gestão Profissional de Capital
              </p>
            </div>
          </div>
        </div>

        {/* Center / Month Selector with Prev/Next Navigation */}
        <div className="flex items-center space-x-1 sm:space-x-1.5" ref={dropdownRef}>
          {/* Quick Previous Month Button */}
          <button
            id="btn-header-prev-month"
            type="button"
            onClick={goToPreviousMonth}
            className="p-1.5 rounded-lg bg-[#141a26] border border-slate-700/80 hover:border-orange-500/60 text-slate-300 hover:text-orange-400 transition-all"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Month Dropdown Button */}
          <div className="relative">
            <button
              id="btn-month-selector"
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#141a26] border text-xs font-semibold text-slate-200 transition-all ${
                showMonthDropdown
                  ? 'border-orange-500 text-white shadow-md shadow-orange-950/40'
                  : 'border-slate-700/80 hover:border-slate-500'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="font-bold">{monthConfig.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showMonthDropdown ? 'rotate-180 text-orange-400' : ''}`} />
            </button>

            {/* Rich 12-Month Calendar Dropdown */}
            {showMonthDropdown && (
              <div
                id="dropdown-month-menu"
                className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 sm:w-80 bg-[#121722] border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Year Header Navigator */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDropdownYear((y) => y - 1)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Ano Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-white font-mono tracking-wide">
                      {dropdownYear}
                    </span>
                    {dropdownYear === new Date().getFullYear() && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 font-bold">
                        Atual
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setDropdownYear((y) => y + 1)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Próximo Ano"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 12 Months Grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {monthsInSelectedYear.map((m) => {
                    const isSelected = m.id === currentMonthId;
                    const isCurrentRealMonth = m.id === todayMonthId;
                    const hasOps = monthsWithOps.has(m.id);

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setCurrentMonthId(m.id);
                          setShowMonthDropdown(false);
                        }}
                        className={`relative p-2 rounded-lg text-center text-xs font-medium transition-all flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-950/60 ring-1 ring-orange-300'
                            : isCurrentRealMonth
                            ? 'bg-cyan-950/30 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/40'
                            : 'bg-[#181f2e] text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                        }`}
                      >
                        <span className="text-xs font-bold">{m.shortName}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-orange-100' : 'text-slate-500'}`}>
                          {m.name.split(' ')[0]}
                        </span>

                        {/* Indicator for operations */}
                        {hasOps && !isSelected && (
                          <span
                            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400"
                            title="Possui operações registradas"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Actions Footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      goToCurrentMonth();
                      setShowMonthDropdown(false);
                    }}
                    className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Ir para Mês Atual
                  </button>

                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Com operações
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Next Month Button */}
          <button
            id="btn-header-next-month"
            type="button"
            onClick={goToNextMonth}
            className="p-1.5 rounded-lg bg-[#141a26] border border-slate-700/80 hover:border-orange-500/60 text-slate-300 hover:text-orange-400 transition-all"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Side: Quick Actions & Navigation */}
        <div className="flex items-center space-x-2">
          {onOpenCandleX && (
            <button
              type="button"
              onClick={onOpenCandleX}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-orange-600/20 to-amber-600/20 text-orange-400 border border-orange-500/30 hover:border-orange-500 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Abrir CandleX Terminal"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">CandleX AI</span>
            </button>
          )}

          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#141a26] text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Voltar às Aulas"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Voltar às Aulas</span>
            </button>
          )}

          {onOpenSessionSummary && (
            <button
              id="btn-header-end-session"
              onClick={onOpenSessionSummary}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#141a26] text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Finalizar o Dia"
            >
              <Power className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">Finalizar o Dia</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
