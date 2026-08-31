import React from 'react';
import {
  Globe,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { ModalitySelector } from '../common/ModalitySelector';
import { ModalityAnalyticsCard } from '../dashboard/ModalityAnalyticsCard';
import { TopMetricsGrid } from '../dashboard/TopMetricsGrid';
import { BankrollChart } from '../dashboard/BankrollChart';
import { GoalProgressDonut } from '../dashboard/GoalProgressDonut';
import { DailyGoalBar } from '../dashboard/DailyGoalBar';
import { MonthlyManagementTable } from '../dashboard/MonthlyManagementTable';
import { DailySummary } from '../../types';
import { NavTab } from '../layout/Sidebar';

interface DashboardViewProps {
  onOpenNewOp: () => void;
  onNavigate: (tab: NavTab) => void;
  onSelectDay: (day: DailySummary) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewOp,
  onSelectDay,
}) => {
  const {
    selectedModality,
    setSelectedModality,
    modalityAnalytics,
    monthConfig,
    operations,
    formatCurrency,
  } = useTrading();

  return (
    <div className="space-y-6 pb-12" id="view-dashboard">
      {/* Modality Switching Bar (Binárias / Forex / B3 / Cripto / Consolidado) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            Modalidade Ativa do Dashboard:
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Filtro inteligente aplicado em tempo real
          </span>
        </div>
        <ModalitySelector
          selectedModality={selectedModality}
          onSelectModality={setSelectedModality}
          operations={operations}
        />
      </div>

      {/* 1st & 2nd Rows: Metric Cards & Key Indicators (Dynamically adapts to selected modality) */}
      <TopMetricsGrid />

      {/* Modality Specialized Deep-Dive Analytics (Forex pips/lots, B3 points/contracts, Crypto ROI/lev, Binary payout/OTC) */}
      <ModalityAnalyticsCard
        analytics={modalityAnalytics}
        selectedModality={selectedModality}
        monthConfig={monthConfig}
        formatCurrency={(val, showSign) => formatCurrency(val, showSign, monthConfig.currency)}
      />

      {/* Daily Risk and Goal Banner */}
      <DailyGoalBar />

      {/* 3rd Row: Gráfico de Evolução da Banca + Donut de Meta Mensal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <BankrollChart />
        </div>
        <div className="lg:col-span-1">
          <GoalProgressDonut />
        </div>
      </div>

      {/* Tabela de Gestão Mensal (1 a 31) */}
      <MonthlyManagementTable
        onSelectDay={onSelectDay}
        onNewOpForDate={() => onOpenNewOp()}
      />
    </div>
  );
};
