import React from 'react';
import { Target, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const DailyGoalBar: React.FC = () => {
  const { todayProfit, monthConfig, todayGoalReached, todayStopLossReached, formatCurrency } = useTrading();

  // Automatic calculation based on working days and initial bankroll / monthly goal
  const calculatedDailyStopLoss = monthConfig.initialBankroll / (monthConfig.workingDays || 20);
  const calculatedDailyTarget = (monthConfig.initialBankroll * ((monthConfig.monthlyGoalPercent || 80) / 100)) / (monthConfig.workingDays || 20);
  const stopWin = calculatedDailyTarget;
  const stopLoss = calculatedDailyStopLoss;

  const winProgressPercent = stopWin > 0 ? Math.min(Math.max((todayProfit / stopWin) * 100, 0), 100) : 0;
  const lossProgressPercent = stopLoss > 0 && todayProfit < 0
    ? Math.min(Math.max((Math.abs(todayProfit) / stopLoss) * 100, 0), 100)
    : 0;

  return (
    <div className="p-4 bg-[#121722] border border-slate-800 rounded-xl space-y-3" id="card-daily-goal-bar">
      {/* Header with status badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Meta Diária & Gestão de Risco do Dia
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              Hoje: <strong className={todayProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(todayProfit, true)}</strong>
            </span>
          </div>
        </div>

        {todayGoalReached ? (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            META DO DIA ATINGIDA ✅
          </span>
        ) : todayStopLossReached ? (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            STOP LOSS DIÁRIO ATINGIDO
          </span>
        ) : (
          <span className="text-xs font-mono text-slate-400">
            Meta Diária Calculada: <strong className="text-emerald-400">{formatCurrency(stopWin)}</strong> | Stop: <strong className="text-rose-400">-{formatCurrency(stopLoss)}</strong>
          </span>
        )}
      </div>

      {/* Progress Track */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Progresso do Ganho Diário</span>
          <span className="text-emerald-400 font-bold">{winProgressPercent.toFixed(0)}%</span>
        </div>
        <div className="w-full h-2.5 bg-[#0b0e14] border border-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              todayGoalReached
                ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-sm shadow-emerald-500'
                : todayProfit >= 0
                ? 'bg-gradient-to-r from-orange-500 to-emerald-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${winProgressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
