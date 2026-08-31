import React, { useEffect, useState } from 'react';
import { X, Award, CheckCircle, ShieldAlert, Clock, TrendingUp, TrendingDown, Target, Zap, Save } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTrading } from '../../context/TradingContext';
import { formatSecondsToTime, getTodayDateString } from '../../utils/formatters';
import { ScreenTimePicker } from '../common/ScreenTimePicker';

interface SessionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({ isOpen, onClose }) => {
  const {
    todaySummary,
    todayProfit,
    todayGoalReached,
    todayStopLossReached,
    monthConfig,
    isTimerRunning,
    pauseTimer,
    currentTimerSeconds,
    setDayOperationalTime,
    formatCurrency,
  } = useTrading();

  const [screenTimeSeconds, setScreenTimeSeconds] = useState<number>(0);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (isTimerRunning) {
        pauseTimer();
      }
      const existingSec = (todaySummary?.operationalTimeSeconds || 0) + currentTimerSeconds;
      setScreenTimeSeconds(existingSec > 0 ? existingSec : 0);
      setSavedSuccess(false);

      if (todayProfit > 0) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#f97316', '#06b6d4'],
          });
        } catch (e) {
          // ignore
        }
      }
    }
  }, [isOpen, todayProfit, isTimerRunning, pauseTimer, todaySummary?.operationalTimeSeconds, currentTimerSeconds]);

  if (!isOpen) return null;

  const wins = todaySummary?.wins || 0;
  const losses = todaySummary?.losses || 0;
  const empates = todaySummary?.empates || 0;
  const total = todaySummary?.totalOperations || 0;
  const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0';

  const handleFinalizeAndSave = () => {
    setDayOperationalTime(getTodayDateString(), screenTimeSeconds);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div
      id="modal-session-summary"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-[#121722] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header Banner */}
        <div
          className={`px-6 py-6 text-center border-b relative ${
            todayProfit > 0
              ? 'bg-gradient-to-b from-emerald-950/60 to-[#121722] border-emerald-500/30'
              : todayProfit < 0
              ? 'bg-gradient-to-b from-rose-950/60 to-[#121722] border-rose-500/30'
              : 'bg-gradient-to-b from-slate-900 to-[#121722] border-slate-700'
          }`}
        >
          <button
            id="btn-close-session-summary"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg ${
              todayProfit > 0
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-emerald-950'
                : todayProfit < 0
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-rose-950'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {todayProfit > 0 ? (
              <Award className="w-8 h-8" />
            ) : todayProfit < 0 ? (
              <ShieldAlert className="w-8 h-8" />
            ) : (
              <Target className="w-8 h-8" />
            )}
          </div>

          <h2 className="text-xl font-extrabold text-white tracking-wide">Finalizar o Dia Operacional</h2>
          <p className="text-xs text-slate-400 mt-1">Resumo consolidado e registro do tempo de tela</p>

          {/* Goal or Stop badge */}
          {todayGoalReached && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-xs font-bold animate-pulse">
              <CheckCircle className="w-3.5 h-3.5" />
              META DO DIA ATINGIDA ✅
            </div>
          )}

          {todayStopLossReached && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50 text-xs font-bold animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              STOP LOSS DIÁRIO ATINGIDO
            </div>
          )}
        </div>

        {/* Body Metrics */}
        <div className="p-6 space-y-5">
          {/* Main Profit Card */}
          <div className="p-4 bg-[#0b0e14] border border-slate-800 rounded-xl text-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Resultado Financeiro do Dia
            </span>
            <span
              className={`text-3xl font-extrabold font-mono ${
                todayProfit > 0
                  ? 'text-emerald-400'
                  : todayProfit < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {formatCurrency(todayProfit, true)}
            </span>
          </div>

          {/* Score & Time Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">Placar</span>
              <div className="flex items-center space-x-2 text-base font-bold font-mono mt-1">
                <span className="text-emerald-400">{wins}W</span>
                <span className="text-slate-600">-</span>
                <span className="text-rose-400">{losses}L</span>
                <span className="text-slate-600">-</span>
                <span className="text-amber-400">{empates}E</span>
              </div>
            </div>

            <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">Assertividade</span>
              <span className="text-base font-bold text-cyan-400 font-mono mt-1 block">
                {winRate}%
              </span>
            </div>

            <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">Total de Entradas</span>
              <span className="text-base font-bold text-white font-mono mt-1 block">
                {total} operações
              </span>
            </div>

            <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 block font-medium">Tempo Atual</span>
              <span className="text-base font-bold text-cyan-300 font-mono mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {formatSecondsToTime(screenTimeSeconds)}
              </span>
            </div>
          </div>

          {/* Interactive Screen Time Input */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              Tempo de Tela da Sessão (ajuste antes de salvar):
            </label>
            <ScreenTimePicker
              initialSeconds={screenTimeSeconds}
              onTimeChange={(sec) => setScreenTimeSeconds(sec)}
            />
          </div>

          {/* Educational / Discipline Message */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <p>
              Disciplina é a chave da consistência. Respeite sempre seus limites de perda e não
              devolva os ganhos após bater a meta. Descanse e volte amanhã!
            </p>
          </div>

          {/* Action button */}
          <button
            id="btn-confirm-session-close"
            onClick={handleFinalizeAndSave}
            className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all text-center flex items-center justify-center gap-2 ${
              savedSuccess
                ? 'bg-emerald-600 shadow-emerald-950/60'
                : 'bg-orange-500 hover:bg-orange-600 shadow-orange-950'
            }`}
          >
            {savedSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Dia e Tempo de Tela Registrados com Sucesso!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Tempo de Tela e Concluir o Dia
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
