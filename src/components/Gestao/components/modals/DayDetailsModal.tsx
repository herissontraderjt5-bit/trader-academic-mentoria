import React, { useState, useMemo } from 'react';
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
  Save,
  CheckCircle,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { Operation, DailySummary, TradingModality } from '../../types';
import { formatDateBR, formatSecondsToTime } from '../../utils/formatters';
import { getOperationModality } from '../../utils/modalityCalculations';
import { ScreenTimePicker } from '../common/ScreenTimePicker';

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
  const { operations, formatCurrency, selectedModality, setDayOperationalTime, timeLogs } = useTrading();
  const [dayModalityFilter, setDayModalityFilter] = useState<TradingModality | 'ALL'>('ALL');
  const [isEditingTime, setIsEditingTime] = useState<boolean>(false);

  // Read current saved operational time for this day
  const currentSavedTimeSec = useMemo(() => {
    if (!daySummary) return 0;
    const found = timeLogs?.find((t) => t.date === daySummary.date);
    return found ? found.seconds : daySummary.operationalTimeSeconds || 0;
  }, [daySummary, timeLogs]);

  const [timeSeconds, setTimeSeconds] = useState<number>(currentSavedTimeSec);
  const [timeSavedSuccess, setTimeSavedSuccess] = useState<boolean>(false);

  if (!isOpen || !daySummary) return null;

  const handleNewOp = onNewOpForDate || onNewOperation;
  const handleEdit = onEditOp || onEditOperation;
  const handleDelete = onDeleteOp || onDeleteOperation;

  const allDayOps = operations.filter((op) => op.date === daySummary.date);
  const filteredDayOps =
    dayModalityFilter === 'ALL'
      ? allDayOps
      : allDayOps.filter((op) => getOperationModality(op) === dayModalityFilter);

  // Dynamic calculations matching precisely the filtered view
  const dynamicWins = filteredDayOps.filter((o) => o.result === 'WIN').length;
  const dynamicLosses = filteredDayOps.filter((o) => o.result === 'LOSS').length;
  const dynamicEmpates = filteredDayOps.filter((o) => o.result === 'EMPATE').length;
  const dynamicFinancialResult = Number(
    filteredDayOps.reduce((acc, curr) => acc + curr.profit, 0).toFixed(2)
  );

  const handleSaveTime = () => {
    setDayOperationalTime(daySummary.date, timeSeconds);
    setTimeSavedSuccess(true);
    setTimeout(() => {
      setTimeSavedSuccess(false);
      setIsEditingTime(false);
    }, 1200);
  };

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
                dynamicFinancialResult > 0
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-md shadow-emerald-950/40'
                  : dynamicFinancialResult < 0
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
          {/* Quick Metrics Bar (Calculado dinamicamente com exatidão) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-[#0b0e14] border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">Resultado Líquido</span>
              <span
                className={`text-lg font-black font-mono ${
                  dynamicFinancialResult > 0
                    ? 'text-emerald-400'
                    : dynamicFinancialResult < 0
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {formatCurrency(dynamicFinancialResult, true)}
              </span>
            </div>

            <div className="p-3.5 bg-[#0b0e14] border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">Placar Geral</span>
              <div className="flex items-center space-x-2 text-sm font-black font-mono mt-0.5">
                <span className="text-emerald-400">{dynamicWins}W</span>
                <span className="text-slate-500">/</span>
                <span className="text-rose-400">{dynamicLosses}L</span>
                <span className="text-slate-500">/</span>
                <span className="text-amber-400">{dynamicEmpates}E</span>
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
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono font-bold text-sm text-cyan-300">
                  {formatSecondsToTime(currentSavedTimeSec)}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-[#0b0e14] border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">Métricas por Mercado</span>
              <span className="text-xs font-semibold text-slate-300 block truncate mt-0.5">
                {Array.from(new Set(filteredDayOps.map((o) => getOperationModality(o)))).join(' / ') || 'Sem operações'}
              </span>
            </div>
          </div>

          {/* Time Editor Drawer */}
          {isEditingTime && (
            <div className="p-4 bg-[#0a0d14] border border-cyan-500/40 rounded-xl space-y-3 animate-in fade-in">
              <ScreenTimePicker
                initialSeconds={timeSeconds}
                onTimeChange={(sec) => setTimeSeconds(sec)}
              />
              <button
                type="button"
                onClick={handleSaveTime}
                className={`w-full py-2.5 rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 ${
                  timeSavedSuccess ? 'bg-emerald-600' : 'bg-cyan-600 hover:bg-cyan-500'
                }`}
              >
                {timeSavedSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Tempo Atualizado com Sucesso!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Novo Tempo de Tela
                  </>
                )}
              </button>
            </div>
          )}

          {/* Controls: Modality Filters & New Op */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-[#0b0e14] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setDayModalityFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  dayModalityFilter === 'ALL'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({allDayOps.length})
              </button>
              <button
                onClick={() => setDayModalityFilter('BINARIAS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  dayModalityFilter === 'BINARIAS'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-orange-400" />
                Binárias ({allDayOps.filter((o) => getOperationModality(o) === 'BINARIAS').length})
              </button>
              <button
                onClick={() => setDayModalityFilter('FOREX')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  dayModalityFilter === 'FOREX'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Forex ({allDayOps.filter((o) => getOperationModality(o) === 'FOREX').length})
              </button>
              <button
                onClick={() => setDayModalityFilter('B3')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  dayModalityFilter === 'B3'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                B3 ({allDayOps.filter((o) => getOperationModality(o) === 'B3').length})
              </button>
              <button
                onClick={() => setDayModalityFilter('CRIPTO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  dayModalityFilter === 'CRIPTO'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-purple-400" />
                Cripto ({allDayOps.filter((o) => getOperationModality(o) === 'CRIPTO').length})
              </button>
            </div>

            {handleNewOp && (
              <button
                onClick={() => {
                  onClose();
                  handleNewOp(daySummary.date);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white transition-all flex items-center gap-1.5 shadow-lg shadow-orange-950/40"
              >
                <Plus className="w-4 h-4" />
                Adicionar Neste Dia
              </button>
            )}
          </div>

          {/* Operations List Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0b0e14]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#182030] text-slate-300 uppercase tracking-wider font-bold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">Hora</th>
                  <th className="px-3 py-2.5">Mercado</th>
                  <th className="px-3 py-2.5">Ativo</th>
                  <th className="px-3 py-2.5">Direção</th>
                  <th className="px-3 py-2.5">Volume / Detalhes</th>
                  <th className="px-3 py-2.5">Estratégia</th>
                  <th className="px-3 py-2.5 text-center">Resultado</th>
                  <th className="px-3 py-2.5 text-right">Lucro</th>
                  <th className="px-3 py-2.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredDayOps.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500 font-sans">
                      Nenhuma operação encontrada para este filtro no dia {formatDateBR(daySummary.date)}.
                    </td>
                  </tr>
                ) : (
                  filteredDayOps.map((op) => {
                    const mod = getOperationModality(op);
                    return (
                      <tr key={op.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-3 py-3 text-slate-300 font-semibold">{op.time || '--:--'}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              mod === 'BINARIAS'
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : mod === 'FOREX'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : mod === 'B3'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {mod}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-bold text-white">{op.asset}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`flex items-center gap-1 font-bold ${
                              op.direction === 'CALL' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {op.direction === 'CALL' ? (
                              <>
                                <TrendingUp className="w-3 h-3" /> CALL
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-3 h-3" /> PUT
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-400">
                          {mod === 'BINARIAS' && `${formatCurrency(op.investment)} (${op.payout}%)`}
                          {mod === 'FOREX' && `${op.forexLotSize ? `${op.forexLotSize} lotes` : `${formatCurrency(op.investment)}`}`}
                          {mod === 'B3' && `${op.b3Contracts ? `${op.b3Contracts} contratos` : `${formatCurrency(op.investment)}`}`}
                          {mod === 'CRIPTO' && `${op.cryptoLeverage ? `${op.cryptoLeverage}x | ${op.cryptoMargin ? formatCurrency(op.cryptoMargin) : '0%'}` : `${formatCurrency(op.investment)}`}`}
                        </td>
                        <td className="px-3 py-3 text-slate-300 font-sans">{op.strategy || 'Padrão'}</td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              op.result === 'WIN'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : op.result === 'LOSS'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {op.result}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-3 text-right font-bold ${
                            op.profit > 0
                              ? 'text-emerald-400'
                              : op.profit < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {op.profit > 0 ? `+${formatCurrency(op.profit)}` : formatCurrency(op.profit)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {handleEdit && (
                              <button
                                onClick={() => handleEdit(op)}
                                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700/60 transition-colors"
                                title="Editar operação"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {handleDelete && (
                              <button
                                onClick={() => {
                                  if (window.confirm('Excluir esta operação?')) {
                                    handleDelete(op.id);
                                  }
                                }}
                                className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40 transition-colors"
                                title="Excluir operação"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
