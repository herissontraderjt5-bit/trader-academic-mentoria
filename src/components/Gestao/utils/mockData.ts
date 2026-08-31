import { MonthConfig, Operation, Transaction, DailyOperationalTime } from '../types';

export const DEFAULT_MONTH_ID = '2026-08';

export const DEFAULT_MONTH_CONFIG: MonthConfig = {
  id: '2026-08',
  name: 'Agosto de 2026',
  month: 8,
  year: 2026,
  daysInMonth: 31,
  workingDays: 20,
  initialBankroll: 125.0,
  currency: 'BRL',
  monthlyGoal: 100.0,
  monthlyGoalPercent: 80,
  isMonthlyGoalPercent: false,
  defaultPayout: 87,
  maxOpsPerDay: 5,
  preferredManagement: '2x1',
  defaultEntryAmount: 5.68,
  dailyStopLoss: 16.76,
  dailyStopWin: 15.92,
  customAssets: [
    'EUR/USD',
    'GBP/USD',
    'USD/JPY',
    'AUD/USD',
    'EUR/JPY',
    'USD/CHF',
    'XRP/USDT',
    'ETH/USDT',
    'BTC/USDT',
    'EUR/GBP',
  ],
  customStrategies: [
    'Pullback',
    'Fibonacci 61.8%',
    'Suporte e Resistência',
    'Rompimento M5',
    'Fluxo de Vela',
    'Linha de Tendência (LTA/LTB)',
    'Price Action Puro',
    'Cruzamento de Médias',
    'Gestão 2x1',
    'Gestão 5x2',
  ],
};

export function generateInitialMockData(): {
  config: MonthConfig;
  operations: Operation[];
  transactions: Transaction[];
  timeLogs: DailyOperationalTime[];
} {
  return {
    config: DEFAULT_MONTH_CONFIG,
    operations: [],
    transactions: [],
    timeLogs: [],
  };
}
