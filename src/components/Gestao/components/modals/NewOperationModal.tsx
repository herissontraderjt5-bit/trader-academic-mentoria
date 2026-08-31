import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Percent,
  Layers,
  FileText,
  Calendar as CalendarIcon,
  PlusCircle,
  CheckCircle,
  Zap,
  BarChart3,
  Coins,
  Globe,
  Activity,
  Calculator,
} from 'lucide-react';
import {
  Operation,
  MarketType,
  Direction,
  OperationResult,
  ExpirationTime,
  TradingModality,
} from '../../types';
import { useTrading } from '../../context/TradingContext';
import { getTodayDateString, getCurrentTimeString } from '../../utils/formatters';
import { getOperationModality } from '../../utils/modalityCalculations';

interface NewOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOperation?: Operation | null;
  initialData?: Operation | null;
  defaultDate?: string;
}

export const NewOperationModal: React.FC<NewOperationModalProps> = ({
  isOpen,
  onClose,
  initialOperation,
  initialData,
  defaultDate,
}) => {
  const currentInitial = initialOperation || initialData;
  const {
    monthConfig,
    selectedModality,
    addOperation,
    updateOperation,
    addCustomAsset,
    addCustomStrategy,
    formatCurrency,
    currencySymbol,
  } = useTrading();

  // Modality state
  const [modality, setModality] = useState<'BINARIAS' | 'FOREX' | 'B3' | 'CRIPTO'>('BINARIAS');

  // Common fields
  const [date, setDate] = useState<string>(defaultDate || getTodayDateString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [asset, setAsset] = useState<string>('EUR/USD');
  const [customAssetInput, setCustomAssetInput] = useState<string>('');
  const [showCustomAsset, setShowCustomAsset] = useState<boolean>(false);
  const [direction, setDirection] = useState<Direction>('CALL');
  const [result, setResult] = useState<OperationResult>('WIN');
  const [notes, setNotes] = useState<string>('');
  const [strategy, setStrategy] = useState<string>('Pullback');
  const [customStrategyInput, setCustomStrategyInput] = useState<string>('');
  const [showCustomStrategy, setShowCustomStrategy] = useState<boolean>(false);

  // Binary fields
  const [marketType, setMarketType] = useState<MarketType>('ABERTO');
  const [investment, setInvestment] = useState<number>(monthConfig.defaultEntryAmount || 5.68);
  const [payout, setPayout] = useState<number>(monthConfig.defaultPayout || 87);
  const [expiration, setExpiration] = useState<ExpirationTime>('M1');

  // Forex fields
  const [lotSize, setLotSize] = useState<number>(0.1);
  const [forexPips, setForexPips] = useState<number>(35);
  const [forexRR, setForexRR] = useState<number>(2.0);
  const [forexCustomProfit, setForexCustomProfit] = useState<number>(35);

  // B3 fields
  const [b3Contracts, setB3Contracts] = useState<number>(1);
  const [b3Points, setB3Points] = useState<number>(250);
  const [b3Type, setB3Type] = useState<'WIN' | 'WDO' | 'STOCKS'>('WIN');
  const [b3CustomProfit, setB3CustomProfit] = useState<number>(50);

  // Cripto fields
  const [cryptoPosition, setCryptoPosition] = useState<'LONG' | 'SHORT'>('LONG');
  const [cryptoLeverage, setCryptoLeverage] = useState<number>(10);
  const [cryptoMargin, setCryptoMargin] = useState<number>(25);
  const [cryptoRoi, setCryptoRoi] = useState<number>(25);
  const [cryptoCustomProfit, setCryptoCustomProfit] = useState<number>(6.25);

  useEffect(() => {
    if (currentInitial) {
      const initialMod = getOperationModality(currentInitial);
      setModality(initialMod);
      setDate(currentInitial.date);
      setTime(currentInitial.time);
      setAsset(currentInitial.asset);
      setMarketType(currentInitial.marketType || 'ABERTO');
      setDirection(currentInitial.direction || 'CALL');
      setInvestment(currentInitial.investment || monthConfig.defaultEntryAmount || 5.68);
      setPayout(currentInitial.payout || monthConfig.defaultPayout || 87);
      setExpiration(currentInitial.expiration || 'M1');
      setStrategy(currentInitial.strategy || 'Pullback');
      setResult(currentInitial.result || 'WIN');
      setNotes(currentInitial.notes || '');

      // Forex
      if (currentInitial.lotSize) setLotSize(currentInitial.lotSize);
      if (currentInitial.pips) setForexPips(currentInitial.pips);
      if (currentInitial.riskRewardRatio) setForexRR(currentInitial.riskRewardRatio);
      if (currentInitial.profit) setForexCustomProfit(Math.abs(currentInitial.profit));

      // B3
      if (currentInitial.contracts) setB3Contracts(currentInitial.contracts);
      if (currentInitial.points) setB3Points(currentInitial.points);
      if (currentInitial.profit) setB3CustomProfit(Math.abs(currentInitial.profit));

      // Crypto
      if (currentInitial.leverage) setCryptoLeverage(currentInitial.leverage);
      if (currentInitial.cryptoPosition) setCryptoPosition(currentInitial.cryptoPosition);
      if (currentInitial.marginUsed) setCryptoMargin(currentInitial.marginUsed);
      if (currentInitial.roiPercent) setCryptoRoi(currentInitial.roiPercent);
      if (currentInitial.profit) setCryptoCustomProfit(Math.abs(currentInitial.profit));
    } else {
      // Default to selectedModality in context if specific, else 'BINARIAS'
      if (selectedModality !== 'ALL') {
        setModality(selectedModality as 'BINARIAS' | 'FOREX' | 'B3' | 'CRIPTO');
      } else {
        setModality('BINARIAS');
      }
      setDate(defaultDate || getTodayDateString());
      setTime(getCurrentTimeString());
      setInvestment(monthConfig.defaultEntryAmount || 5.68);
      setPayout(monthConfig.defaultPayout || 87);
      setNotes('');
      setResult('WIN');
      setForexPips(35);
      setLotSize(0.1);
      setB3Points(250);
      setB3Contracts(1);
      setCryptoLeverage(10);
      setCryptoMargin(25);
      setCryptoRoi(25);
    }
  }, [currentInitial, defaultDate, monthConfig, isOpen, selectedModality]);

  if (!isOpen) return null;

  // Preset assets by modality
  const binaryAssets = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/JPY', 'USD/CHF', 'GBP/JPY', 'USD/CAD'];
  const forexAssets = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD (Ouro)', 'GBP/JPY', 'AUD/USD', 'US30 (Dow Jones)', 'NAS100 (Nasdaq)'];
  const b3Assets = ['WIN$ (Mini Índice)', 'WDO$ (Mini Dólar)', 'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'BBAS3', 'WSP$ (Mini S&P)'];
  const cryptoAssets = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'DOGE/USDT', 'AVAX/USDT', 'ADA/USDT'];

  const getAssetsForModality = () => {
    switch (modality) {
      case 'FOREX': return forexAssets;
      case 'B3': return b3Assets;
      case 'CRIPTO': return cryptoAssets;
      default: return binaryAssets;
    }
  };

  // Calculate live financial profit/loss preview
  let calculatedProfit = 0;
  if (modality === 'BINARIAS') {
    const estimatedWinProfit = Number((investment * (payout / 100)).toFixed(2));
    calculatedProfit = result === 'WIN' ? estimatedWinProfit : result === 'LOSS' ? -Number(investment.toFixed(2)) : 0;
  } else if (modality === 'FOREX') {
    // 1 pip on 0.10 standard lot ~ $1.00; on 1.00 lot ~ $10.00
    const estimatedPipsProfit = Number((forexPips * lotSize * 10).toFixed(2));
    calculatedProfit = result === 'WIN' ? (forexCustomProfit || estimatedPipsProfit) : result === 'LOSS' ? -(forexCustomProfit || estimatedPipsProfit) : 0;
  } else if (modality === 'B3') {
    let autoB3 = 0;
    if (asset.includes('WIN') || b3Type === 'WIN') {
      autoB3 = Number((b3Points * 0.2 * b3Contracts).toFixed(2));
    } else if (asset.includes('WDO') || b3Type === 'WDO') {
      autoB3 = Number((b3Points * 10.0 * b3Contracts).toFixed(2));
    } else {
      autoB3 = b3CustomProfit;
    }
    calculatedProfit = result === 'WIN' ? autoB3 : result === 'LOSS' ? -autoB3 : 0;
  } else if (modality === 'CRIPTO') {
    const autoCrypto = Number(((cryptoMargin * (cryptoRoi / 100))).toFixed(2));
    calculatedProfit = result === 'WIN' ? (cryptoCustomProfit || autoCrypto) : result === 'LOSS' ? -(cryptoCustomProfit || autoCrypto) : 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalAsset = asset;
    if (showCustomAsset && customAssetInput.trim()) {
      finalAsset = customAssetInput.trim().toUpperCase();
      addCustomAsset(finalAsset);
    }

    let finalStrategy = strategy;
    if (showCustomStrategy && customStrategyInput.trim()) {
      finalStrategy = customStrategyInput.trim();
      addCustomStrategy(finalStrategy);
    }

    const baseOpData: any = {
      date,
      time,
      asset: finalAsset,
      marketType,
      direction,
      investment: Number(investment) || 1,
      payout: Number(payout) || 85,
      expiration,
      strategy: finalStrategy,
      result,
      profit: calculatedProfit,
      notes,
      modality,
    };

    if (modality === 'FOREX') {
      baseOpData.pips = result === 'WIN' ? forexPips : -forexPips;
      baseOpData.lotSize = lotSize;
      baseOpData.riskRewardRatio = forexRR;
      baseOpData.direction = direction === 'CALL' ? 'CALL' : 'PUT';
    } else if (modality === 'B3') {
      baseOpData.points = result === 'WIN' ? b3Points : -b3Points;
      baseOpData.contracts = b3Contracts;
      baseOpData.b3Type = asset.includes('WDO') ? 'WDO' : asset.includes('WIN') ? 'WIN' : 'STOCKS';
    } else if (modality === 'CRIPTO') {
      baseOpData.leverage = cryptoLeverage;
      baseOpData.cryptoPosition = cryptoPosition;
      baseOpData.marginUsed = cryptoMargin;
      baseOpData.roiPercent = result === 'WIN' ? cryptoRoi : -cryptoRoi;
      baseOpData.direction = cryptoPosition === 'LONG' ? 'CALL' : 'PUT';
    }

    if (currentInitial) {
      updateOperation(currentInitial.id, baseOpData);
    } else {
      addOperation(baseOpData);
    }

    onClose();
  };

  const currentAssetList = getAssetsForModality();

  return (
    <div
      id="modal-new-operation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-[#121722] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#182030] border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {currentInitial ? 'Editar Operação' : 'Registrar Operação'}
              </h2>
              <p className="text-xs text-slate-400">
                Selecione o mercado e preencha os dados analíticos
              </p>
            </div>
          </div>
          <button
            id="btn-close-new-op"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modality Selector Tabs */}
        <div className="px-6 pt-4 pb-1 bg-[#0e131d] border-b border-slate-800">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Mercado / Modalidade:
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setModality('BINARIAS');
                setAsset('EUR/USD');
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                modality === 'BINARIAS'
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500 shadow-md shadow-orange-950/40'
                  : 'bg-[#0b0e14] text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Binárias</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModality('FOREX');
                setAsset('EUR/USD');
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                modality === 'FOREX'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-md shadow-emerald-950/40'
                  : 'bg-[#0b0e14] text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Forex</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModality('B3');
                setAsset('WIN$ (Mini Índice)');
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                modality === 'B3'
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500 shadow-md shadow-blue-950/40'
                  : 'bg-[#0b0e14] text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>B3</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModality('CRIPTO');
                setAsset('BTC/USDT');
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                modality === 'CRIPTO'
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500 shadow-md shadow-purple-950/40'
                  : 'bg-[#0b0e14] text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Cripto</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Row 1: Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-orange-400" />
                Data da Operação
              </label>
              <input
                id="input-op-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                Horário
              </label>
              <input
                id="input-op-time"
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 2: Asset / Pair */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Ativo ({modality})
              </label>
              <button
                type="button"
                onClick={() => setShowCustomAsset(!showCustomAsset)}
                className="text-xs text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
              >
                <PlusCircle className="w-3 h-3" />
                {showCustomAsset ? 'Selecionar da Lista' : 'Outro Ativo'}
              </button>
            </div>
            {showCustomAsset ? (
              <input
                id="input-custom-asset"
                type="text"
                placeholder="Digite o código do ativo"
                value={customAssetInput}
                onChange={(e) => setCustomAssetInput(e.target.value)}
                className="w-full bg-[#0b0e14] border border-orange-500/60 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            ) : (
              <select
                id="select-op-asset"
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                {currentAssetList.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* DYNAMIC FORM FIELDS BY MODALITY */}

          {/* 1. BINARIAS SPECIFIC FIELDS */}
          {modality === 'BINARIAS' && (
            <div className="space-y-4 p-4 bg-[#0b0e14] border border-orange-500/20 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo de Mercado</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMarketType('ABERTO')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        marketType === 'ABERTO'
                          ? 'bg-blue-600/20 text-cyan-300 border-cyan-500'
                          : 'bg-[#121722] text-slate-400 border-slate-700'
                      }`}
                    >
                      Aberto
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarketType('OTC')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        marketType === 'OTC'
                          ? 'bg-amber-600/20 text-amber-300 border-amber-500'
                          : 'bg-[#121722] text-slate-400 border-slate-700'
                      }`}
                    >
                      OTC
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tempo de Expiração</label>
                  <select
                    value={expiration}
                    onChange={(e) => setExpiration(e.target.value as ExpirationTime)}
                    className="w-full bg-[#121722] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="M1">M1 (1 Minuto)</option>
                    <option value="M5">M5 (5 Minutos)</option>
                    <option value="M15">M15 (15 Minutos)</option>
                    <option value="M30">M30 (30 Minutos)</option>
                    <option value="H1">H1 (1 Hora)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Valor da Entrada ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={investment}
                    onChange={(e) => setInvestment(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#121722] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Payout Corretora (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max="100"
                    required
                    value={payout}
                    onChange={(e) => setPayout(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#121722] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. FOREX SPECIFIC FIELDS */}
          {modality === 'FOREX' && (
            <div className="space-y-4 p-4 bg-[#0b0e14] border border-emerald-500/20 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tamanho do Lote (Volume)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={lotSize}
                    onChange={(e) => setLotSize(parseFloat(e.target.value) || 0.01)}
                    className="w-full bg-[#121722] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="Ex: 0.10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Pips (Meta / Stop)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={forexPips}
                    onChange={(e) => setForexPips(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#121722] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="Ex: 35"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Risco x Retorno (R:R)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={forexRR}
                    onChange={(e) => setForexRR(parseFloat(e.target.value) || 1)}
                    className="w-full bg-[#121722] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="Ex: 2.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. B3 SPECIFIC FIELDS */}
          {modality === 'B3' && (
            <div className="space-y-4 p-4 bg-[#0b0e14] border border-blue-500/20 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Quantidade de Contratos
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={b3Contracts}
                    onChange={(e) => setB3Contracts(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#121722] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Pontos do Trade ({asset.includes('WDO') ? 'R$ 10,00/pt' : 'R$ 0,20/pt'})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={b3Points}
                    onChange={(e) => setB3Points(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#121722] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. CRIPTO SPECIFIC FIELDS */}
          {modality === 'CRIPTO' && (
            <div className="space-y-4 p-4 bg-[#0b0e14] border border-purple-500/20 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Posição (Trade)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCryptoPosition('LONG')}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        cryptoPosition === 'LONG'
                          ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500'
                          : 'bg-[#121722] text-slate-400 border-slate-700'
                      }`}
                    >
                      LONG
                    </button>
                    <button
                      type="button"
                      onClick={() => setCryptoPosition('SHORT')}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        cryptoPosition === 'SHORT'
                          ? 'bg-rose-600/20 text-rose-400 border-rose-500'
                          : 'bg-[#121722] text-slate-400 border-slate-700'
                      }`}
                    >
                      SHORT
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Margem ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={cryptoMargin}
                    onChange={(e) => setCryptoMargin(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#121722] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Alavancagem (x)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={cryptoLeverage}
                    onChange={(e) => setCryptoLeverage(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#121722] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Direction & Result */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Direção / Sentido</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-dir-call"
                  onClick={() => setDirection('CALL')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    direction === 'CALL'
                      ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500 shadow-md'
                      : 'bg-[#0b0e14] text-slate-400 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  {modality === 'FOREX' || modality === 'B3' ? 'COMPRA (Buy)' : 'CALL (Acima)'}
                </button>
                <button
                  type="button"
                  id="btn-dir-put"
                  onClick={() => setDirection('PUT')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    direction === 'PUT'
                      ? 'bg-rose-600/20 text-rose-400 border-rose-500 shadow-md'
                      : 'bg-[#0b0e14] text-slate-400 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  {modality === 'FOREX' || modality === 'B3' ? 'VENDA (Sell)' : 'PUT (Abaixo)'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Resultado do Trade</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  id="btn-res-win"
                  onClick={() => setResult('WIN')}
                  className={`py-2 rounded-lg text-xs font-extrabold border transition-all ${
                    result === 'WIN'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-950'
                      : 'bg-[#0b0e14] text-emerald-400 border-slate-700 hover:border-emerald-800'
                  }`}
                >
                  WIN
                </button>
                <button
                  type="button"
                  id="btn-res-loss"
                  onClick={() => setResult('LOSS')}
                  className={`py-2 rounded-lg text-xs font-extrabold border transition-all ${
                    result === 'LOSS'
                      ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-950'
                      : 'bg-[#0b0e14] text-rose-400 border-slate-700 hover:border-rose-800'
                  }`}
                >
                  LOSS
                </button>
                <button
                  type="button"
                  id="btn-res-empate"
                  onClick={() => setResult('EMPATE')}
                  className={`py-2 rounded-lg text-xs font-extrabold border transition-all ${
                    result === 'EMPATE'
                      ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-950'
                      : 'bg-[#0b0e14] text-amber-400 border-slate-700 hover:border-amber-800'
                  }`}
                >
                  0x0
                </button>
              </div>
            </div>
          </div>

          {/* Strategy & Financial Impact Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Estratégia / Setup</label>
                <button
                  type="button"
                  onClick={() => setShowCustomStrategy(!showCustomStrategy)}
                  className="text-xs text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" />
                  {showCustomStrategy ? 'Lista' : 'Nova'}
                </button>
              </div>
              {showCustomStrategy ? (
                <input
                  id="input-custom-strat"
                  type="text"
                  placeholder="Ex: Supply & Demand, Pivot Point"
                  value={customStrategyInput}
                  onChange={(e) => setCustomStrategyInput(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-orange-500/60 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              ) : (
                <select
                  id="select-op-strategy"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Pullback">Pullback</option>
                  <option value="Fibonacci 61.8%">Fibonacci 61.8%</option>
                  <option value="Suporte e Resistência">Suporte e Resistência</option>
                  <option value="Rompimento">Rompimento</option>
                  <option value="Price Action">Price Action</option>
                  <option value="Smart Money Concept (SMC)">Smart Money Concept (SMC)</option>
                  <option value="Cruzamento Médias">Cruzamento Médias</option>
                </select>
              )}
            </div>

            {/* Financial Result Preview Banner */}
            <div className="p-3 bg-[#0b0e14] border border-slate-700 rounded-lg flex items-center justify-between font-mono">
              <div>
                <span className="text-[11px] text-slate-400 block font-sans">Resultado Calculado</span>
                <span
                  className={`text-base font-black ${
                    calculatedProfit > 0
                      ? 'text-emerald-400'
                      : calculatedProfit < 0
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {formatCurrency(calculatedProfit, true)}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-400 font-sans">
                <span>Modalidade:</span>
                <strong className="block text-white font-bold">{modality}</strong>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Observações / Justificativa do Trade
            </label>
            <input
              id="input-op-notes"
              type="text"
              placeholder="Ex: Entrada baseada em rejeição de nível chave no gráfico de 15 minutos"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              id="btn-cancel-op"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-op"
              className="px-5 py-2 rounded-lg text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-950 transition-all flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {initialOperation ? 'Atualizar Operação' : 'Registrar Operação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
