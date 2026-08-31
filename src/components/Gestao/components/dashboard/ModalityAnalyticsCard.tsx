import React from 'react';
import {
  Zap,
  TrendingUp,
  BarChart3,
  Coins,
  Globe,
  PieChart as PieIcon,
  ShieldCheck,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Flame,
  Award,
  Layers,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { TradingModality, Operation, MonthConfig } from '../../types';
import { ModalityAnalytics } from '../../types';
import { formatSecondsToTime } from '../../utils/formatters';

interface ModalityAnalyticsCardProps {
  analytics: ModalityAnalytics;
  selectedModality: TradingModality;
  monthConfig: MonthConfig;
  formatCurrency: (val: number, showSign?: boolean) => string;
}

export const ModalityAnalyticsCard: React.FC<ModalityAnalyticsCardProps> = ({
  analytics,
  selectedModality,
  monthConfig,
  formatCurrency,
}) => {
  // Renders distinct analytics based on the selected modality

  // 1. FOREX VIEW
  if (selectedModality === 'FOREX') {
    const pairsData = (analytics.forexPairsBreakdown || []).slice(0, 5);

    return (
      <div className="p-5 bg-[#121722] border border-emerald-500/30 rounded-xl space-y-4 shadow-lg shadow-emerald-950/20" id="card-forex-analytics">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                Análise Especializada: Forex & Metais
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Global FX
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pips, dimensionamento em lotes, risco:retorno e pares operados
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-sans">Saldo de Pips no Mês</span>
            <span className={`text-base font-black font-mono ${(analytics.forexTotalPips || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(analytics.forexTotalPips || 0) > 0 ? '+' : ''}{analytics.forexTotalPips || 0} pips
            </span>
          </div>
        </div>

        {/* Forex Key KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 font-sans block">Volume em Lotes</span>
            <strong className="text-base text-white font-black block mt-0.5">
              {analytics.forexTotalLots || 0} lotes
            </strong>
            <span className="text-[10px] text-slate-500">Total transacionado</span>
          </div>

          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 font-sans block">Risco x Retorno Médio</span>
            <strong className="text-base text-cyan-400 font-black block mt-0.5">
              1 : {analytics.forexAvgRiskReward || 2.0}
            </strong>
            <span className="text-[10px] text-slate-500">Relação Realizada</span>
          </div>

          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 font-sans block">Profit Factor</span>
            <strong className="text-base text-emerald-400 font-black block mt-0.5">
              {analytics.profitFactor > 0 ? analytics.profitFactor : '-'}
            </strong>
            <span className="text-[10px] text-slate-500">Lucro Bruto / Perda</span>
          </div>

          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 font-sans block">Assertividade Forex</span>
            <strong className="text-base text-amber-400 font-black block mt-0.5">
              {analytics.winRate}%
            </strong>
            <span className="text-[10px] text-slate-500">{analytics.wins}W / {analytics.losses}L</span>
          </div>
        </div>

        {/* Top Currency Pairs Ranking */}
        {pairsData.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <span className="text-xs font-bold text-slate-300 block font-sans">
              Desempenho por Par de Moedas / Ativo:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {pairsData.map((item) => (
                <div
                  key={item.pair}
                  className="p-2.5 bg-[#0b0e14] border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <strong className="text-white font-bold block">{item.pair}</strong>
                    <span className="text-[10px] text-slate-400 font-sans">{item.trades} trades</span>
                  </div>
                  <div className="text-right">
                    <span className={`block font-bold ${item.pips >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.pips > 0 ? '+' : ''}{item.pips} pips
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatCurrency(item.profit, true)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. B3 (BRASIL) VIEW
  if (selectedModality === 'B3') {
    return (
      <div className="p-5 bg-[#121722] border border-blue-500/30 rounded-xl space-y-4 shadow-lg shadow-blue-950/20" id="card-b3-analytics">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                Análise Especializada: B3 (Bolsa Brasileira)
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  WIN & WDO Futuros
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pontuação líquida do Mini Índice, Mini Dólar, contratos e eficiência por pregão
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-sans">Lucro Líquido B3</span>
            <span className={`text-base font-black font-mono ${analytics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(analytics.netProfit, true)}
            </span>
          </div>
        </div>

        {/* B3 Key KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 font-sans block">Mini Índice (WIN)</span>
            <strong className={`text-base font-black block mt-0.5 ${(analytics.b3TotalWinPoints || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(analytics.b3TotalWinPoints || 0) > 0 ? '+' : ''}{analytics.b3TotalWinPoints || 0} pts
            </strong>
            <span className="text-[10px] text-slate-500">R$ 0,20 por ponto</span>
          </div>

          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 font-sans block">Mini Dólar (WDO)</span>
            <strong className={`text-base font-black block mt-0.5 ${(analytics.b3TotalWdoPoints || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(analytics.b3TotalWdoPoints || 0) > 0 ? '+' : ''}{analytics.b3TotalWdoPoints || 0} pts
            </strong>
            <span className="text-[10px] text-slate-500">R$ 10,00 por ponto</span>
          </div>

          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 font-sans block">Contratos Negociados</span>
            <strong className="text-base text-cyan-400 font-black block mt-0.5">
              {analytics.b3TotalContracts || 0} ctr
            </strong>
            <span className="text-[10px] text-slate-500">Volume de contratos</span>
          </div>

          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 font-sans block">Resultado / Contrato</span>
            <strong className={`text-base font-black block mt-0.5 ${(analytics.b3ProfitPerContract || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(analytics.b3ProfitPerContract || 0, true)}
            </strong>
            <span className="text-[10px] text-slate-500">Eficiência média</span>
          </div>
        </div>

        <div className="p-3 bg-[#0b0e14] border border-slate-800/80 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
          <div className="flex items-center space-x-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>
              <strong>Dica de Risco B3:</strong> Mantenha limite de perda diária pré-definido no Home Broker (Profit/MetaTrader) para proteger o capital.
            </span>
          </div>
          <span className="font-mono text-slate-400 text-[11px]">
            Pregões operados: <strong>{analytics.operatedDaysCount} dias</strong>
          </span>
        </div>
      </div>
    );
  }

  // 3. CRIPTO VIEW
  if (selectedModality === 'CRIPTO') {
    const coinsData = (analytics.cryptoCoinsBreakdown || []).slice(0, 5);

    return (
      <div className="p-5 bg-[#121722] border border-purple-500/30 rounded-xl space-y-4 shadow-lg shadow-purple-950/20" id="card-crypto-analytics">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                Análise Especializada: Cripto Futuros & Perpétuos
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  USDT-M
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                ROI sobre margem, alavancagem média ponderada e assertividade Long vs Short
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-sans">ROI Médio sobre Margem</span>
            <span className={`text-base font-black font-mono ${(analytics.cryptoAvgRoi || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(analytics.cryptoAvgRoi || 0) > 0 ? '+' : ''}{analytics.cryptoAvgRoi || 0}%
            </span>
          </div>
        </div>

        {/* Cripto Key KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 font-sans block">Alavancagem Média</span>
            <strong className="text-base text-purple-400 font-black block mt-0.5">
              {analytics.cryptoAvgLeverage || 10}x
            </strong>
            <span className="text-[10px] text-slate-500">Modo Isolado</span>
          </div>

          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 font-sans block">Assertividade Long (Compra)</span>
            <strong className="text-base text-emerald-400 font-black block mt-0.5">
              {analytics.cryptoLongsWinRate !== undefined ? `${analytics.cryptoLongsWinRate}%` : '-'}
            </strong>
            <span className="text-[10px] text-slate-500">Posições de Alta</span>
          </div>

          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 font-sans block">Assertividade Short (Venda)</span>
            <strong className="text-base text-rose-400 font-black block mt-0.5">
              {analytics.cryptoShortsWinRate !== undefined ? `${analytics.cryptoShortsWinRate}%` : '-'}
            </strong>
            <span className="text-[10px] text-slate-500">Posições de Baixa</span>
          </div>

          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 font-sans block">Lucro Líquido Cripto</span>
            <strong className={`text-base font-black block mt-0.5 ${analytics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(analytics.netProfit, true)}
            </strong>
            <span className="text-[10px] text-slate-500">{analytics.totalOperations} trades</span>
          </div>
        </div>

        {/* Crypto Coins Ranking */}
        {coinsData.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <span className="text-xs font-bold text-slate-300 block font-sans">
              Desempenho por Criptomoeda:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {coinsData.map((item) => (
                <div
                  key={item.coin}
                  className="p-2.5 bg-[#0b0e14] border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <strong className="text-white font-bold block">{item.coin}</strong>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {item.trades} trades • {item.roi > 0 ? '+' : ''}{item.roi}% ROI
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`block font-bold ${item.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(item.profit, true)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. BINÁRIAS VIEW
  if (selectedModality === 'BINARIAS') {
    return (
      <div className="p-5 bg-[#121722] border border-orange-500/30 rounded-xl space-y-4 shadow-lg shadow-orange-950/20" id="card-binary-analytics">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                Análise Especializada: Opções Binárias
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Binary Options
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Assertividade real, payout médio, comparação Mercado Aberto vs OTC e tempos de expiração
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-sans">Payout Médio Ponderado</span>
            <span className="text-base font-black font-mono text-cyan-400">
              {analytics.binaryAvgPayout || 85}%
            </span>
          </div>
        </div>

        {/* Binary Key KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 font-sans block">Assertividade Total</span>
            <strong className="text-base text-orange-400 font-black block mt-0.5">
              {analytics.winRate}%
            </strong>
            <span className="text-[10px] text-slate-500">{analytics.wins}W / {analytics.losses}L</span>
          </div>

          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 font-sans block">Taxa Mercado Aberto</span>
            <strong className="text-base text-emerald-400 font-black block mt-0.5">
              {analytics.binaryOpenWinRate !== undefined ? `${analytics.binaryOpenWinRate}%` : '-'}
            </strong>
            <span className="text-[10px] text-slate-500">Horário Regular</span>
          </div>

          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 font-sans block">Taxa Mercado OTC</span>
            <strong className="text-base text-purple-400 font-black block mt-0.5">
              {analytics.binaryOtcWinRate !== undefined ? `${analytics.binaryOtcWinRate}%` : '-'}
            </strong>
            <span className="text-[10px] text-slate-500">Over-the-Counter</span>
          </div>

          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 font-sans block">Lucro Líquido Binárias</span>
            <strong className={`text-base font-black block mt-0.5 ${analytics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(analytics.netProfit, true)}
            </strong>
            <span className="text-[10px] text-slate-500">{analytics.totalOperations} entradas</span>
          </div>
        </div>

        {/* Timeframe Breakdown */}
        {analytics.binaryTimeframeBreakdown && (
          <div className="p-3 bg-[#0b0e14] border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="text-slate-400 font-sans text-xs font-medium">Expirações Utilizadas:</span>
            <div className="flex items-center space-x-3">
              <span className="text-slate-300">
                M1: <strong className="text-orange-400">{analytics.binaryTimeframeBreakdown.M1} ops</strong>
              </span>
              <span className="text-slate-300">
                M5: <strong className="text-cyan-400">{analytics.binaryTimeframeBreakdown.M5} ops</strong>
              </span>
              <span className="text-slate-300">
                M15: <strong className="text-emerald-400">{analytics.binaryTimeframeBreakdown.M15} ops</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 5. ALL CONSOLIDATED MULTI-MARKET VIEW
  const share = analytics.marketShareProfit || { binarias: 0, forex: 0, b3: 0, crypto: 0 };
  const pieData = [
    { name: 'Binárias', value: Math.max(0, share.binarias), color: '#f97316' },
    { name: 'Forex', value: Math.max(0, share.forex), color: '#10b981' },
    { name: 'B3', value: Math.max(0, share.b3), color: '#3b82f6' },
    { name: 'Cripto', value: Math.max(0, share.crypto), color: '#a855f7' },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-5 bg-[#121722] border border-slate-800 rounded-xl space-y-4" id="card-consolidated-analytics">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Matriz de Desempenho Multi-Mercado (Consolidado Geral)
            </h3>
            <p className="text-[11px] text-slate-400">
              Distribuição de lucros e assertividade entre todos os mercados operados
            </p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-[10px] text-slate-400 block font-sans">Lucro Consolidado</span>
          <span className={`text-base font-black ${analytics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(analytics.netProfit, true)}
          </span>
        </div>
      </div>

      {/* 4 Markets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        {/* Binárias */}
        <div className="p-3.5 bg-[#0b0e14] border border-orange-500/30 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-orange-400 font-sans flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Opções Binárias
            </span>
            <span className="text-[10px] text-slate-500 font-sans">Payout & WinRate</span>
          </div>
          <div>
            <span className="text-lg font-bold text-white block">
              {formatCurrency(share.binarias, true)}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">
              Lucro acumulado no mês
            </span>
          </div>
        </div>

        {/* Forex */}
        <div className="p-3.5 bg-[#0b0e14] border border-emerald-500/30 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 font-sans flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Forex & Metais
            </span>
            <span className="text-[10px] text-slate-500 font-sans">Pips & Lotes</span>
          </div>
          <div>
            <span className="text-lg font-bold text-white block">
              {formatCurrency(share.forex, true)}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">
              Lucro acumulado no mês
            </span>
          </div>
        </div>

        {/* B3 */}
        <div className="p-3.5 bg-[#0b0e14] border border-blue-500/30 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-400 font-sans flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> B3 Futuros & Ações
            </span>
            <span className="text-[10px] text-slate-500 font-sans">WIN & WDO</span>
          </div>
          <div>
            <span className="text-lg font-bold text-white block">
              {formatCurrency(share.b3, true)}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">
              Lucro acumulado no mês
            </span>
          </div>
        </div>

        {/* Cripto */}
        <div className="p-3.5 bg-[#0b0e14] border border-purple-500/30 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-400 font-sans flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" /> Cripto Futuros
            </span>
            <span className="text-[10px] text-slate-500 font-sans">ROI & Alavancagem</span>
          </div>
          <div>
            <span className="text-lg font-bold text-white block">
              {formatCurrency(share.crypto, true)}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">
              Lucro acumulado no mês
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
