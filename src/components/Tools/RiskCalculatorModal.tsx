import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Layers,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Flame,
  Scale
} from 'lucide-react';

interface RiskCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MarketCategory = 'WIN' | 'WDO' | 'FOREX' | 'CRIPTO';

interface SubAsset {
  id: string;
  name: string;
  currency: string;
  pointValue: number; // Valor financeiro por unidade de oscilação por 1 lote/unidade
  marginDefault: number;
  defaultStop: number;
  defaultTarget: number;
  defaultLot: number;
  step: number;
  unit: string;
}

const MARKET_ASSETS: Record<MarketCategory, { label: string; assets: SubAsset[] }> = {
  WIN: {
    label: 'Mini-Índice B3',
    assets: [
      {
        id: 'WIN_FUT',
        name: 'WIN (Mini-Índice Futuro B3)',
        currency: 'R$',
        pointValue: 0.20, // R$ 0,20 por ponto
        marginDefault: 100,
        defaultStop: 150,
        defaultTarget: 300,
        defaultLot: 1,
        step: 1,
        unit: 'pontos',
      }
    ]
  },
  WDO: {
    label: 'Mini-Dólar B3',
    assets: [
      {
        id: 'WDO_FUT',
        name: 'WDO (Mini-Dólar Futuro B3)',
        currency: 'R$',
        pointValue: 10.00, // R$ 10,00 por ponto
        marginDefault: 150,
        defaultStop: 5,
        defaultTarget: 15,
        defaultLot: 1,
        step: 1,
        unit: 'pontos',
      }
    ]
  },
  FOREX: {
    label: 'Forex & Índices Globais',
    assets: [
      {
        id: 'EURUSD',
        name: 'EUR/USD (Euro / Dólar)',
        currency: '$',
        pointValue: 10.00, // $10/pip por lote standard
        marginDefault: 50,
        defaultStop: 20,
        defaultTarget: 50,
        defaultLot: 0.10,
        step: 0.01,
        unit: 'pips',
      },
      {
        id: 'GBPUSD',
        name: 'GBP/USD (Libra / Dólar)',
        currency: '$',
        pointValue: 10.00,
        marginDefault: 50,
        defaultStop: 25,
        defaultTarget: 60,
        defaultLot: 0.10,
        step: 0.01,
        unit: 'pips',
      },
      {
        id: 'USDJPY',
        name: 'USD/JPY (Dólar / Iene)',
        currency: '$',
        pointValue: 10.00,
        marginDefault: 50,
        defaultStop: 20,
        defaultTarget: 50,
        defaultLot: 0.10,
        step: 0.01,
        unit: 'pips',
      },
      {
        id: 'XAUUSD',
        name: 'XAU/USD (Ouro / Gold)',
        currency: '$',
        pointValue: 10.00, // $10 por $1.00 oscilação em 0.1 lote ($100 em 1.00)
        marginDefault: 100,
        defaultStop: 15,
        defaultTarget: 45,
        defaultLot: 0.05,
        step: 0.01,
        unit: 'USD ($)',
      },
      {
        id: 'NAS100',
        name: 'NAS100 (Nasdaq Tech CFD)',
        currency: '$',
        pointValue: 2.00, // $2 por ponto
        marginDefault: 80,
        defaultStop: 30,
        defaultTarget: 90,
        defaultLot: 0.50,
        step: 0.1,
        unit: 'pontos',
      },
      {
        id: 'US30',
        name: 'US30 (Dow Jones CFD)',
        currency: '$',
        pointValue: 1.00, // $1 por ponto
        marginDefault: 80,
        defaultStop: 50,
        defaultTarget: 150,
        defaultLot: 1.00,
        step: 0.1,
        unit: 'pontos',
      }
    ]
  },
  CRIPTO: {
    label: 'Criptomoedas',
    assets: [
      {
        id: 'BTCUSDT',
        name: 'BTC/USDT (Bitcoin)',
        currency: '$',
        pointValue: 1.00, // $1 por $1 variação
        marginDefault: 100,
        defaultStop: 500,
        defaultTarget: 1500,
        defaultLot: 0.02,
        step: 0.001,
        unit: 'USD ($)',
      },
      {
        id: 'ETHUSDT',
        name: 'ETH/USDT (Ethereum)',
        currency: '$',
        pointValue: 1.00,
        marginDefault: 50,
        defaultStop: 40,
        defaultTarget: 120,
        defaultLot: 0.20,
        step: 0.01,
        unit: 'USD ($)',
      },
      {
        id: 'SOLUSDT',
        name: 'SOL/USDT (Solana)',
        currency: '$',
        pointValue: 1.00,
        marginDefault: 30,
        defaultStop: 5,
        defaultTarget: 15,
        defaultLot: 2.0,
        step: 0.1,
        unit: 'USD ($)',
      },
      {
        id: 'BNBUSDT',
        name: 'BNB/USDT (Binance)',
        currency: '$',
        pointValue: 1.00,
        marginDefault: 30,
        defaultStop: 10,
        defaultTarget: 30,
        defaultLot: 1.0,
        step: 0.1,
        unit: 'USD ($)',
      }
    ]
  }
};

export const RiskCalculatorModal: React.FC<RiskCalculatorModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Selected Category
  const [category, setCategory] = useState<MarketCategory>('WIN');
  
  // Selected Asset ID within category
  const [selectedAssetId, setSelectedAssetId] = useState<string>('WIN_FUT');

  // Input States
  const [lot, setLot] = useState<number>(1);
  const [stopValue, setStopValue] = useState<number>(150);
  const [targetValue, setTargetValue] = useState<number>(300);
  const [marginPerLot, setMarginPerLot] = useState<number>(100);

  // Get active asset configuration
  const currentAsset = useMemo(() => {
    const assets = MARKET_ASSETS[category].assets;
    const found = assets.find(a => a.id === selectedAssetId);
    return found || assets[0];
  }, [category, selectedAssetId]);

  // Handle Category Change
  const handleSelectCategory = (cat: MarketCategory) => {
    setCategory(cat);
    const firstAsset = MARKET_ASSETS[cat].assets[0];
    setSelectedAssetId(firstAsset.id);
    setLot(firstAsset.defaultLot);
    setStopValue(firstAsset.defaultStop);
    setTargetValue(firstAsset.defaultTarget);
    setMarginPerLot(firstAsset.marginDefault);
  };

  // Handle Asset Change
  const handleSelectAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    const asset = MARKET_ASSETS[category].assets.find(a => a.id === assetId);
    if (asset) {
      setLot(asset.defaultLot);
      setStopValue(asset.defaultStop);
      setTargetValue(asset.defaultTarget);
      setMarginPerLot(asset.marginDefault);
    }
  };

  // CALCULATIONS
  // Perda = Lote * Stop * Valor do Ponto
  const totalLoss = useMemo(() => {
    return lot * stopValue * currentAsset.pointValue;
  }, [lot, stopValue, currentAsset]);

  // Lucro = Lote * Alvo * Valor do Ponto
  const totalGain = useMemo(() => {
    return lot * targetValue * currentAsset.pointValue;
  }, [lot, targetValue, currentAsset]);

  // Margem Total = Lote * Margem por Lote
  const totalMargin = useMemo(() => {
    return lot * marginPerLot;
  }, [lot, marginPerLot]);

  // Relação Risco:Retorno
  const riskRewardRatio = stopValue > 0 ? (targetValue / stopValue).toFixed(2) : '0';
  const ratioNum = Number(riskRewardRatio);

  const curr = currentAsset.currency;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#0a0a0c] border border-orange-500/30 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-950 via-[#111116] to-zinc-950 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600/20 flex items-center justify-center text-orange-500 border border-orange-500/30 shadow-inner">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Calculadora de Risco & Retorno
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-orange-600/20 text-orange-400 font-bold uppercase border border-orange-500/30">
                  {category}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Simule pontos, lote e veja o valor financeiro do Stop e Alvo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5">
          
          {/* 1. SELETOR PRINCIPAL DE MERCADO (WIN, WDO, FOREX, CRIPTO) */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase font-mono tracking-wider mb-2">
              1. Selecione a Modalidade
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['WIN', 'WDO', 'FOREX', 'CRIPTO'] as MarketCategory[]).map((catKey) => {
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => handleSelectCategory(catKey)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all text-center cursor-pointer border ${
                      isSelected
                        ? 'bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-600/25 scale-[1.02]'
                        : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {catKey}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. SELETOR DE ATIVOS ESPECÍFICOS (FOREX OU CRIPTO) */}
          {(category === 'FOREX' || category === 'CRIPTO') && (
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-2 animate-in fade-in duration-200">
              <label className="block text-[10px] font-bold text-orange-400 uppercase font-mono tracking-wider">
                2. Escolha o Par / Ativo ({category})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MARKET_ASSETS[category].assets.map((asset) => {
                  const isAssetSelected = selectedAssetId === asset.id;
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => handleSelectAsset(asset.id)}
                      className={`p-2 rounded-xl text-left transition-all border cursor-pointer ${
                        isAssetSelected
                          ? 'bg-orange-600/20 border-orange-500 text-white shadow-md'
                          : 'bg-zinc-950/80 border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <p className="text-xs font-bold truncate leading-tight">{asset.name.split(' ')[0]}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">{asset.unit}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. INPUTS: LOTE, STOP E ALVO */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-zinc-900/50 p-3.5 sm:p-4 rounded-2xl border border-white/5">
            
            {/* Lote / Contratos */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-zinc-300 uppercase font-mono mb-1 truncate">
                Lote / Contratos
              </label>
              <input
                type="number"
                step={currentAsset.step}
                min={currentAsset.step}
                value={lot}
                onChange={(e) => setLot(Math.max(currentAsset.step, Number(e.target.value)))}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white font-mono text-sm sm:text-base font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Stop Loss (Pontos / Pips / USD) */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-red-400 uppercase font-mono mb-1 truncate">
                Stop ({currentAsset.unit})
              </label>
              <input
                type="number"
                step="1"
                min="0.1"
                value={stopValue}
                onChange={(e) => setStopValue(Math.max(0.1, Number(e.target.value)))}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-red-500/40 text-red-400 font-mono text-sm sm:text-base font-bold focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Take Profit (Pontos / Pips / USD) */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase font-mono mb-1 truncate">
                Alvo ({currentAsset.unit})
              </label>
              <input
                type="number"
                step="1"
                min="0.1"
                value={targetValue}
                onChange={(e) => setTargetValue(Math.max(0.1, Number(e.target.value)))}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-emerald-500/40 text-emerald-400 font-mono text-sm sm:text-base font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

          </div>

          {/* 4. SUPER DESTAQUE: CARDS DE RISCO E RETORNO COM ALTO IMPACTO VISUAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* CARD 1: RISCO MÁXIMO (STOP LOSS) - MEGA DESTACADO */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-red-950/70 via-red-950/40 to-black border-2 border-red-500/80 shadow-2xl shadow-red-950/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/20 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase font-mono px-2.5 py-0.5 rounded-full bg-red-500 text-white flex items-center gap-1 shadow-md shadow-red-600/40">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>RISCO (PERDA MÁXIMA)</span>
                </span>
                <span className="text-[10px] font-mono text-red-300 font-bold">
                  {stopValue} {currentAsset.unit}
                </span>
              </div>

              <p className="text-3xl sm:text-4xl font-black text-red-400 font-mono tracking-tight mt-2 drop-shadow-[0_2px_10px_rgba(239,68,68,0.3)]">
                -{curr} {totalLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>

              <p className="text-[11px] text-zinc-400 mt-2 font-mono">
                Impacto com <strong className="text-white">{lot}</strong> {category === 'FOREX' || category === 'CRIPTO' ? 'lote(s)' : 'contrato(s)'}
              </p>
            </div>

            {/* CARD 2: RETORNO ESPERADO (TAKE PROFIT) - MEGA DESTACADO */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-emerald-950/70 via-emerald-950/40 to-black border-2 border-emerald-500/80 shadow-2xl shadow-emerald-950/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/20 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase font-mono px-2.5 py-0.5 rounded-full bg-emerald-500 text-black flex items-center gap-1 shadow-md shadow-emerald-600/40">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>RETORNO (LUCRO ALVO)</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-300 font-bold">
                  {targetValue} {currentAsset.unit}
                </span>
              </div>

              <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight mt-2 drop-shadow-[0_2px_10px_rgba(16,185,129,0.3)]">
                +{curr} {totalGain.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>

              <p className="text-[11px] text-zinc-400 mt-2 font-mono">
                Retorno com <strong className="text-white">{lot}</strong> {category === 'FOREX' || category === 'CRIPTO' ? 'lote(s)' : 'contrato(s)'}
              </p>
            </div>

          </div>

          {/* 5. BARRA DE PROPORÇÃO RISCO X RETORNO + MARGEM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Relação R:R */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="text-xs text-zinc-300 font-bold font-mono">Relação Risco x Retorno:</span>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono border ${
                ratioNum >= 2 
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50' 
                  : ratioNum >= 1
                  ? 'bg-orange-950 text-orange-400 border-orange-500/50'
                  : 'bg-red-950 text-red-400 border-red-500/50'
              }`}>
                1 : {riskRewardRatio}
              </span>
            </div>

            {/* Margem de Garantia Total */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-xs text-zinc-300 font-bold font-mono">Margem Exigida:</span>
              </div>
              <span className="text-xs font-black text-white font-mono">
                {curr} {totalMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

          </div>

          {/* Ajuste de Margem unitária opcional */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/30 border border-white/5 text-[11px] text-zinc-400">
            <span className="font-mono">Margem unitária por lote:</span>
            <div className="flex items-center gap-1">
              <span className="text-zinc-500 font-mono">{curr}</span>
              <input
                type="number"
                value={marginPerLot}
                onChange={(e) => setMarginPerLot(Math.max(0, Number(e.target.value)))}
                className="w-20 px-2 py-0.5 rounded bg-zinc-950 border border-white/10 text-white font-mono text-xs focus:outline-none text-right"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-white/5 flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-orange-600/30"
          >
            Concluir & Voltar às Aulas
          </button>
        </div>

      </div>
    </div>
  );
};
