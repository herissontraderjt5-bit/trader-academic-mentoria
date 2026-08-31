import React from 'react';
import {
  Globe,
  Zap,
  TrendingUp,
  Coins,
  BarChart3,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TradingModality, Operation } from '../../types';
import { getOperationModality } from '../../utils/modalityCalculations';

interface ModalitySelectorProps {
  selectedModality: TradingModality;
  onSelectModality: (modality: TradingModality) => void;
  operations?: Operation[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ModalitySelector: React.FC<ModalitySelectorProps> = ({
  selectedModality,
  onSelectModality,
  operations = [],
  className = '',
  size = 'md',
}) => {
  // Count operations per modality
  const counts = {
    ALL: operations.length,
    BINARIAS: operations.filter((o) => getOperationModality(o) === 'BINARIAS').length,
    FOREX: operations.filter((o) => getOperationModality(o) === 'FOREX').length,
    B3: operations.filter((o) => getOperationModality(o) === 'B3').length,
    CRIPTO: operations.filter((o) => getOperationModality(o) === 'CRIPTO').length,
  };

  const modalities: Array<{
    id: TradingModality;
    label: string;
    shortLabel: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    activeBg: string;
    activeBorder: string;
    activeText: string;
    badgeColor: string;
  }> = [
    {
      id: 'ALL',
      label: 'Todas as Modalidades',
      shortLabel: 'Consolidado',
      sublabel: 'Visão Geral Multi-Mercado',
      icon: Globe,
      accentColor: 'cyan',
      activeBg: 'bg-cyan-500/15',
      activeBorder: 'border-cyan-500/50',
      activeText: 'text-cyan-400',
      badgeColor: 'bg-cyan-500/20 text-cyan-300',
    },
    {
      id: 'BINARIAS',
      label: 'Opções Binárias',
      shortLabel: 'Binárias',
      sublabel: 'Assertividade & Payout',
      icon: Zap,
      accentColor: 'orange',
      activeBg: 'bg-orange-500/15',
      activeBorder: 'border-orange-500/50',
      activeText: 'text-orange-400',
      badgeColor: 'bg-orange-500/20 text-orange-300',
    },
    {
      id: 'FOREX',
      label: 'Forex & Metais',
      shortLabel: 'Forex',
      sublabel: 'Pips, Lotes & R:R',
      icon: TrendingUp,
      accentColor: 'emerald',
      activeBg: 'bg-emerald-500/15',
      activeBorder: 'border-emerald-500/50',
      activeText: 'text-emerald-400',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
    },
    {
      id: 'B3',
      label: 'B3 Futuros & Ações',
      shortLabel: 'B3 (Brasil)',
      sublabel: 'WIN, WDO & Pregões',
      icon: BarChart3,
      accentColor: 'blue',
      activeBg: 'bg-blue-500/15',
      activeBorder: 'border-blue-500/50',
      activeText: 'text-blue-400',
      badgeColor: 'bg-blue-500/20 text-blue-300',
    },
    {
      id: 'CRIPTO',
      label: 'Cripto Futuros',
      shortLabel: 'Cripto',
      sublabel: 'ROI & Alavancagem',
      icon: Coins,
      accentColor: 'purple',
      activeBg: 'bg-purple-500/15',
      activeBorder: 'border-purple-500/50',
      activeText: 'text-purple-400',
      badgeColor: 'bg-purple-500/20 text-purple-300',
    },
  ];

  return (
    <div
      className={`p-1.5 bg-[#0b0e14] border border-slate-800/80 rounded-2xl flex flex-wrap items-center gap-1.5 ${className}`}
      id="modality-filter-bar"
    >
      {modalities.map((item) => {
        const Icon = item.icon;
        const isSelected = selectedModality === item.id;
        const opCount = counts[item.id];

        return (
          <button
            key={item.id}
            id={`btn-modality-${item.id.toLowerCase()}`}
            type="button"
            onClick={() => onSelectModality(item.id)}
            className={`flex-1 min-w-[130px] sm:min-w-[140px] px-3 py-2 rounded-xl transition-all duration-200 flex items-center justify-between text-left group border ${
              isSelected
                ? `${item.activeBg} ${item.activeBorder} ${item.activeText} shadow-md shadow-black/40`
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${
                  isSelected
                    ? `${item.activeBg} ${item.activeText}`
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tracking-tight block truncate">
                    {item.shortLabel}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 hidden sm:block truncate">
                  {item.sublabel}
                </span>
              </div>
            </div>

            {/* Badge counter */}
            {opCount > 0 && (
              <span
                className={`ml-2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                  isSelected
                    ? item.badgeColor
                    : 'bg-slate-800/80 text-slate-400'
                }`}
              >
                {opCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
