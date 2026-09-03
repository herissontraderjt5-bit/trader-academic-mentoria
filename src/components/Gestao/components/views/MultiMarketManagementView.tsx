import React, { useState, useMemo, useEffect } from 'react';
import {
  Globe,
  Coins,
  TrendingUp,
  Percent,
  Calculator,
  CheckCircle,
  Zap,
  DollarSign,
  Layers,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import {
  MultiMarketType,
  ForexCalculationResult,
  B3CalculationResult,
  CryptoCalculationResult,
} from '../../types';
import {
  calculateForexLotSize,
  calculateB3Contracts,
  calculateCryptoPosition,
} from '../../utils/calculations';
import { getCurrentTimeString, getTodayDateString } from '../../utils/formatters';

export const MultiMarketManagementView: React.FC = () => {
  const {
    monthlyStats,
    monthConfig,
    formatCurrency,
    addOperation,
  } = useTrading();

  // Active Market Tab
  const [activeMarket, setActiveMarket] = useState<MultiMarketType>('FOREX');

  // Unified Base Capital
  const [customBankroll, setCustomBankroll] = useState<number>(
    Math.max(100, monthlyStats.currentBankroll || monthConfig.initialBankroll || 1000)
  );

  // Common Risk settings
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const fixedRiskAmount = useMemo(() => {
    return Number(((customBankroll * riskPercent) / 100).toFixed(2));
  }, [customBankroll, riskPercent]);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // FOREX
  const forexPresets = [
    { asset: 'EUR/USD', price: 1.085, pipDigits: 4 },
    { asset: 'GBP/USD', price: 1.295, pipDigits: 4 },
    { asset: 'USD/JPY', price: 154.2, pipDigits: 2 },
    { asset: 'AUD/USD', price: 0.655, pipDigits: 4 },
    { asset: 'XAU/USD (Ouro)', price: 2450.0, pipDigits: 2 },
    { asset: 'US30 (Dow Jones)', price: 40500.0, pipDigits: 1 },
    { asset: 'NAS100 (Nasdaq)', price: 19800.0, pipDigits: 1 },
  ];

  const [forexAsset, setForexAsset] = useState<string>('EUR/USD');
  const [forexStopPips, setForexStopPips] = useState<number>(20);
  const [forexTargetPips, setForexTargetPips] = useState<number>(40);

  const riskAmountVal = useMemo(() => {
    return Number(((customBankroll * riskPercent) / 100).toFixed(2));
  }, [customBankroll, riskPercent]);

  const forexCalculations: ForexCalculationResult = useMemo(() => {
    return calculateForexLotSize({
      bankroll: customBankroll,
      riskAmount: riskAmountVal,
      stopLossPips: forexStopPips,
      takeProfitPips: forexTargetPips,
      asset: forexAsset,
    });
  }, [customBankroll, riskAmountVal, forexStopPips, forexTargetPips, forexAsset]);

  // B3
  const [b3Asset, setB3Asset] = useState<'WIN' | 'WDO'>('WIN');
  const [b3StopPoints, setB3StopPoints] = useState<number>(150);
  const [b3TargetPoints, setB3TargetPoints] = useState<number>(300);

  const b3Calculations: B3CalculationResult = useMemo(() => {
    return calculateB3Contracts({
      bankroll: customBankroll,
      riskAmount: riskAmountVal,
      stopLossPoints: b3StopPoints,
      takeProfitPoints: b3TargetPoints,
      instrumentType: b3Asset,
    });
  }, [customBankroll, riskAmountVal, b3StopPoints, b3TargetPoints, b3Asset]);

  // CRYPTO
  const [cryptoAsset, setCryptoAsset] = useState<string>('BTC/USDT');
  const [cryptoEntryPrice, setCryptoEntryPrice] = useState<number>(93500);
  const [cryptoStopPrice, setCryptoStopPrice] = useState<number>(92100);
  const [cryptoTargetPrice, setCryptoTargetPrice] = useState<number>(96300);
  const [cryptoLeverage, setCryptoLeverage] = useState<number>(10);
  const [cryptoDirection, setCryptoDirection] = useState<'LONG' | 'SHORT'>('LONG');

  const cryptoCalculations: CryptoCalculationResult = useMemo(() => {
    return calculateCryptoPosition({
      bankroll: customBankroll,
      riskAmount: riskAmountVal,
      entryPrice: cryptoEntryPrice,
      stopLossPrice: cryptoStopPrice,
      takeProfitPrice: cryptoTargetPrice,
      leverage: cryptoLeverage,
      direction: cryptoDirection,
    });
  }, [
    customBankroll,
    riskAmountVal,
    cryptoEntryPrice,
    cryptoStopPrice,
    cryptoTargetPrice,
    cryptoLeverage,
    cryptoDirection,
  ]);

  // Register Trade in History
  const handleRegisterTrade = (outcome: 'WIN' | 'LOSS') => {
    const timeStr = getCurrentTimeString();
    const dateStr = getTodayDateString();

    let asset = '';
    let profit = 0;
    let investment = 0;
    let notes = '';

    if (activeMarket === 'FOREX') {
      asset = forexAsset;
      investment = forexCalculations.riskAmount;
      profit = outcome === 'WIN' ? forexCalculations.rewardAmount : -forexCalculations.riskAmount;
      notes = `Forex - Lote: ${forexCalculations.lotSize} | Stop: ${forexStopPips} pips | Alvo: ${forexTargetPips} pips`;
    } else if (activeMarket === 'B3') {
      asset = b3Asset === 'WIN' ? 'Mini-Índice (WIN)' : 'Mini-Dólar (WDO)';
      investment = b3Calculations.riskAmount;
      profit = outcome === 'WIN' ? b3Calculations.rewardAmount : -b3Calculations.riskAmount;
      notes = `B3 - ${b3Calculations.contracts} contratos | Stop: ${b3StopPoints} pts | Alvo: ${b3TargetPoints} pts`;
    } else {
      asset = cryptoAsset;
      investment = cryptoCalculations.isolatedMargin;
      profit = outcome === 'WIN' ? cryptoCalculations.rewardAmount : -cryptoCalculations.riskAmount;
      notes = `Cripto ${cryptoDirection} (${cryptoLeverage}x) | Stop: $${cryptoStopPrice} | Alvo: $${cryptoTargetPrice}`;
    }

    addOperation({
      date: dateStr,
      time: timeStr,
      asset,
      marketType: 'ABERTO',
      direction: 'CALL',
      investment,
      payout: 100,
      expiration: 'SWING',
      strategy: `${activeMarket} Management`,
      result: outcome,
      notes,
    });

    setSaveSuccessMsg(`Operação de ${activeMarket} (${outcome}) registrada no Diário!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  return (
    <div className="space-y-4 pb-10" id="view-multi-market">
      {/* Header Resumido */}
      <div className="p-4 bg-[#0D111A] border border-[#1E2536] rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Gestão Multi-Mercados
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Lotes & Posição
              </span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Dimensionamento de risco para Forex, B3 e Cripto
            </span>
          </div>
        </div>

        {/* Market Selector Tabs */}
        <div className="flex items-center gap-1 bg-[#121620] p-1 rounded-xl border border-[#222B3D]">
          <button
            type="button"
            onClick={() => setActiveMarket('FOREX')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeMarket === 'FOREX'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Forex
          </button>
          <button
            type="button"
            onClick={() => setActiveMarket('B3')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeMarket === 'B3'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            B3 (Mini)
          </button>
          <button
            type="button"
            onClick={() => setActiveMarket('CRYPTO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeMarket === 'CRYPTO'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Cripto
          </button>
        </div>
      </div>

      {/* Global Capital & Risk Bar */}
      <div className="p-3.5 bg-[#0D111A] border border-[#1E2536] rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="text-[10px] text-slate-400 font-bold block mb-1">Capital da Conta</label>
          <input
            type="number"
            value={customBankroll}
            onChange={(e) => setCustomBankroll(parseFloat(e.target.value) || 100)}
            className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-bold block mb-1">Risco por Trade (%)</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              value={riskPercent}
              onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 1)}
              className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
            />
            <span className="text-slate-400 font-mono font-bold px-1.5">%</span>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-bold block mb-1">Valor do Risco Máximo</label>
          <div className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2.5 py-1.5 text-xs text-rose-400 font-mono font-bold">
            {formatCurrency(fixedRiskAmount)}
          </div>
        </div>
      </div>

      {/* FOREX VIEW */}
      {activeMarket === 'FOREX' && (
        <div className="space-y-3">
          {/* Inputs */}
          <div className="p-3.5 bg-[#0D111A] border border-[#1E2536] rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Par / Ativo</label>
              <select
                value={forexAsset}
                onChange={(e) => setForexAsset(e.target.value)}
                className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2 py-1.5 text-xs text-white"
              >
                {forexPresets.map((p) => (
                  <option key={p.asset} value={p.asset}>{p.asset}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Stop Loss (Pips)</label>
              <input
                type="number"
                min="1"
                value={forexStopPips}
                onChange={(e) => setForexStopPips(parseFloat(e.target.value) || 10)}
                className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Alvo / Take Profit (Pips)</label>
              <input
                type="number"
                min="1"
                value={forexTargetPips}
                onChange={(e) => setForexTargetPips(parseFloat(e.target.value) || 20)}
                className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Cards Calculados */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 bg-[#0D111A] border border-orange-500/30 rounded-xl space-y-1">
              <span className="text-[10px] text-orange-400 uppercase font-sans font-bold block">Tamanho do Lote</span>
              <div className="text-xl font-black text-orange-400">{forexCalculations.lotSize}</div>
              <span className="text-[10px] text-slate-400 block">Lotes Padrão</span>
            </div>

            <div className="p-3 bg-[#0D111A] border border-rose-500/30 rounded-xl space-y-1">
              <span className="text-[10px] text-rose-400 uppercase font-sans font-bold block">Risco Máximo</span>
              <div className="text-xl font-black text-rose-400">-{formatCurrency(forexCalculations.riskAmount)}</div>
              <span className="text-[10px] text-slate-400 block">-{riskPercent}% do capital</span>
            </div>

            <div className="p-3 bg-[#0D111A] border border-emerald-500/30 rounded-xl space-y-1">
              <span className="text-[10px] text-emerald-400 uppercase font-sans font-bold block">Lucro Projetado</span>
              <div className="text-xl font-black text-emerald-400">+{formatCurrency(forexCalculations.rewardAmount)}</div>
              <span className="text-[10px] text-slate-400 block">+{((forexCalculations.rewardAmount / customBankroll) * 100).toFixed(1)}%</span>
            </div>

            <div className="p-3 bg-[#0D111A] border border-[#1E2536] rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Relação R:R</span>
              <div className="text-xl font-black text-white">1 : {forexCalculations.riskRewardRatio}</div>
              <span className="text-[10px] text-emerald-400 block">Favorável</span>
            </div>
          </div>
        </div>
      )}

      {/* B3 VIEW */}
      {activeMarket === 'B3' && (
        <div className="space-y-3">
          <div className="p-3.5 bg-[#0D111A] border border-[#1E2536] rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Contrato Futuro</label>
              <select
                value={b3Asset}
                onChange={(e) => {
                  const val = e.target.value as 'WIN' | 'WDO';
                  setB3Asset(val);
                  setB3StopPoints(val === 'WIN' ? 150 : 5);
                  setB3TargetPoints(val === 'WIN' ? 300 : 10);
                }}
                className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2 py-1.5 text-xs text-white font-bold"
              >
                <option value="WIN">Mini-Índice (WIN) - R$ 0,20/pt</option>
                <option value="WDO">Mini-Dólar (WDO) - R$ 10,00/pt</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Stop Loss (Pontos)</label>
              <input
                type="number"
                value={b3StopPoints}
                onChange={(e) => setB3StopPoints(parseFloat(e.target.value) || 10)}
                className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Alvo (Pontos)</label>
              <input
                type="number"
                value={b3TargetPoints}
                onChange={(e) => setB3TargetPoints(parseFloat(e.target.value) || 20)}
                className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 bg-[#0D111A] border border-emerald-500/30 rounded-xl space-y-1">
              <span className="text-[10px] text-emerald-400 uppercase font-sans font-bold block">Contratos</span>
              <div className="text-xl font-black text-emerald-400">{b3Calculations.contracts}</div>
              <span className="text-[10px] text-slate-400 block">{b3Asset === 'WIN' ? 'Mini-Contratos WIN' : 'Mini-Contratos WDO'}</span>
            </div>

            <div className="p-3 bg-[#0D111A] border border-rose-500/30 rounded-xl space-y-1">
              <span className="text-[10px] text-rose-400 uppercase font-sans font-bold block">Risco Máximo</span>
              <div className="text-xl font-black text-rose-400">-{formatCurrency(b3Calculations.riskAmount)}</div>
              <span className="text-[10px] text-slate-400 block">-{riskPercent}%</span>
            </div>

            <div className="p-3 bg-[#0D111A] border border-emerald-500/30 rounded-xl space-y-1">
              <span className="text-[10px] text-emerald-400 uppercase font-sans font-bold block">Lucro Projetado</span>
              <div className="text-xl font-black text-emerald-400">+{formatCurrency(b3Calculations.rewardAmount)}</div>
              <span className="text-[10px] text-slate-400 block">+{((b3Calculations.rewardAmount / customBankroll) * 100).toFixed(1)}%</span>
            </div>

            <div className="p-3 bg-[#0D111A] border border-[#1E2536] rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Relação R:R</span>
              <div className="text-xl font-black text-white">1 : {b3Calculations.riskRewardRatio}</div>
              <span className="text-[10px] text-emerald-400 block">Favorável</span>
            </div>
          </div>
        </div>
      )}

      {/* CRIPTO VIEW */}
      {activeMarket === 'CRYPTO' && (
        <div className="space-y-3">
          <div className="p-3.5 bg-[#0D111A] border border-[#1E2536] rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Criptoativo</label>
              <select
                value={cryptoAsset}
                onChange={(e) => setCryptoAsset(e.target.value)}
                className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2 py-1.5 text-xs text-white"
              >
                <option value="BTC/USDT">BTC/USDT</option>
                <option value="ETH/USDT">ETH/USDT</option>
                <option value="SOL/USDT">SOL/USDT</option>
                <option value="BNB/USDT">BNB/USDT</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Direção</label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setCryptoDirection('LONG')}
                  className={`py-1.5 rounded text-xs font-bold ${
                    cryptoDirection === 'LONG' ? 'bg-emerald-600 text-white' : 'bg-[#121620] text-slate-400'
                  }`}
                >
                  LONG ↗
                </button>
                <button
                  type="button"
                  onClick={() => setCryptoDirection('SHORT')}
                  className={`py-1.5 rounded text-xs font-bold ${
                    cryptoDirection === 'SHORT' ? 'bg-rose-600 text-white' : 'bg-[#121620] text-slate-400'
                  }`}
                >
                  SHORT ↘
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Preço Entrada ($)</label>
              <input
                type="number"
                value={cryptoEntryPrice}
                onChange={(e) => setCryptoEntryPrice(parseFloat(e.target.value) || 1)}
                className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Alavancagem</label>
              <select
                value={cryptoLeverage}
                onChange={(e) => setCryptoLeverage(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2 py-1.5 text-xs text-white font-mono font-bold"
              >
                <option value="1">1x (Spot)</option>
                <option value="2">2x</option>
                <option value="5">5x</option>
                <option value="10">10x</option>
                <option value="20">20x</option>
                <option value="50">50x</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 bg-[#0D111A] border border-cyan-500/30 rounded-xl space-y-1">
              <span className="text-[10px] text-cyan-400 uppercase font-sans font-bold block">Margem Necessária</span>
              <div className="text-xl font-black text-cyan-300">{formatCurrency(cryptoCalculations.isolatedMargin)}</div>
              <span className="text-[10px] text-slate-400 block">{cryptoCalculations.coinAmount} {cryptoAsset.split('/')[0]}</span>
            </div>

            <div className="p-3 bg-[#0D111A] border border-rose-500/30 rounded-xl space-y-1">
              <span className="text-[10px] text-rose-400 uppercase font-sans font-bold block">Risco Máximo</span>
              <div className="text-xl font-black text-rose-400">-{formatCurrency(cryptoCalculations.riskAmount)}</div>
              <span className="text-[10px] text-slate-400 block">Stop: ${cryptoStopPrice}</span>
            </div>

            <div className="p-3 bg-[#0D111A] border border-emerald-500/30 rounded-xl space-y-1">
              <span className="text-[10px] text-emerald-400 uppercase font-sans font-bold block">Lucro Projetado</span>
              <div className="text-xl font-black text-emerald-400">+{formatCurrency(cryptoCalculations.rewardAmount)}</div>
              <span className="text-[10px] text-slate-400 block">Alvo: ${cryptoTargetPrice}</span>
            </div>

            <div className="p-3 bg-[#0D111A] border border-[#1E2536] rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Relação R:R</span>
              <div className="text-xl font-black text-white">1 : {cryptoCalculations.riskRewardRatio}</div>
              <span className="text-[10px] text-emerald-400 block">Favorável</span>
            </div>
          </div>
        </div>
      )}

      {/* Botões de Registro Rápido no Diário */}
      <div className="p-3.5 bg-[#0D111A] border border-[#1E2536] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-slate-300 font-bold">
          Registrar resultado da operação calculada:
        </span>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleRegisterTrade('WIN')}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Registrar WIN no Diário
          </button>
          <button
            type="button"
            onClick={() => handleRegisterTrade('LOSS')}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            Registrar LOSS no Diário
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-center text-xs font-bold text-emerald-400 animate-in fade-in">
          {saveSuccessMsg}
        </div>
      )}
    </div>
  );
};
