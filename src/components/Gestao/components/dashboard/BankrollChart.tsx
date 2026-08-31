import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const BankrollChart: React.FC = () => {
  const { bankrollChartData, monthConfig, monthlyStats, formatCurrency, currencySymbol } = useTrading();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-[#121722] border border-slate-700 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-bold text-white">{data.day} ({data.date})</p>
          <p className="text-cyan-400 font-mono font-semibold">
            Banca: {formatCurrency(data.bankroll)}
          </p>
          <p
            className={`font-mono ${
              data.dailyProfit > 0
                ? 'text-emerald-400'
                : data.dailyProfit < 0
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            Resultado do Dia: {data.formattedProfit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 bg-[#121722] border border-slate-800 rounded-xl h-full flex flex-col justify-between" id="card-bankroll-chart">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Evolução da Banca no Mês
            </h3>
            <p className="text-[11px] text-slate-400">
              Curva de capital diária incluindo lucros, saques e depósitos
            </p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-[11px] text-slate-400 block">Saldo Atual</span>
          <span className="text-base font-bold text-cyan-400">
            {formatCurrency(monthlyStats.currentBankroll)}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-64 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={bankrollChartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="bankrollGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              tickFormatter={(val) => `${currencySymbol} ${val}`}
              domain={['dataMin - 10', 'dataMax + 10']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="bankroll"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#bankrollGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Notes */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px] text-slate-400">
        <span>Início: {formatCurrency(monthConfig.initialBankroll)}</span>
        <span className="text-emerald-400 font-medium">
          {monthlyStats.netProfit >= 0 ? '▲ Curva em Crescimento' : '▼ Gestão de Proteção Ativa'}
        </span>
      </div>
    </div>
  );
};
