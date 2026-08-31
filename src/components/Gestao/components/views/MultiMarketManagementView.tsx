import React, { useState, useMemo, useEffect } from 'react';
import {
  Globe,
  Coins,
  TrendingUp,
  Percent,
  Layers,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Zap,
  Sliders,
  DollarSign,
  TrendingDown,
  Info,
  Scale,
  Sparkles,
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

  // Unified Base Capital (defaults to monthlyStats.currentBankroll or 1000)
  const [customBankroll, setCustomBankroll] = useState<number>(
    Math.max(100, monthlyStats.currentBankroll || monthConfig.initialBankroll || 1000)
  );

  // Common Risk settings (% or fixed amount)
  const [riskMode, setRiskMode] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [riskPercent, setRiskPercent] = useState<number>(1.5); // 1.5%
  const [fixedRiskAmount, setFixedRiskAmount] = useState<number>(15);

  // Keep capital and fixed risk synced
  useEffect(() => {
    if (riskMode === 'PERCENT') {
      setFixedRiskAmount(Number(((customBankroll * riskPercent) / 100).toFixed(2)));
    }
  }, [customBankroll, riskPercent, riskMode]);

  // Toast / feedback message when registering
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // ==========================================
  // 1. FOREX STATE
  // ==========================================
  const forexPresets = [
    { asset: 'EUR/USD', type: 'CURRENCY', price: 1.085, pipDigits: 4, spread: 0.8 },
    { asset: 'GBP/USD', type: 'CURRENCY', price: 1.295, pipDigits: 4, spread: 1.0 },
    { asset: 'USD/JPY', type: 'CURRENCY', price: 154.2, pipDigits: 2, spread: 0.9 },
    { asset: 'USD/CAD', type: 'CURRENCY', price: 1.378, pipDigits: 4, spread: 1.2 },
    { asset: 'USD/CHF', type: 'CURRENCY', price: 0.892, pipDigits: 4, spread: 1.1 },
    { asset: 'AUD/USD', type: 'CURRENCY', price: 0.655, pipDigits: 4, spread: 0.9 },
    { asset: 'NZD/USD', type: 'CURRENCY', price: 0.598, pipDigits: 4, spread: 1.2 },
    { asset: 'EUR/JPY', type: 'CURRENCY', price: 167.3, pipDigits: 2, spread: 1.3 },
    { asset: 'GBP/JPY', type: 'CURRENCY', price: 199.5, pipDigits: 2, spread: 1.5 },
    { asset: 'XAU/USD (Ouro)', type: 'METAL', price: 2450.0, pipDigits: 2, spread: 2.0 },
    { asset: 'US30 (Dow Jones)', type: 'INDEX', price: 40500.0, pipDigits: 1, spread: 3.0 },
    { asset: 'NAS100 (Nasdaq)', type: 'INDEX', price: 19800.0, pipDigits: 1, spread: 1.5 },
  ];

  const [forexAsset, setForexAsset] = useState<string>('EUR/USD');
  const [forexLeverage, setForexLeverage] = useState<number>(100);
  const [forexInputMode, setForexInputMode] = useState<'PIPS' | 'PRICES'>('PIPS');
  const [forexStopPips, setForexStopPips] = useState<number>(20);
  const [forexTargetPips, setForexTargetPips] = useState<number>(40);
  const [forexEntryPrice, setForexEntryPrice] = useState<number>(1.085);
  const [forexStopPrice, setForexStopPrice] = useState<number>(1.083);
  const [forexTargetPrice, setForexTargetPrice] = useState<number>(1.089);

  // Sync forex prices when pips change or asset changes
  const handleForexAssetChange = (newAsset: string) => {
    setForexAsset(newAsset);
    const item = forexPresets.find((p) => p.asset === newAsset);
    if (item) {
      setForexEntryPrice(item.price);
      const pipMultiplier = item.pipDigits === 2 ? 0.01 : item.pipDigits === 1 ? 1 : 0.0001;
      setForexStopPrice(Number((item.price - forexStopPips * pipMultiplier).toFixed(item.pipDigits)));
      setForexTargetPrice(Number((item.price + forexTargetPips * pipMultiplier).toFixed(item.pipDigits)));
    }
  };

  // Compute calculated pips if PRICES mode
  const effectiveForexStopPips = useMemo(() => {
    if (forexInputMode === 'PIPS') return Math.max(1, forexStopPips);
    const item = forexPresets.find((p) => p.asset === forexAsset);
    const pipMultiplier = item?.pipDigits === 2 ? 0.01 : item?.pipDigits === 1 ? 1 : 0.0001;
    const diff = Math.abs(forexEntryPrice - forexStopPrice);
    return Math.max(1, Number((diff / pipMultiplier).toFixed(1)));
  }, [forexInputMode, forexStopPips, forexEntryPrice, forexStopPrice, forexAsset]);

  const effectiveForexTargetPips = useMemo(() => {
    if (forexInputMode === 'PIPS') return Math.max(1, forexTargetPips);
    const item = forexPresets.find((p) => p.asset === forexAsset);
    const pipMultiplier = item?.pipDigits === 2 ? 0.01 : item?.pipDigits === 1 ? 1 : 0.0001;
    const diff = Math.abs(forexTargetPrice - forexEntryPrice);
    return Math.max(1, Number((diff / pipMultiplier).toFixed(1)));
  }, [forexInputMode, forexTargetPips, forexTargetPrice, forexEntryPrice, forexAsset]);

  const forexResult: ForexCalculationResult = useMemo(() => {
    const riskVal = riskMode === 'PERCENT' ? (customBankroll * riskPercent) / 100 : fixedRiskAmount;
    return calculateForexLotSize({
      bankroll: customBankroll,
      riskAmount: riskVal,
      stopLossPips: effectiveForexStopPips,
      takeProfitPips: effectiveForexTargetPips,
      asset: forexAsset,
      leverage: forexLeverage,
      currentPrice: forexEntryPrice,
    });
  }, [
    customBankroll,
    riskMode,
    riskPercent,
    fixedRiskAmount,
    effectiveForexStopPips,
    effectiveForexTargetPips,
    forexAsset,
    forexLeverage,
    forexEntryPrice,
  ]);

  // ==========================================
  // 2. B3 (BOLSA BRASILEIRA) STATE
  // ==========================================
  const b3Instruments = [
    {
      id: 'WIN',
      name: 'WIN (Mini Índice Bovespa)',
      pointValue: 0.2,
      tickSize: 5,
      defaultStop: 150,
      defaultTarget: 300,
      defaultMargin: 100,
      unit: 'pontos',
      entryPrice: 131500,
    },
    {
      id: 'WDO',
      name: 'WDO (Mini Dólar Futuro)',
      pointValue: 10.0,
      tickSize: 0.5,
      defaultStop: 5.0,
      defaultTarget: 10.0,
      defaultMargin: 150,
      unit: 'pontos',
      entryPrice: 5.55,
    },
    {
      id: 'STOCKS',
      name: 'Ações / BDRs (PETR4, VALE3, etc.)',
      pointValue: 1.0,
      tickSize: 0.01,
      defaultStop: 0.4,
      defaultTarget: 0.8,
      defaultMargin: 35.0,
      unit: 'R$',
      entryPrice: 38.5,
    },
    {
      id: 'WSP',
      name: 'WSP (Micro S&P 500 Futuro)',
      pointValue: 13.5,
      tickSize: 0.25,
      defaultStop: 10,
      defaultTarget: 20,
      defaultMargin: 200,
      unit: 'pontos',
      entryPrice: 5600,
    },
  ];

  const [b3Instrument, setB3Instrument] = useState<'WIN' | 'WDO' | 'STOCKS' | 'WSP'>('WIN');
  const [b3InputMode, setB3InputMode] = useState<'POINTS' | 'PRICES'>('POINTS');
  const [b3StopPoints, setB3StopPoints] = useState<number>(150);
  const [b3TargetPoints, setB3TargetPoints] = useState<number>(300);
  const [b3EntryPrice, setB3EntryPrice] = useState<number>(131500);
  const [b3StopPrice, setB3StopPrice] = useState<number>(131350);
  const [b3TargetPrice, setB3TargetPrice] = useState<number>(131800);
  const [b3MarginPerContract, setB3MarginPerContract] = useState<number>(100);

  const handleB3InstrumentChange = (inst: 'WIN' | 'WDO' | 'STOCKS' | 'WSP') => {
    setB3Instrument(inst);
    const item = b3Instruments.find((b) => b.id === inst);
    if (item) {
      setB3StopPoints(item.defaultStop);
      setB3TargetPoints(item.defaultTarget);
      setB3MarginPerContract(item.defaultMargin);
      setB3EntryPrice(item.entryPrice);
      setB3StopPrice(item.entryPrice - item.defaultStop);
      setB3TargetPrice(item.entryPrice + item.defaultTarget);
    }
  };

  const effectiveB3Stop = useMemo(() => {
    if (b3InputMode === 'POINTS') return Math.max(0.01, b3StopPoints);
    return Math.max(0.01, Number(Math.abs(b3EntryPrice - b3StopPrice).toFixed(2)));
  }, [b3InputMode, b3StopPoints, b3EntryPrice, b3StopPrice]);

  const effectiveB3Target = useMemo(() => {
    if (b3InputMode === 'POINTS') return Math.max(0.01, b3TargetPoints);
    return Math.max(0.01, Number(Math.abs(b3TargetPrice - b3EntryPrice).toFixed(2)));
  }, [b3InputMode, b3TargetPoints, b3TargetPrice, b3EntryPrice]);

  const b3Result: B3CalculationResult = useMemo(() => {
    const riskVal = riskMode === 'PERCENT' ? (customBankroll * riskPercent) / 100 : fixedRiskAmount;
    return calculateB3Contracts({
      bankroll: customBankroll,
      riskAmount: riskVal,
      stopLossPoints: effectiveB3Stop,
      takeProfitPoints: effectiveB3Target,
      instrumentType: b3Instrument,
      brokerMarginPerContract: b3MarginPerContract,
    });
  }, [
    customBankroll,
    riskMode,
    riskPercent,
    fixedRiskAmount,
    effectiveB3Stop,
    effectiveB3Target,
    b3Instrument,
    b3MarginPerContract,
  ]);

  // ==========================================
  // 3. CRIPTO (FUTUROS & SPOT) STATE
  // ==========================================
  const cryptoPresets = [
    { asset: 'BTC/USDT', price: 64200, step: 100 },
    { asset: 'ETH/USDT', price: 3450, step: 10 },
    { asset: 'SOL/USDT', price: 152.5, step: 1 },
    { asset: 'BNB/USDT', price: 580, step: 5 },
    { asset: 'XRP/USDT', price: 0.62, step: 0.01 },
    { asset: 'DOGE/USDT', price: 0.125, step: 0.005 },
    { asset: 'ADA/USDT', price: 0.38, step: 0.01 },
    { asset: 'AVAX/USDT', price: 26.5, step: 0.5 },
  ];

  const [cryptoAsset, setCryptoAsset] = useState<string>('BTC/USDT');
  const [cryptoDirection, setCryptoDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [cryptoLeverage, setCryptoLeverage] = useState<number>(20);
  const [cryptoEntryPrice, setCryptoEntryPrice] = useState<number>(64200);
  const [cryptoStopPrice, setCryptoStopPrice] = useState<number>(63200);
  const [cryptoTargetPrice, setCryptoTargetPrice] = useState<number>(66200);

  const handleCryptoAssetChange = (asset: string) => {
    setCryptoAsset(asset);
    const item = cryptoPresets.find((c) => c.asset === asset);
    if (item) {
      setCryptoEntryPrice(item.price);
      if (cryptoDirection === 'LONG') {
        setCryptoStopPrice(Number((item.price * 0.98).toFixed(item.price < 1 ? 4 : 2)));
        setCryptoTargetPrice(Number((item.price * 1.04).toFixed(item.price < 1 ? 4 : 2)));
      } else {
        setCryptoStopPrice(Number((item.price * 1.02).toFixed(item.price < 1 ? 4 : 2)));
        setCryptoTargetPrice(Number((item.price * 0.96).toFixed(item.price < 1 ? 4 : 2)));
      }
    }
  };

  const handleCryptoDirectionChange = (dir: 'LONG' | 'SHORT') => {
    setCryptoDirection(dir);
    if (dir === 'LONG') {
      setCryptoStopPrice(Number((cryptoEntryPrice * 0.98).toFixed(cryptoEntryPrice < 1 ? 4 : 2)));
      setCryptoTargetPrice(Number((cryptoEntryPrice * 1.04).toFixed(cryptoEntryPrice < 1 ? 4 : 2)));
    } else {
      setCryptoStopPrice(Number((cryptoEntryPrice * 1.02).toFixed(cryptoEntryPrice < 1 ? 4 : 2)));
      setCryptoTargetPrice(Number((cryptoEntryPrice * 0.96).toFixed(cryptoEntryPrice < 1 ? 4 : 2)));
    }
  };

  const cryptoResult: CryptoCalculationResult = useMemo(() => {
    const riskVal = riskMode === 'PERCENT' ? (customBankroll * riskPercent) / 100 : fixedRiskAmount;
    return calculateCryptoPosition({
      bankroll: customBankroll,
      riskAmount: riskVal,
      entryPrice: cryptoEntryPrice,
      stopLossPrice: cryptoStopPrice,
      takeProfitPrice: cryptoTargetPrice,
      leverage: cryptoLeverage,
      direction: cryptoDirection,
    });
  }, [
    customBankroll,
    riskMode,
    riskPercent,
    fixedRiskAmount,
    cryptoEntryPrice,
    cryptoStopPrice,
    cryptoTargetPrice,
    cryptoLeverage,
    cryptoDirection,
  ]);

  // ==========================================
  // REGISTER OPERATION IN DIARY
  // ==========================================
  const handleRegisterOperation = (resultStatus: 'WIN' | 'LOSS' | 'PENDING') => {
    const dateStr = getTodayDateString();
    const timeStr = getCurrentTimeString();

    let assetName = '';
    let investment = 0;
    let profit = 0;
    let notes = '';

    if (activeMarket === 'FOREX') {
      assetName = forexAsset;
      investment = forexResult.riskAmount;
      profit = resultStatus === 'WIN' ? forexResult.rewardAmount : -forexResult.riskAmount;
      notes = `[Forex] Lote: ${forexResult.lotSize} | Stop: ${forexResult.stopLossPips} pips | Alvo: ${forexResult.takeProfitPips} pips | R:R 1:${forexResult.riskRewardRatio} | Margem: $${forexResult.requiredMargin}`;
    } else if (activeMarket === 'B3') {
      assetName = b3Instrument;
      investment = b3Result.riskAmount;
      profit = resultStatus === 'WIN' ? b3Result.rewardAmount : -b3Result.riskAmount;
      notes = `[B3] Contratos/Ações: ${b3Result.contracts} | Stop: ${b3Result.stopLossPoints} pts | Alvo: ${b3Result.takeProfitPoints} pts | R:R 1:${b3Result.riskRewardRatio} | Margem: R$ ${b3Result.requiredMargin}`;
    } else {
      assetName = cryptoAsset;
      investment = cryptoResult.riskAmount;
      profit = resultStatus === 'WIN' ? cryptoResult.rewardAmount : -cryptoResult.riskAmount;
      notes = `[Cripto ${cryptoDirection} ${cryptoLeverage}x] Posição: $${cryptoResult.positionSizeUsd} (${cryptoResult.coinAmount} coins) | Stop: $${cryptoStopPrice} | Alvo: $${cryptoTargetPrice} | Margem: $${cryptoResult.isolatedMargin}`;
    }

    addOperation({
      date: dateStr,
      time: timeStr,
      asset: assetName,
      marketType: 'ABERTO',
      direction: activeMarket === 'CRIPTO' && cryptoDirection === 'SHORT' ? 'PUT' : 'CALL',
      investment: investment,
      payout: Number(((profit / (investment || 1)) * 100).toFixed(0)),
      expiration: 'H1',
      strategy: `Gestão ${activeMarket}`,
      result: resultStatus === 'WIN' ? 'WIN' : 'LOSS',
      notes,
    });

    setSaveSuccessMsg(`Operação de ${activeMarket} salva com sucesso no Diário de Trading!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const riskPresets = [0.5, 1.0, 1.5, 2.0, 3.0, 5.0];

  return (
    <div className="space-y-6 pb-12" id="view-multi-market-management">
      {/* Top Banner */}
      <div className="p-5 bg-[#0F0F12] border border-[#1E2028] rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Gestão Multi-Mercado & Calculadora de Lotes
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Forex • B3 • Cripto
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dimensionamento matemático de lotes, contratos e margem com proteção rigorosa de capital.
            </p>
          </div>
        </div>

        {/* Global Bankroll Quick Sync */}
        <div className="flex items-center gap-3 bg-[#0A0A0B] border border-[#1E2028] px-3.5 py-2 rounded-lg">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase block font-medium">Banca Operacional</span>
            <span className="text-sm font-black font-mono text-emerald-400">
              {formatCurrency(customBankroll)}
            </span>
          </div>
          <input
            type="number"
            value={customBankroll}
            onChange={(e) => setCustomBankroll(Math.max(1, parseFloat(e.target.value) || 100))}
            className="w-24 bg-[#15161A] border border-[#272935] rounded px-2 py-1 text-xs text-white font-mono text-right focus:outline-none focus:border-orange-500"
            title="Ajustar saldo base para os cálculos"
          />
        </div>
      </div>

      {/* Market Selector Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#0F0F12] border border-[#1E2028] rounded-xl">
        <button
          id="btn-tab-forex"
          onClick={() => setActiveMarket('FOREX')}
          className={`py-3 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeMarket === 'FOREX'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-950/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Forex & Metais</span>
          <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-slate-200">
            Lotes
          </span>
        </button>

        <button
          id="btn-tab-b3"
          onClick={() => setActiveMarket('B3')}
          className={`py-3 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeMarket === 'B3'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-950/40 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>B3 (Bolsa Brasil)</span>
          <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-slate-200">
            WIN/WDO
          </span>
        </button>

        <button
          id="btn-tab-crypto"
          onClick={() => setActiveMarket('CRYPTO')}
          className={`py-3 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeMarket === 'CRYPTO'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Cripto Perpétuos</span>
          <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-slate-200">
            Alavancagem
          </span>
        </button>
      </div>

      {/* Global Risk Management Config Bar */}
      <div className="p-4 bg-[#0F0F12] border border-[#1E2028] rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-orange-400" />
          <div>
            <span className="text-xs font-bold text-white block">Risco Aceito por Operação</span>
            <span className="text-[11px] text-slate-400">
              Nunca arrisque mais do que 1% a 3% do capital total em um único trade.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle % vs Fixed $ */}
          <div className="flex items-center bg-[#0A0A0B] p-1 border border-[#1E2028] rounded-lg">
            <button
              onClick={() => setRiskMode('PERCENT')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                riskMode === 'PERCENT'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              % da Banca
            </button>
            <button
              onClick={() => setRiskMode('FIXED')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                riskMode === 'FIXED'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Valor Fixo ($ / R$)
            </button>
          </div>

          {riskMode === 'PERCENT' ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="20"
                value={riskPercent}
                onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 1)}
                className="w-16 bg-[#15161A] border border-[#272935] rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-orange-500"
              />
              <span className="text-xs text-slate-400 font-mono">%</span>
              <div className="flex items-center gap-1 ml-1">
                {riskPresets.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskPercent(r)}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold ${
                      riskPercent === r
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                        : 'bg-[#15161A] text-slate-400 hover:text-white border border-[#272935]'
                    }`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 ml-2">
                (= {formatCurrency((customBankroll * riskPercent) / 100)})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="1"
                min="1"
                value={fixedRiskAmount}
                onChange={(e) => setFixedRiskAmount(parseFloat(e.target.value) || 10)}
                className="w-24 bg-[#15161A] border border-[#272935] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-orange-500"
              />
              <span className="text-xs font-mono text-slate-400">
                ({((fixedRiskAmount / customBankroll) * 100).toFixed(1)}% do capital)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FOREX CALCULATOR & LOT SIZING VIEW */}
      {/* ========================================================================= */}
      {activeMarket === 'FOREX' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Inputs Column */}
            <div className="lg:col-span-6 p-5 bg-[#0F0F12] border border-[#1E2028] rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E2028]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-orange-400" />
                  Parâmetros da Operação Forex
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono">
                  1 Lote = 100.000 un
                </span>
              </div>

              {/* Asset & Leverage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Par de Moedas / Ativo:
                  </label>
                  <select
                    id="select-forex-asset"
                    value={forexAsset}
                    onChange={(e) => handleForexAssetChange(e.target.value)}
                    className="w-full bg-[#15161A] border border-[#272935] rounded-lg px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-orange-500"
                  >
                    {forexPresets.map((p) => (
                      <option key={p.asset} value={p.asset}>
                        {p.asset} ({p.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Alavancagem da Corretora:
                  </label>
                  <select
                    id="select-forex-leverage"
                    value={forexLeverage}
                    onChange={(e) => setForexLeverage(parseInt(e.target.value) || 100)}
                    className="w-full bg-[#15161A] border border-[#272935] rounded-lg px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-orange-500"
                  >
                    <option value="30">1:30 (Regulamentação Europeia)</option>
                    <option value="50">1:50</option>
                    <option value="100">1:100 (Padrão)</option>
                    <option value="200">1:200</option>
                    <option value="500">1:500 (Offshore)</option>
                    <option value="1000">1:1000 (Alta Alavancagem)</option>
                  </select>
                </div>
              </div>

              {/* Mode Toggle: Pips vs Exact Prices */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-slate-300">Modo de Entrada:</span>
                <div className="flex items-center bg-[#0A0A0B] p-0.5 border border-[#1E2028] rounded">
                  <button
                    onClick={() => setForexInputMode('PIPS')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      forexInputMode === 'PIPS' ? 'bg-orange-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    Por Pips
                  </button>
                  <button
                    onClick={() => setForexInputMode('PRICES')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      forexInputMode === 'PRICES' ? 'bg-orange-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    Preços Exatos
                  </button>
                </div>
              </div>

              {forexInputMode === 'PIPS' ? (
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3 bg-[#0A0A0B] border border-rose-500/30 rounded-lg space-y-1.5">
                    <label className="block text-[11px] font-bold text-rose-400">
                      Stop Loss (Pips):
                    </label>
                    <input
                      id="input-forex-stop-pips"
                      type="number"
                      min="1"
                      value={forexStopPips}
                      onChange={(e) => setForexStopPips(parseFloat(e.target.value) || 10)}
                      className="w-full bg-[#15161A] border border-[#272935] rounded px-2.5 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-rose-500"
                    />
                    <div className="flex gap-1 pt-1">
                      {[10, 15, 20, 30, 50].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setForexStopPips(p)}
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#15161A] text-slate-400 hover:text-white"
                        >
                          {p}p
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-[#0A0A0B] border border-emerald-500/30 rounded-lg space-y-1.5">
                    <label className="block text-[11px] font-bold text-emerald-400">
                      Take Profit / Alvo (Pips):
                    </label>
                    <input
                      id="input-forex-target-pips"
                      type="number"
                      min="1"
                      value={forexTargetPips}
                      onChange={(e) => setForexTargetPips(parseFloat(e.target.value) || 20)}
                      className="w-full bg-[#15161A] border border-[#272935] rounded px-2.5 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex gap-1 pt-1">
                      {[20, 30, 40, 60, 100].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setForexTargetPips(p)}
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#15161A] text-slate-400 hover:text-white"
                        >
                          {p}p
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-2.5 bg-[#0A0A0B] border border-[#272935] rounded-lg space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400">Preço Entrada:</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={forexEntryPrice}
                      onChange={(e) => setForexEntryPrice(parseFloat(e.target.value) || 1)}
                      className="w-full bg-[#15161A] border border-[#272935] rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="p-2.5 bg-[#0A0A0B] border border-rose-500/30 rounded-lg space-y-1">
                    <label className="block text-[10px] font-bold text-rose-400">Preço Stop:</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={forexStopPrice}
                      onChange={(e) => setForexStopPrice(parseFloat(e.target.value) || 1)}
                      className="w-full bg-[#15161A] border border-rose-500/50 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                    />
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {effectiveForexStopPips} pips
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#0A0A0B] border border-emerald-500/30 rounded-lg space-y-1">
                    <label className="block text-[10px] font-bold text-emerald-400">Preço Alvo:</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={forexTargetPrice}
                      onChange={(e) => setForexTargetPrice(parseFloat(e.target.value) || 1)}
                      className="w-full bg-[#15161A] border border-emerald-500/50 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {effectiveForexTargetPips} pips
                    </span>
                  </div>
                </div>
              )}

              {/* R:R Presets Shortcuts */}
              <div className="p-3 bg-[#0A0A0B] border border-[#1E2028] rounded-lg flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                  <Scale className="w-3.5 h-3.5 text-orange-400" />
                  Alvos Rápidos Risco x Retorno:
                </span>
                <div className="flex items-center gap-1">
                  {[1, 1.5, 2, 3, 4, 5].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setForexTargetPips(Math.round(forexStopPips * ratio))}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#15161A] border border-[#272935] text-slate-300 hover:text-white hover:border-orange-500"
                    >
                      1:{ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Output Results & Lot Size Cards */}
            <div className="lg:col-span-6 space-y-4">
              {/* PRIMARY HERO CARD: LOT SIZE */}
              <div className="p-5 bg-[#0F0F12] border-2 border-orange-500/60 rounded-xl space-y-3 shadow-lg shadow-orange-950/20 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-orange-500 text-black">
                    Tamanho do Lote Recomendado
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    {forexAsset} • {forexResult.units.toLocaleString()} unidades
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                      {forexResult.lotSize}{' '}
                      <span className="text-base font-bold text-orange-400">Lotes Standard</span>
                    </span>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-400">
                    <div>Mini Lotes: <strong className="text-white">{forexResult.miniLots}</strong></div>
                    <div>Micro Lotes: <strong className="text-white">{forexResult.microLots}</strong></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1E2028] text-xs font-mono">
                  <div className="p-2 bg-[#0A0A0B] rounded border border-[#1E2028]">
                    <span className="text-[10px] text-slate-400 block font-sans">Valor de 1 Pip</span>
                    <strong className="text-cyan-300">${forexResult.pipValueTotal}</strong>
                  </div>
                  <div className="p-2 bg-[#0A0A0B] rounded border border-[#1E2028]">
                    <span className="text-[10px] text-slate-400 block font-sans">Risco Máximo</span>
                    <strong className="text-rose-400">-${forexResult.riskAmount} ({forexResult.riskPercent}%)</strong>
                  </div>
                  <div className="p-2 bg-[#0A0A0B] rounded border border-[#1E2028]">
                    <span className="text-[10px] text-slate-400 block font-sans">Ganho no Alvo</span>
                    <strong className="text-emerald-400">+${forexResult.rewardAmount} (+{forexResult.rewardPercent}%)</strong>
                  </div>
                  <div className="p-2 bg-[#0A0A0B] rounded border border-[#1E2028]">
                    <span className="text-[10px] text-slate-400 block font-sans">Relação R:R</span>
                    <strong className="text-orange-400 font-bold">1 : {forexResult.riskRewardRatio}</strong>
                  </div>
                </div>
              </div>

              {/* Secondary Details: Margin & Account Health */}
              <div className="p-4 bg-[#0F0F12] border border-[#1E2028] rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-[#0A0A0B] rounded-lg border border-[#1E2028]">
                  <span className="text-[10px] text-slate-400 block font-sans">Margem Requerida</span>
                  <strong className="text-white text-sm">${forexResult.requiredMargin}</strong>
                  <span className="text-[10px] text-slate-500 block">
                    Alavancagem 1:{forexLeverage}
                  </span>
                </div>

                <div className="p-3 bg-[#0A0A0B] rounded-lg border border-[#1E2028]">
                  <span className="text-[10px] text-slate-400 block font-sans">Alavancagem Real</span>
                  <strong className="text-cyan-300 text-sm">{forexResult.effectiveLeverage}x</strong>
                  <span className="text-[10px] text-slate-500 block">
                    {forexResult.effectiveLeverage > 30 ? '⚠️ Exposição Alta' : '🛡️ Conservador'}
                  </span>
                </div>

                <div className="p-3 bg-[#0A0A0B] rounded-lg border border-[#1E2028]">
                  <span className="text-[10px] text-slate-400 block font-sans">Saldo Pós-Trade</span>
                  <div className="text-[11px] text-emerald-400">Win: ${customBankroll + forexResult.rewardAmount}</div>
                  <div className="text-[11px] text-rose-400">Loss: ${customBankroll - forexResult.riskAmount}</div>
                </div>
              </div>

              {/* Action Buttons to Register */}
              <div className="p-4 bg-[#0A0A0B] border border-orange-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">Salvar esta Operação</span>
                  <span className="text-[11px] text-slate-400">
                    Registre a operação no seu histórico do Trader Academic.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRegisterOperation('WIN')}
                    className="px-3.5 py-2 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Registrar WIN (+${forexResult.rewardAmount})
                  </button>
                  <button
                    onClick={() => handleRegisterOperation('LOSS')}
                    className="px-3.5 py-2 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-all flex items-center gap-1.5"
                  >
                    Registrar LOSS (-${forexResult.riskAmount})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. B3 (BOLSA BRASIL: MINI ÍNDICE & MINI DÓLAR) VIEW */}
      {/* ========================================================================= */}
      {activeMarket === 'B3' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: B3 Controls */}
            <div className="lg:col-span-6 p-5 bg-[#0F0F12] border border-[#1E2028] rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E2028]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Parâmetros de Futuros & Ações B3
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold">
                  Bolsa de Valores B3
                </span>
              </div>

              {/* Instrument Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Ativo Negociado:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {b3Instruments.map((inst) => (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => handleB3InstrumentChange(inst.id as any)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        b3Instrument === inst.id
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm'
                          : 'bg-[#15161A] border-[#272935] text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="block font-bold text-xs">{inst.id}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">
                        R$ {inst.pointValue.toFixed(2)}/pt
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stop and Target Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3 bg-[#0A0A0B] border border-rose-500/30 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-rose-400">
                      Stop Loss ({b3Instrument === 'STOCKS' ? 'R$' : 'Pontos'}):
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      Tick mín: {b3Instruments.find((b) => b.id === b3Instrument)?.tickSize}
                    </span>
                  </div>
                  <input
                    id="input-b3-stop-points"
                    type="number"
                    step={b3Instrument === 'STOCKS' ? '0.01' : '1'}
                    min="0.01"
                    value={b3StopPoints}
                    onChange={(e) => setB3StopPoints(parseFloat(e.target.value) || 1)}
                    className="w-full bg-[#15161A] border border-[#272935] rounded px-2.5 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex gap-1 pt-1 overflow-x-auto">
                    {(b3Instrument === 'WIN'
                      ? [100, 150, 200, 300, 500]
                      : b3Instrument === 'WDO'
                      ? [3.0, 5.0, 7.5, 10.0, 15.0]
                      : [0.2, 0.4, 0.6, 1.0, 1.5]
                    ).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setB3StopPoints(val)}
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#15161A] text-slate-400 hover:text-white shrink-0"
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-[#0A0A0B] border border-emerald-500/30 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-emerald-400">
                      Take Profit / Alvo ({b3Instrument === 'STOCKS' ? 'R$' : 'Pontos'}):
                    </label>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Meta
                    </span>
                  </div>
                  <input
                    id="input-b3-target-points"
                    type="number"
                    step={b3Instrument === 'STOCKS' ? '0.01' : '1'}
                    min="0.01"
                    value={b3TargetPoints}
                    onChange={(e) => setB3TargetPoints(parseFloat(e.target.value) || 1)}
                    className="w-full bg-[#15161A] border border-[#272935] rounded px-2.5 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex gap-1 pt-1 overflow-x-auto">
                    {(b3Instrument === 'WIN'
                      ? [200, 300, 450, 600, 1000]
                      : b3Instrument === 'WDO'
                      ? [6.0, 10.0, 15.0, 20.0, 30.0]
                      : [0.4, 0.8, 1.2, 2.0, 3.0]
                    ).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setB3TargetPoints(val)}
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#15161A] text-slate-400 hover:text-white shrink-0"
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Margin per Contract */}
              <div className="p-3 bg-[#0A0A0B] border border-[#1E2028] rounded-lg flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-300 block">
                    Margem Day Trade por Contrato:
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Garantia exigida pela sua corretora (Clear, XP, Toro, Genial, BTG, etc.)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-slate-400">R$</span>
                  <input
                    type="number"
                    value={b3MarginPerContract}
                    onChange={(e) => setB3MarginPerContract(parseFloat(e.target.value) || 100)}
                    className="w-20 bg-[#15161A] border border-[#272935] rounded px-2 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: B3 Results & Contracts */}
            <div className="lg:col-span-6 space-y-4">
              {/* HERO CARD B3: CONTRATOS RECOMENDADOS */}
              <div className="p-5 bg-[#0F0F12] border-2 border-cyan-500/60 rounded-xl space-y-3 shadow-lg shadow-cyan-950/20 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-cyan-500 text-black">
                    Contratos / Posição Recomendada
                  </span>
                  <span className="text-xs font-mono text-cyan-300">
                    {b3Instrument} • Stop de {effectiveB3Stop} {b3Instrument === 'STOCKS' ? 'R$' : 'pts'}
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                      {b3Result.contracts}{' '}
                      <span className="text-base font-bold text-cyan-300">
                        {b3Instrument === 'STOCKS' ? 'Ações' : 'Mini Contratos'}
                      </span>
                    </span>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-400">
                    <div>Valor do Ponto Total: <strong className="text-cyan-300">R$ {b3Result.pointValueTotal.toFixed(2)}/pt</strong></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1E2028] text-xs font-mono">
                  <div className="p-2 bg-[#0A0A0B] rounded border border-[#1E2028]">
                    <span className="text-[10px] text-slate-400 block font-sans">Perda no Stop</span>
                    <strong className="text-rose-400">-R$ {b3Result.riskAmount.toFixed(2)}</strong>
                  </div>
                  <div className="p-2 bg-[#0A0A0B] rounded border border-[#1E2028]">
                    <span className="text-[10px] text-slate-400 block font-sans">Ganho no Alvo</span>
                    <strong className="text-emerald-400">+R$ {b3Result.rewardAmount.toFixed(2)}</strong>
                  </div>
                  <div className="p-2 bg-[#0A0A0B] rounded border border-[#1E2028]">
                    <span className="text-[10px] text-slate-400 block font-sans">Margem Total Exigida</span>
                    <strong className="text-white">R$ {b3Result.requiredMargin.toFixed(2)}</strong>
                  </div>
                  <div className="p-2 bg-[#0A0A0B] rounded border border-[#1E2028]">
                    <span className="text-[10px] text-slate-400 block font-sans">Relação R:R</span>
                    <strong className="text-cyan-300 font-bold">1 : {b3Result.riskRewardRatio}</strong>
                  </div>
                </div>
              </div>

              {/* B3 Action Buttons */}
              <div className="p-4 bg-[#0A0A0B] border border-cyan-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">Salvar Operação B3</span>
                  <span className="text-[11px] text-slate-400">
                    Grave o resultado dessa operação diretamente no Diário.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRegisterOperation('WIN')}
                    className="px-3.5 py-2 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Registrar WIN (+R$ {b3Result.rewardAmount})
                  </button>
                  <button
                    onClick={() => handleRegisterOperation('LOSS')}
                    className="px-3.5 py-2 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-all flex items-center gap-1.5"
                  >
                    Registrar LOSS (-R$ {b3Result.riskAmount})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CRIPTO (FUTUROS PERPÉTUOS & ALAVANCAGEM) VIEW */}
      {/* ========================================================================= */}
      {activeMarket === 'CRYPTO' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Inputs: Crypto */}
            <div className="lg:col-span-6 p-5 bg-[#0F0F12] border border-[#1E2028] rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E2028]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-purple-400" />
                  Parâmetros de Futuros Perpétuos Cripto
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">
                  Binance • Bybit • OKX
                </span>
              </div>

              {/* Asset & Direction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Par de Cripto:
                  </label>
                  <select
                    id="select-crypto-asset"
                    value={cryptoAsset}
                    onChange={(e) => handleCryptoAssetChange(e.target.value)}
                    className="w-full bg-[#15161A] border border-[#272935] rounded-lg px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-purple-500"
                  >
                    {cryptoPresets.map((c) => (
                      <option key={c.asset} value={c.asset}>
                        {c.asset} (${c.price.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Direção da Posição:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCryptoDirectionChange('LONG')}
                      className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1 transition-all ${
                        cryptoDirection === 'LONG'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                          : 'bg-[#15161A] border border-[#272935] text-slate-400 hover:text-white'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      LONG (Compra)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCryptoDirectionChange('SHORT')}
                      className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1 transition-all ${
                        cryptoDirection === 'SHORT'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                          : 'bg-[#15161A] border border-[#272935] text-slate-400 hover:text-white'
                      }`}
                    >
                      <TrendingDown className="w-3.5 h-3.5" />
                      SHORT (Venda)
                    </button>
                  </div>
                </div>
              </div>

              {/* Leverage Selector & Slider */}
              <div className="p-3 bg-[#0A0A0B] border border-[#1E2028] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    Alavancagem Isolada:
                  </label>
                  <span className="text-xs font-mono font-black text-purple-400">
                    {cryptoLeverage}x
                  </span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {[1, 2, 5, 10, 20, 25, 50, 75, 100, 125].map((lev) => (
                    <button
                      key={lev}
                      type="button"
                      onClick={() => setCryptoLeverage(lev)}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold shrink-0 transition-colors ${
                        cryptoLeverage === lev
                          ? 'bg-purple-600 text-white font-black'
                          : 'bg-[#15161A] border border-[#272935] text-slate-400 hover:text-white'
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Prices: Entry, Stop, Target */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-2.5 bg-[#0A0A0B] border border-[#272935] rounded-lg space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400">Preço Entrada ($):</label>
                  <input
                    type="number"
                    step="any"
                    value={cryptoEntryPrice}
                    onChange={(e) => setCryptoEntryPrice(parseFloat(e.target.value) || 1)}
                    className="w-full bg-[#15161A] border border-[#272935] rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="p-2.5 bg-[#0A0A0B] border border-rose-500/30 rounded-lg space-y-1">
                  <label className="block text-[10px] font-bold text-rose-400">Stop Loss ($):</label>
                  <input
                    type="number"
                    step="any"
                    value={cryptoStopPrice}
                    onChange={(e) => setCryptoStopPrice(parseFloat(e.target.value) || 1)}
                    className="w-full bg-[#15161A] border border-rose-500/50 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-[10px] text-rose-400 font-mono block">
                    -{cryptoResult.priceStopPercent}%
                  </span>
                </div>

                <div className="p-2.5 bg-[#0A0A0B] border border-emerald-500/30 rounded-lg space-y-1">
                  <label className="block text-[10px] font-bold text-emerald-400">Take Profit ($):</label>
                  <input
                    type="number"
                    step="any"
                    value={cryptoTargetPrice}
                    onChange={(e) => setCryptoTargetPrice(parseFloat(e.target.value) || 1)}
                    className="w-full bg-[#15161A] border border-emerald-500/50 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-emerald-400 font-mono block">
                    +{cryptoResult.priceTargetPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Crypto Results */}
            <div className="lg:col-span-6 space-y-4">
              {/* HERO CARD CRIPTO: TAMANHO DE POSIÇÃO */}
              <div className="p-5 bg-[#0F0F12] border-2 border-purple-500/60 rounded-xl space-y-3 shadow-lg shadow-purple-950/20 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-purple-600 text-white">
                    Posição Notional (USDT)
                  </span>
                  <span className="text-xs font-mono text-purple-300">
                    {cryptoAsset} • {cryptoDirection} {cryptoLeverage}x
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                      ${cryptoResult.positionSizeUsd.toLocaleString()}{' '}
                      <span className="text-base font-bold text-purple-400">USDT</span>
                    </span>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-300">
                    <div>Quantidade: <strong className="text-purple-300">{cryptoResult.coinAmount} {cryptoAsset.split('/')[0]}</strong></div>
                    <div>Margem Isolada: <strong className="text-white">${cryptoResult.isolatedMargin} USDT</strong></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1E2028] text-xs font-mono">
                  <div className="p-2 bg-[#0A0A0B] rounded border border-[#1E2028]">
                    <span className="text-[10px] text-slate-400 block font-sans">Perda no Stop</span>
                    <strong className="text-rose-400">-${cryptoResult.riskAmount}</strong>
                  </div>
                  <div className="p-2 bg-[#0A0A0B] rounded border border-[#1E2028]">
                    <span className="text-[10px] text-slate-400 block font-sans">Lucro no Alvo</span>
                    <strong className="text-emerald-400">+${cryptoResult.rewardAmount}</strong>
                  </div>
                  <div className="p-2 bg-[#0A0A0B] rounded border border-[#1E2028]">
                    <span className="text-[10px] text-slate-400 block font-sans">ROI s/ Margem</span>
                    <strong className="text-emerald-400 font-bold">+{cryptoResult.roiOnMarginPercent}%</strong>
                  </div>
                  <div className="p-2 bg-[#0A0A0B] rounded border border-[#1E2028]">
                    <span className="text-[10px] text-slate-400 block font-sans">Relação R:R</span>
                    <strong className="text-purple-400 font-bold">1 : {cryptoResult.riskRewardRatio}</strong>
                  </div>
                </div>
              </div>

              {/* Liquidation Warning Card */}
              <div className={`p-4 rounded-xl border font-mono text-xs flex items-center justify-between gap-3 ${
                cryptoResult.isLiquidationBeforeStop
                  ? 'bg-rose-950/30 border-rose-500/60 text-rose-300'
                  : 'bg-[#0F0F12] border-[#1E2028] text-slate-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  {cryptoResult.isLiquidationBeforeStop ? (
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      Preço Estimado de Liquidação: ${cryptoResult.estimatedLiquidationPrice.toLocaleString()}
                      {cryptoResult.isLiquidationBeforeStop && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-rose-600 text-white rounded font-bold">
                          PERIGO!
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-sans">
                      {cryptoResult.isLiquidationBeforeStop
                        ? 'Seu Stop Loss está além da liquidação! Reduza a alavancagem para evitar liquidação antes do stop.'
                        : 'Stop Loss seguro, bem antes do preço de liquidação da corretora.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Crypto Actions */}
              <div className="p-4 bg-[#0A0A0B] border border-purple-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">Salvar Operação Cripto</span>
                  <span className="text-[11px] text-slate-400">
                    Armazene no seu diário com todos os dados da posição.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRegisterOperation('WIN')}
                    className="px-3.5 py-2 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Registrar WIN (+${cryptoResult.rewardAmount})
                  </button>
                  <button
                    onClick={() => handleRegisterOperation('LOSS')}
                    className="px-3.5 py-2 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-all flex items-center gap-1.5"
                  >
                    Registrar LOSS (-${cryptoResult.riskAmount})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {saveSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-950/90 border border-emerald-500 text-emerald-200 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{saveSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MATHEMATICAL EXPECTANCY & RISK-TO-REWARD PROJECTION MATRIX */}
      {/* ========================================================================= */}
      <div className="p-5 bg-[#0F0F12] border border-[#1E2028] rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1E2028]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Matriz de Consistência Matemática (A Regra de Ouro dos Traders Lucrativos)
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            Simulação de 20 trades com risco fixo de <strong>{riskPercent}%</strong>
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          No Forex, B3 e Cripto, você <strong>não precisa</strong> acertar 80% das operações para ser altamente lucrativo.
          Trabalhando com uma relação Risco x Retorno mínima de <strong>1:2</strong> ou <strong>1:3</strong>, mesmo com 40% a 50% de assertividade, sua conta cresce exponencialmente:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead>
              <tr className="bg-[#0A0A0B] text-slate-400 border-b border-[#1E2028]">
                <th className="p-3 font-semibold font-sans">Assertividade</th>
                <th className="p-3 font-semibold font-sans">Cenário (20 Trades)</th>
                <th className="p-3 font-semibold font-sans">R:R 1:1</th>
                <th className="p-3 font-semibold font-sans">R:R 1:1.5</th>
                <th className="p-3 font-semibold font-sans text-orange-400">R:R 1:2 (Recomendado)</th>
                <th className="p-3 font-semibold font-sans text-emerald-400">R:R 1:3 (Profissional)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2028]">
              <tr className="hover:bg-[#15161A]">
                <td className="p-3 font-bold text-rose-400">30% Winrate</td>
                <td className="p-3 text-slate-400">6 Wins / 14 Losses</td>
                <td className="p-3 text-rose-400">-8.0R (-8%)</td>
                <td className="p-3 text-rose-400">-5.0R (-5%)</td>
                <td className="p-3 text-rose-400">-2.0R (-2%)</td>
                <td className="p-3 text-emerald-400 font-bold">+4.0R (+4%)</td>
              </tr>
              <tr className="hover:bg-[#15161A]">
                <td className="p-3 font-bold text-amber-400">40% Winrate</td>
                <td className="p-3 text-slate-400">8 Wins / 12 Losses</td>
                <td className="p-3 text-rose-400">-4.0R (-4%)</td>
                <td className="p-3 text-slate-400">0.0R (Empate)</td>
                <td className="p-3 text-emerald-400 font-bold">+4.0R (+4%)</td>
                <td className="p-3 text-emerald-400 font-black">+12.0R (+12%)</td>
              </tr>
              <tr className="hover:bg-[#15161A] bg-orange-500/5">
                <td className="p-3 font-bold text-emerald-400">50% Winrate</td>
                <td className="p-3 text-slate-300 font-bold">10 Wins / 10 Losses</td>
                <td className="p-3 text-slate-400">0.0R (Empate)</td>
                <td className="p-3 text-emerald-400">+5.0R (+5%)</td>
                <td className="p-3 text-emerald-400 font-black">+10.0R (+10%)</td>
                <td className="p-3 text-emerald-400 font-black">+20.0R (+20%)</td>
              </tr>
              <tr className="hover:bg-[#15161A]">
                <td className="p-3 font-bold text-emerald-300">60% Winrate</td>
                <td className="p-3 text-slate-400">12 Wins / 8 Losses</td>
                <td className="p-3 text-emerald-400">+4.0R (+4%)</td>
                <td className="p-3 text-emerald-400">+10.0R (+10%)</td>
                <td className="p-3 text-emerald-400 font-black">+16.0R (+16%)</td>
                <td className="p-3 text-emerald-400 font-black">+28.0R (+28%)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
