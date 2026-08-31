import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Plus,
  Trash2,
  Globe,
  Zap,
  BarChart3,
  Coins,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { DailySummary } from '../../types';
import { ModalitySelector } from '../common/ModalitySelector';
import { formatSecondsToTime, formatDateBR } from '../../utils/formatters';

interface CalendarViewProps {
  onSelectDay: (day: DailySummary) => void;
  onOpenNewOp: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onSelectDay,
  onOpenNewOp,
}) => {
  const {
    selectedModality,
    setSelectedModality,
    modalityAnalytics,
    operations,
    dailySummaries,
    monthConfig,
    monthlyStats,
    availableMonths,
    currentMonthId,
    setCurrentMonthId,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    clearAllMonthData,
    formatCurrency,
  } = useTrading();

  // Days of week header
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Calculate day of week offset for the 1st day of the month
  const firstDayDate = new Date(`${monthConfig.year}-${String(monthConfig.month).padStart(2, '0')}-01T12:00:00`);
  const startDayOfWeek = firstDayDate.getDay(); // 0 (Sun) to 6 (Sat)

  // Quick stats for calendar
  const positiveDays = dailySummaries.filter((d) => d.status === 'POSITIVE').length;
  const negativeDays = dailySummaries.filter((d) => d.status === 'NEGATIVE').length;
  const zeroDays = dailySummaries.filter((d) => d.status === 'ZERO').length;
  const totalOperatedDays = positiveDays + negativeDays + zeroDays;

  return (
    <div className="space-y-6 pb-12" id="view-calendar">
      {/* Modality Filter Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            Modalidade do Calendário:
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {selectedModality === 'ALL'
              ? 'Exibindo resultado consolidado de todos os mercados'
              : `Exibindo exclusivamente dados e métricas de ${selectedModality}`}
          </span>
        </div>
        <ModalitySelector
          selectedModality={selectedModality}
          onSelectModality={setSelectedModality}
          operations={operations}
        />
      </div>

      {/* Header Bar with Month Navigator & Actions */}
      <div className="p-5 bg-[#121722] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              Calendário de Performance Diária
              {selectedModality !== 'ALL' && (
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {selectedModality}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Visão de lucros diários, métricas analíticas e tempo operacional por pregão
            </p>
          </div>
        </div>

        {/* Actions & Month Navigator */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-calendar-add-op"
            type="button"
            onClick={onOpenNewOp}
            className="px-3 py-2 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Operação</span>
          </button>

          <button
            id="btn-clear-calendar-ops"
            type="button"
            onClick={() => {
              if (window.confirm('Deseja zerar todas as operações registradas no calendário deste mês?')) {
                clearAllMonthData();
              }
            }}
            className="px-2.5 py-2 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 transition-all flex items-center gap-1.5"
            title="Zerar todas as operações do calendário"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Zerar</span>
          </button>

          {/* Month Selector with Arrows */}
          <div className="flex items-center space-x-1 bg-[#0b0e14] border border-slate-700 rounded-lg p-0.5">
            <button
              id="btn-calendar-prev-month"
              type="button"
              onClick={goToPreviousMonth}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-orange-400 transition-colors"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              id="select-calendar-month"
              value={currentMonthId}
              onChange={(e) => setCurrentMonthId(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer px-2 py-1"
            >
              {availableMonths.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#121722] text-white">
                  {m.name}
                </option>
              ))}
            </select>

            <button
              id="btn-calendar-next-month"
              type="button"
              onClick={goToNextMonth}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-orange-400 transition-colors"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            id="btn-calendar-today"
            type="button"
            onClick={goToCurrentMonth}
            className="px-2.5 py-2 rounded-lg text-xs font-bold bg-[#141a26] border border-slate-700 hover:border-orange-500/50 text-slate-300 hover:text-white transition-colors"
            title="Ir para o mês atual"
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Month Performance Quick Stats (Dynamically customized by Modality) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-mono text-xs">
        <div className="p-3.5 bg-[#121722] border border-emerald-500/30 rounded-xl">
          <span className="text-[10px] text-slate-400 font-sans block">Dias Positivos (Gains)</span>
          <strong className="text-xl font-black text-emerald-400 mt-0.5 block">
            {positiveDays} dias
          </strong>
          <span className="text-[10px] text-slate-500">
            {totalOperatedDays > 0 ? `${((positiveDays / totalOperatedDays) * 100).toFixed(0)}% dos dias operados` : '0%'}
          </span>
        </div>

        <div className="p-3.5 bg-[#121722] border border-rose-500/30 rounded-xl">
          <span className="text-[10px] text-slate-400 font-sans block">Dias Negativos (Losses)</span>
          <strong className="text-xl font-black text-rose-400 mt-0.5 block">
            {negativeDays} dias
          </strong>
          <span className="text-[10px] text-slate-500">
            {totalOperatedDays > 0 ? `${((negativeDays / totalOperatedDays) * 100).toFixed(0)}% dos dias operados` : '0%'}
          </span>
        </div>

        {/* Dynamic Modality Specific Metric in Calendar Stats */}
        {selectedModality === 'FOREX' ? (
          <div className="p-3.5 bg-[#121722] border border-emerald-500/40 rounded-xl">
            <span className="text-[10px] text-slate-400 font-sans block">Total de Pips Forex</span>
            <strong className={`text-xl font-black mt-0.5 block ${(modalityAnalytics.forexTotalPips || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(modalityAnalytics.forexTotalPips || 0) > 0 ? '+' : ''}{modalityAnalytics.forexTotalPips || 0} pips
            </strong>
            <span className="text-[10px] text-slate-500">{modalityAnalytics.forexTotalLots || 0} lotes totais</span>
          </div>
        ) : selectedModality === 'B3' ? (
          <div className="p-3.5 bg-[#121722] border border-blue-500/40 rounded-xl">
            <span className="text-[10px] text-slate-400 font-sans block">Pontos Mini Índice (WIN)</span>
            <strong className={`text-xl font-black mt-0.5 block ${(modalityAnalytics.b3TotalWinPoints || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(modalityAnalytics.b3TotalWinPoints || 0) > 0 ? '+' : ''}{modalityAnalytics.b3TotalWinPoints || 0} pts
            </strong>
            <span className="text-[10px] text-slate-500">WDO: {modalityAnalytics.b3TotalWdoPoints || 0} pts</span>
          </div>
        ) : selectedModality === 'CRIPTO' ? (
          <div className="p-3.5 bg-[#121722] border border-purple-500/40 rounded-xl">
            <span className="text-[10px] text-slate-400 font-sans block">ROI Médio sobre Margem</span>
            <strong className={`text-xl font-black mt-0.5 block ${(modalityAnalytics.cryptoAvgRoi || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(modalityAnalytics.cryptoAvgRoi || 0) > 0 ? '+' : ''}{modalityAnalytics.cryptoAvgRoi || 0}%
            </strong>
            <span className="text-[10px] text-slate-500">Alavancagem média {modalityAnalytics.cryptoAvgLeverage || 10}x</span>
          </div>
        ) : (
          <div className="p-3.5 bg-[#121722] border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-sans block">Assertividade Geral</span>
            <strong className="text-xl font-black text-amber-400 mt-0.5 block">
              {modalityAnalytics.winRate}%
            </strong>
            <span className="text-[10px] text-slate-500">{modalityAnalytics.wins}W / {modalityAnalytics.losses}L</span>
          </div>
        )}

        <div className="p-3.5 bg-[#121722] border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-400 font-sans block">Tempo Total em Tela</span>
          <strong className="text-xl font-black text-cyan-400 mt-0.5 block">
            {formatSecondsToTime(monthlyStats.totalOperationalTimeSeconds)}
          </strong>
          <span className="text-[10px] text-slate-500">{totalOperatedDays} pregões operados</span>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="p-5 bg-[#121722] border border-slate-800 rounded-xl space-y-4">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
          {weekDays.map((wd) => (
            <div key={wd} className="py-1">
              {wd}
            </div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty spacer cells before day 1 */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[110px] p-2 bg-[#0b0e14]/40 rounded-xl opacity-30 border border-slate-900" />
          ))}

          {/* Actual Month Days (1 to 31) */}
          {dailySummaries.map((day) => {
            const hasOps = day.totalOperations > 0;
            return (
              <div
                key={day.dayNumber}
                onClick={() => onSelectDay(day)}
                className={`min-h-[115px] p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                  day.status === 'POSITIVE'
                    ? 'bg-emerald-950/20 border-emerald-500/50 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/40'
                    : day.status === 'NEGATIVE'
                    ? 'bg-rose-950/20 border-rose-500/50 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-950/40'
                    : day.status === 'ZERO'
                    ? 'bg-amber-950/20 border-amber-500/50 hover:border-amber-400'
                    : 'bg-[#0b0e14] border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top: Day Number & Operations Count / Modality badges */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black font-mono rounded px-1.5 py-0.5 ${
                      day.status === 'POSITIVE'
                        ? 'bg-emerald-500/30 text-emerald-300'
                        : day.status === 'NEGATIVE'
                        ? 'bg-rose-500/30 text-rose-300'
                        : day.status === 'ZERO'
                        ? 'bg-amber-500/30 text-amber-300'
                        : 'text-slate-400 bg-slate-800/60'
                    }`}
                  >
                    {String(day.dayNumber).padStart(2, '0')}
                  </span>

                  {hasOps && (
                    <div className="flex items-center space-x-1">
                      {/* In 'ALL' mode, show dots for which modalities were operated */}
                      {selectedModality === 'ALL' && day.modalitiesPresent && (
                        <div className="flex items-center -space-x-1 mr-1">
                          {day.modalitiesPresent.includes('BINARIAS') && (
                            <span className="w-2 h-2 rounded-full bg-orange-400 ring-1 ring-black" title="Binárias" />
                          )}
                          {day.modalitiesPresent.includes('FOREX') && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-black" title="Forex" />
                          )}
                          {day.modalitiesPresent.includes('B3') && (
                            <span className="w-2 h-2 rounded-full bg-blue-400 ring-1 ring-black" title="B3" />
                          )}
                          {day.modalitiesPresent.includes('CRIPTO') && (
                            <span className="w-2 h-2 rounded-full bg-purple-400 ring-1 ring-black" title="Cripto" />
                          )}
                        </div>
                      )}
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {day.wins}W {day.losses}L
                      </span>
                    </div>
                  )}
                </div>

                {/* Middle: Financial Result & Modality-Specific Indicator */}
                <div className="my-1">
                  {hasOps ? (
                    <div>
                      <span
                        className={`text-xs sm:text-sm font-black font-mono block ${
                          day.financialResult > 0
                            ? 'text-emerald-400'
                            : day.financialResult < 0
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {formatCurrency(day.financialResult, true)}
                      </span>

                      {/* Specialized Day Tag depending on Modality */}
                      {selectedModality === 'FOREX' && day.forexPips !== undefined && day.forexPips !== 0 && (
                        <span className={`text-[10px] font-mono font-bold block ${day.forexPips >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {day.forexPips > 0 ? '+' : ''}{day.forexPips} pips ({day.forexLots}L)
                        </span>
                      )}
                      {selectedModality === 'B3' && (day.b3WinPoints !== 0 || day.b3WdoPoints !== 0) && (
                        <span className="text-[10px] font-mono text-blue-300 block truncate">
                          {day.b3WinPoints ? `${day.b3WinPoints > 0 ? '+' : ''}${day.b3WinPoints}pts WIN ` : ''}
                          {day.b3WdoPoints ? `${day.b3WdoPoints > 0 ? '+' : ''}${day.b3WdoPoints}pts WDO` : ''}
                        </span>
                      )}
                      {selectedModality === 'CRIPTO' && day.cryptoRoiAvg !== undefined && (
                        <span className={`text-[10px] font-mono font-bold block ${day.cryptoRoiAvg >= 0 ? 'text-purple-300' : 'text-rose-300'}`}>
                          {day.cryptoRoiAvg > 0 ? '+' : ''}{day.cryptoRoiAvg}% ROI
                        </span>
                      )}
                      {selectedModality === 'BINARIAS' && day.averagePayout > 0 && (
                        <span className="text-[10px] font-mono text-orange-300 block">
                          Payout {day.averagePayout}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-600 block">Sem operações</span>
                  )}
                </div>

                {/* Bottom: Time Tag or Quick Indicator */}
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                  {day.operationalTimeSeconds > 0 ? (
                    <span className="text-cyan-300 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatSecondsToTime(day.operationalTimeSeconds)}
                    </span>
                  ) : (
                    <span className="text-slate-600">--:--</span>
                  )}

                  {hasOps && (
                    <span className="text-slate-400 hover:text-white flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
