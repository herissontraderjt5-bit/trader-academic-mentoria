import React from 'react';
import {
  Wallet,
  TrendingUp,
  Target,
  Flame,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { formatSecondsToTime } from '../../utils/formatters';

export const TopMetricsGrid: React.FC = () => {
  const { monthlyStats, monthConfig, formatCurrency } = useTrading();

  return (
    <div className="space-y-3.5" id="top-metrics-container">
      {/* Top Header Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#121722] border border-slate-800/80 rounded-xl">
        <div className="flex items-center space-x-2 text-xs text-slate-300">
          <span className="text-slate-500 font-medium">Banca Inicial:</span>
          <span className="font-mono font-bold text-slate-200">
            {formatCurrency(monthlyStats.initialBankroll)}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-300">
          <span className="text-slate-500 font-medium">Total Depósitos:</span>
          <span className="font-mono font-bold text-cyan-400">
            +{formatCurrency(monthlyStats.totalDeposits)}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-300">
          <span className="text-slate-500 font-medium">Total Saques:</span>
          <span className="font-mono font-bold text-amber-400">
            -{formatCurrency(monthlyStats.totalWithdrawals)}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-300">
          <span className="text-slate-500 font-medium">Dias Trabalhados:</span>
          <span className="font-mono font-bold text-cyan-300 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            {monthlyStats.operatedDaysCount} / {monthlyStats.workingDays || 20} dias
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-300">
          <span className="text-slate-500 font-medium">Tempo Operacional Mensal:</span>
          <span className="font-mono font-bold text-orange-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatSecondsToTime(monthlyStats.totalOperationalTimeSeconds)}
          </span>
        </div>
      </div>

      {/* Row 1: Banca Atual | Lucro Mensal | Meta Mensal | Assertividade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Banca Atual */}
        <div className="p-4 bg-[#121722] border border-slate-800 rounded-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Banca Atual
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-cyan-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {formatCurrency(monthlyStats.currentBankroll)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Inicial: {formatCurrency(monthlyStats.initialBankroll)}</span>
            <span className={monthlyStats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {monthlyStats.netProfit >= 0 ? '+' : ''}
              {monthlyStats.initialBankroll > 0
                ? ((monthlyStats.netProfit / monthlyStats.initialBankroll) * 100).toFixed(1)
                : 0}
              %
            </span>
          </div>
        </div>

        {/* Lucro Mensal */}
        <div className="p-4 bg-[#121722] border border-slate-800 rounded-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Lucro Mensal Líquido
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                monthlyStats.netProfit >= 0
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}
            >
              {monthlyStats.netProfit >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <ShieldAlert className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span
              className={`text-2xl font-black font-mono tracking-tight ${
                monthlyStats.netProfit > 0
                  ? 'text-emerald-400'
                  : monthlyStats.netProfit < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {formatCurrency(monthlyStats.netProfit, true)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span className="text-emerald-400">+{formatCurrency(monthlyStats.operationalProfit)}</span>
            <span className="text-rose-400">-{formatCurrency(monthlyStats.operationalLoss)}</span>
          </div>
        </div>

        {/* Meta Mensal */}
        <div className="p-4 bg-[#121722] border border-slate-800 rounded-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Meta Mensal
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {formatCurrency(monthlyStats.monthlyGoalAmount)}
            </span>
          </div>
          <div className="mt-2 text-[11px] flex items-center justify-between">
            <span className="text-slate-400">Progresso:</span>
            <span
              className={`font-bold font-mono ${
                monthlyStats.goalProgressPercent >= 100
                  ? 'text-emerald-400'
                  : monthlyStats.goalProgressPercent > 50
                  ? 'text-orange-400'
                  : 'text-slate-300'
              }`}
            >
              {monthlyStats.goalProgressPercent}%
            </span>
          </div>
        </div>

        {/* Assertividade */}
        <div className="p-4 bg-[#121722] border border-slate-800 rounded-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Assertividade (Win Rate)
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black font-mono text-cyan-400 tracking-tight">
              {monthlyStats.winRate}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Fórmula: W ÷ (W + L)</span>
            <span className="text-slate-300 font-mono">
              {monthlyStats.wins}W / {monthlyStats.losses}L
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: WIN | LOSS | EMPATE | Total de Operações */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Wins */}
        <div className="p-3.5 bg-[#121722] border border-emerald-900/40 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
              WINS
            </span>
            <span className="text-xl font-black font-mono text-emerald-400 mt-0.5 block">
              {monthlyStats.wins}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Melhor seq: <strong className="text-emerald-300">{monthlyStats.bestWinStreak}</strong>
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Losses */}
        <div className="p-3.5 bg-[#121722] border border-rose-900/40 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">
              LOSSES
            </span>
            <span className="text-xl font-black font-mono text-rose-400 mt-0.5 block">
              {monthlyStats.losses}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Maior seq: <strong className="text-rose-300">{monthlyStats.worstLossStreak}</strong>
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <XCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Empates */}
        <div className="p-3.5 bg-[#121722] border border-amber-900/40 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
              EMPATES
            </span>
            <span className="text-xl font-black font-mono text-amber-400 mt-0.5 block">
              {monthlyStats.empates}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              0,00 impact
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <MinusCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Total Operações */}
        <div className="p-3.5 bg-[#121722] border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              TOTAL OPERAÇÕES
            </span>
            <span className="text-xl font-black font-mono text-white mt-0.5 block">
              {monthlyStats.totalOperations}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Média/dia: <strong className="text-slate-200">{monthlyStats.avgOperationsPerDay}</strong>
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-cyan-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
