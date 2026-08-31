import React from 'react';
import { Target, Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const GoalProgressDonut: React.FC = () => {
  const { monthlyStats, monthConfig, formatCurrency } = useTrading();

  const progress = monthlyStats.goalProgressPercent;
  const isSuperGoal = progress > 100;
  const profit = monthlyStats.netProfit;

  // Normalized visual percentage for SVG stroke (0 to 100% of the circle circumference)
  const visualPercent = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = 283 - (283 * visualPercent) / 100;

  return (
    <div
      className="p-5 bg-[#121722] border border-slate-800 rounded-xl h-full flex flex-col justify-between"
      id="card-goal-donut"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Evolução da Meta</h3>
            <p className="text-[11px] text-slate-400">Progresso do objetivo mensal</p>
          </div>
        </div>

        {progress >= 100 && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Meta Batida!
          </span>
        )}
      </div>

      {/* Donut Chart Center */}
      <div className="relative flex flex-col items-center justify-center my-4">
        <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-800/80"
            fill="transparent"
          />
          {/* Active Progress */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#goalDonutGradient)"
            strokeWidth="8"
            strokeDasharray="283"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="goalDonutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor={isSuperGoal ? '#10b981' : '#06b6d4'} />
            </linearGradient>
          </defs>
        </svg>

        {/* Text inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span
            className={`text-2xl font-black font-mono tracking-tight ${
              isSuperGoal
                ? 'text-emerald-400'
                : progress >= 75
                ? 'text-orange-400'
                : 'text-white'
            }`}
          >
            {progress}%
          </span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            da Meta
          </span>
          <span
            className={`text-xs font-mono font-bold mt-1 ${
              profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(profit, true)} de lucro
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-[#0b0e14] border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
        <div className="text-slate-400">
          <span>Meta Alvo:</span>{' '}
          <strong className="text-white">{formatCurrency(monthlyStats.monthlyGoalAmount)}</strong>
        </div>
        <div className="text-slate-400">
          <span>Falta:</span>{' '}
          <strong className="text-cyan-400">
            {profit >= monthlyStats.monthlyGoalAmount
              ? `${formatCurrency(0)} (Concluída)`
              : formatCurrency(monthlyStats.monthlyGoalAmount - profit)}
          </strong>
        </div>
      </div>
    </div>
  );
};
