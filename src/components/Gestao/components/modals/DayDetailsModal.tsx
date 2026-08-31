import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Edit2,
  Zap,
  BarChart3,
  Coins,
  Globe,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { Operation, DailySummary, TradingModality } from '../../types';
import { formatDateBR, formatSecondsToTime } from '../../utils/formatters';
import { getOperationModality } from '../../utils/modalityCalculations';

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  daySummary: DailySummary | null;
  onNewOpForDate?: (date: string) => void;
  onNewOperation?: (date: string) => void;
  onEditOp?: (op: Operation) => void;
  onEditOperation?: (op: Operation) => void;
  onDeleteOp?: (id: string) => void;
  onDeleteOperation?: (id: string) => void;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  isOpen,
  onClose,
  daySummary,
  onNewOpForDate,
  onNewOperation,
  onEditOp,
  onEditOperation,
  onDeleteOp,
  onDeleteOperation,
}) => {
  const { operations, formatCurrency, selectedModality, setDayOperationalTime } = useTrading();
  const [dayModalityFilter, setDayModalityFilter] = useState<TradingModality | 'ALL'>('ALL');
  const [isEditingTime, setIsEditingTime] = useState<boolean>(false);
  const [timeMins, setTimeMins] = useState<number>(Math.floor((daySummary?.operationalTimeSeconds || 0) / 60));

  if (!isOpen || !daySummary) return null;

  const handleNewOp = onNewOpForDate || onNewOperation;
  const handleEdit = onEditOp || onEditOperation;
  const handleDelete = onDeleteOp || onDeleteOperation;

  const allDayOps = operations.filter((op) => op.date === daySummary.date);
  const filteredDayOps =
    dayModalityFilter === 'ALL'
      ? allDayOps
      : allDayOps.filter((op) => getOperationModality(op) === dayModalityFilter);

  return (
    <div
      id="modal-day-details"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-[#121722] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#182030] border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black font-mono text-sm border ${
                daySummary.status === 'POSITIVE'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-md shadow-emerald-950/40'
                  : daySummary.status === 'NEGATIVE'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-md shadow-rose-950/40'
                  : 'bg-slate-700 text-slate-300 border-slate-600'
              }`}
            >
              D{daySummary.dayNumber}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Detalhamento: {formatDateBR(daySummary.date)}
              </h2>
              <p className="text-xs text-slate-400">Extrato analítico de operações de todos os mercados cadastrados</p>
            </div>
          </div>
          <button
            id="btn-close-day-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-[#0b0e14] border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">Resultado Líquido</span>
              <span
                className={`text-lg font-black font-mono ${
                  daySummary.financialResult > 0
                    ? 'text-emerald-400'
                    : daySummary.financialResult < 0
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {formatCurrency(daySummary.financialResult, true)}
              </span>
            </div>

            <div className="p-3.5 bg-[#0b0e14] border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">Placar Geral</span>
              <div className="flex items-center space-x-2 text-sm font-black font-mono mt-0.5">
                <span className="text-emerald-400">{daySummary.wins}W</span>
                <span className="text-slate-500">/</span>
                <span className="text-rose-400">{daySummary.losses}L</span>
                <span className="text-slate-500">/</span>
                <span className="text-amber-400">{daySummary.empates}E</span>
              </div>
            </div>

            <div className="p-3.5 bg-[#0b0e14] border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 block font-medium">Tempo de Tela</span>
                <button
                  type="button"
                  onClick={() => setIsEditingTime(!isEditingTime)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline"
                >
                  {isEditingTime ? 'Fechar' : 'Ajustar'}
                </button>
              </div>
              {isEditingTime ? (
                <div className="mt-1 flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="1440"
                    value={timeMins}
                    onChange={(e) => setTimeMins(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 bg-[#15161A] border border-cyan-500/50 rounded px-1.5 py-0.5 text-xs text-cyan-300 font-mono text-center focus:outline-none"
                    placeholder="Min"
                  />
                  <span className="text-[10px] text-slate-400">min</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDayOperationalTime(daySummary.date, timeMins * 60);
                      setIsEditingTime(false);
                    }}
                    className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold"
                  >
                    Salvar
                  </button>
                </div>
              ) : (
                <span className="text-base font-bold text-cyan-300 font-mono flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  {formatSecondsToTime(daySummary.operationalTimeSeconds)}
                </span>
              )}
            </div>

            <div className="p-3.5 bg-[#0b0e14] border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">Métricas por Mercado</span>
              <div className="text-[11px] font-mono text-slate-300 mt-0.5 truncate space-y-0.5">
                {daySummary.forexPips !== undefined && daySummary.forexPips !== 0 && (
                  <span className="block text-emerald-400">Forex: {daySummary.forexPips > 0 ? '+' : ''}{daySummary.forexPips} pips</span>
                )}
                {daySummary.b3WinPoints !== 0 && (
                  <span className="block text-blue-400">B3: {daySummary.b3WinPoints > 0 ? '+' : ''}{daySummary.b3WinPoints} pts WIN</span>
                )}
                {daySummary.cryptoRoiAvg !== undefined && (
                  <span className="block text-purple-400">Cripto: {daySummary.cryptoRoiAvg}% ROI</span>
                )}
                {(!daySummary.forexPips && !daySummary.b3WinPoints && !daySummary.cryptoRoiAvg) && (
                  <span className="text-slate-500">Binárias / Spot</span>
                )}
              </div>
            </div>
          </div>

          {/* Filter by Modality inside Day */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center space-x-1 bg-[#0b0e14] p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setDayModalityFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  dayModalityFilter === 'ALL'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({allDayOps.length})
              </button>
              <button
                type="button"
                onClick={() => setDayModalityFilter('BINARIAS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  dayModalityFilter === 'BINARIAS'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                    : 'text-slate-400 hover:text-orange-300'
                }`}
              >
                <Zap className="w-3 h-3" />
                Binárias
              </button>
              <button
                type="button"
                onClick={() => setDayModalityFilter('FOREX')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  dayModalityFilter === 'FOREX'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                Forex
              </button>
              <button
                type="button"
                onClick={() => setDayModalityFilter('B3')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  dayModalityFilter === 'B3'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-blue-300'
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                B3
              </button>
              <button
                type="button"
                onClick={() => setDayModalityFilter('CRIPTO')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  dayModalityFilter === 'CRIPTO'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                    : 'text-slate-400 hover:text-purple-300'
                }`}
              >
                <Coins className="w-3 h-3" />
                Cripto
              </button>
            </div>

            <button
              id="btn-add-op-to-day"
              onClick={() => {
                handleNewOp?.(daySummary.date);
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Neste Dia
            </button>
          </div>

          {/* Operations Table */}
          {filteredDayOps.length === 0 ? (
            <div className="p-8 text-center bg-[#0b0e14] rounded-xl border border-dashed border-slate-800">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Nenhuma operação cadastrada neste filtro.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0b0e14]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#182030] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">Hora</th>
                    <th className="px-3 py-2.5">Mercado</th>
                    <th className="px-3 py-2.5">Ativo</th>
                    <th className="px-3 py-2.5">Direção</th>
                    <th className="px-3 py-2.5">Volume / Detalhes</th>
                    <th className="px-3 py-2.5">Estratégia</th>
                    <th className="px-3 py-2.5">Resultado</th>
                    <th className="px-3 py-2.5">Lucro</th>
                    <th className="px-3 py-2.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredDayOps.map((op) => {
                    const opModality = getOperationModality(op);
                    return (
                      <tr key={op.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-3 py-2.5 text-slate-300">{op.time}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                              opModality === 'FOREX'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : opModality === 'B3'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                : opModality === 'CRIPTO'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                                : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                            }`}
                          >
                            {opModality}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-bold text-white">{op.asset}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`flex items-center gap-1 font-bold ${
                              op.direction === 'CALL' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {op.direction === 'CALL' ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {op.direction}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-300 font-sans">
                          {opModality === 'FOREX' && (
                            <span>{op.lotSize || 0.1} Lot | {op.pips || 0} pips</span>
                          )}
                          {opModality === 'B3' && (
                            <span>{op.contracts || 1} Contratos | {op.points || 0} pts</span>
                          )}
                          {opModality === 'CRIPTO' && (
                            <span>{op.leverage || 10}x | {op.roiPercent || 0}% ROI</span>
                          )}
                          {opModality === 'BINARIAS' && (
                            <span>{formatCurrency(op.investment)} ({op.payout}%)</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-300 font-sans">{op.strategy}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              op.result === 'WIN'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : op.result === 'LOSS'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            }`}
                          >
                            {op.result}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-2.5 font-bold ${
                            op.profit > 0
                              ? 'text-emerald-400'
                              : op.profit < 0
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {formatCurrency(op.profit, true)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-sans">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              id={`btn-edit-op-${op.id}`}
                              onClick={() => {
                                handleEdit?.(op);
                                onClose();
                              }}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-delete-op-${op.id}`}
                              onClick={() => handleDelete?.(op.id)}
                              className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
