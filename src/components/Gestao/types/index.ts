export type MarketType = 'OTC' | 'ABERTO';
export type Direction = 'CALL' | 'PUT';
export type OperationResult = 'WIN' | 'LOSS' | 'EMPATE';
export type ManagementModel = '2x1' | '5x2' | 'FIXO' | 'SOROS' | 'MARTINGALE';
export type ExpirationTime = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | '15s' | '30s';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL';
export type TradingModality = 'ALL' | 'BINARIAS' | 'FOREX' | 'B3' | 'CRIPTO';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface Operation {
  id: string;
  userId: string;
  monthId: string; // e.g. "2026-08"
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  asset: string; // "EUR/USD", "BTC/USDT", "WIN$", "WDO$", etc.
  marketType: MarketType;
  direction: Direction;
  investment: number; // valor da entrada (R$ / $ / €)
  payout: number; // e.g. 87 (percent) - para Binárias
  expiration: ExpirationTime;
  strategy: string; // "Pullback", "Fibonacci", "Rompimento", "Price Action", etc.
  result: OperationResult;
  profit: number; // Positive if WIN, negative if LOSS (-investment), 0 if EMPATE
  notes?: string;
  cycleId?: string; // Optional reference to a 2x1 cycle or session
  createdAt: string;

  // Specific Multi-Market fields
  modality?: 'BINARIAS' | 'FOREX' | 'B3' | 'CRIPTO';
  // Forex:
  pips?: number;
  lotSize?: number;
  riskRewardRatio?: number;
  // B3:
  points?: number;
  contracts?: number;
  b3Type?: 'WIN' | 'WDO' | 'STOCKS' | 'WSP';
  // Cripto:
  leverage?: number;
  cryptoPosition?: 'LONG' | 'SHORT';
  marginUsed?: number;
  roiPercent?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  date: string; // "YYYY-MM-DD"
  amount: number; // positive value in R$
  broker: string; // e.g. "Quotex", "Pocket Option", "IQ Option", "Deriv", "Exnova", "Binance"
  notes?: string;
  createdAt: string;
}

export interface MonthConfig {
  id: string; // "2026-08"
  name: string; // "Agosto 2026"
  month: number; // 1 to 12
  year: number; // 2026
  daysInMonth: number; // 28, 30, 31
  workingDays?: number; // e.g. 20 (dias trabalhados no mês)
  initialBankroll: number; // R$, $, €
  currency: 'BRL' | 'USD' | 'EUR';
  monthlyGoal: number; // valor monetário
  monthlyGoalPercent: number; // %
  isMonthlyGoalPercent: boolean; // if true, calculated as % of initial bankroll
  defaultPayout: number; // default % (e.g. 87)
  maxOpsPerDay?: number; // e.g. 5
  preferredManagement?: ManagementModel; // '2x1' or '5x2'
  defaultEntryAmount?: number; // opcional
  dailyStopLoss?: number; // opcional
  dailyStopWin?: number; // opcional
  closedAt?: string;
  customAssets?: string[];
  customStrategies?: string[];
}

export interface DailyOperationalTime {
  date: string; // "YYYY-MM-DD"
  seconds: number; // total operational seconds on this day
}

export interface DailySummary {
  dayNumber: number; // 1 to 31
  date: string; // "YYYY-MM-DD"
  assets: string[]; // up to 3 most traded assets
  averagePayout: number;
  financialResult: number; // net profit/loss
  wins: number;
  losses: number;
  empates: number;
  totalOperations: number;
  operationalTimeSeconds: number;
  status: 'POSITIVE' | 'NEGATIVE' | 'ZERO' | 'NO_OPS';
  
  // Modality enriched metrics for Calendar & Reports:
  modalitiesPresent?: Array<'BINARIAS' | 'FOREX' | 'B3' | 'CRIPTO'>;
  forexPips?: number;
  forexLots?: number;
  forexAvgRiskReward?: number;
  b3WinPoints?: number;
  b3WdoPoints?: number;
  b3Contracts?: number;
  cryptoRoiAvg?: number;
  cryptoLongCount?: number;
  cryptoShortCount?: number;
}

export interface ModalityAnalytics {
  modality: TradingModality;
  totalOperations: number;
  wins: number;
  losses: number;
  empates: number;
  winRate: number;
  netProfit: number;
  profitFactor: number;
  operatedDaysCount: number;

  // Binárias specifics
  binaryAvgPayout?: number;
  binaryOtcWinRate?: number;
  binaryOpenWinRate?: number;
  binaryTimeframeBreakdown?: { M1: number; M5: number; M15: number; other: number };

  // Forex specifics
  forexTotalPips?: number;
  forexTotalLots?: number;
  forexAvgRiskReward?: number;
  forexProfitFactor?: number;
  forexPairsBreakdown?: Array<{ pair: string; pips: number; profit: number; trades: number }>;

  // B3 specifics
  b3TotalWinPoints?: number;
  b3TotalWdoPoints?: number;
  b3TotalContracts?: number;
  b3WinRateSessions?: number;
  b3ProfitPerContract?: number;

  // Crypto specifics
  cryptoAvgRoi?: number;
  cryptoAvgLeverage?: number;
  cryptoLongsWinRate?: number;
  cryptoShortsWinRate?: number;
  cryptoCoinsBreakdown?: Array<{ coin: string; profit: number; roi: number; trades: number }>;

  // Multi-market breakdown
  marketShareProfit?: {
    binarias: number;
    forex: number;
    b3: number;
    crypto: number;
  };
}

export interface MonthlyStats {
  initialBankroll: number;
  totalDeposits: number;
  totalWithdrawals: number;
  operationalProfit: number;
  operationalLoss: number;
  netProfit: number;
  currentBankroll: number;
  monthlyGoalAmount: number;
  goalProgressPercent: number; // can exceed 100% (e.g. 243%)
  workingDays: number;
  operatedDaysCount: number;
  totalOperations: number;
  wins: number;
  losses: number;
  empates: number;
  winRate: number; // WIN / (WIN + LOSS) * 100
  avgOperationsPerDay: number;
  bestWinStreak: number;
  worstLossStreak: number;
  totalOperationalTimeSeconds: number;
  todayOperationalTimeSeconds: number;
  weeklyOperationalTimeSeconds: number;
  dailyAvgOperationalTimeSeconds: number;
  bestAsset: { asset: string; profit: number; winRate: number; count: number } | null;
  worstAsset: { asset: string; profit: number; winRate: number; count: number } | null;
  bestStrategy: { strategy: string; profit: number; winRate: number; count: number } | null;
  bestTradingHour: { hour: string; profit: number; winRate: number; count: number } | null;
}

export interface Management2x1State {
  bankroll: number;
  workingDays: number;
  payout: number;
  dailyStopLoss: number;
  firstEntryPercent: number;
  firstEntryAmount: number;
  firstEntryEstimatedReturn: number;
  firstEntryNetProfit: number;
  secondEntryAmount: number;
  secondEntryEstimatedReturn: number;
  secondEntryNetProfit: number;
  totalTargetProfit: number;
  maxRiskAmount: number;
  bankrollPercentUsed: number;
  bankrollAfterWin: number;
  bankrollAfterLoss: number;
}

export interface Management5x2Session {
  id: string;
  date: string;
  maxOperations: number; // default 5
  maxConsecutiveLosses: number; // default 2
  maxTotalLosses: number; // default 2
  fixedEntryAmount: number;
  payout: number;
  dailyTargetWin: number;
  dailyStopLoss: number;
  operations: OperationResult[];
  opDetails?: Array<{
    result: OperationResult;
    payout: number;
    strategy: string;
    asset: string;
    investment: number;
    profit: number;
    time?: string;
  }>;
  status: 'ACTIVE' | 'STOP_LOSS' | 'STOP_WIN' | 'FINISHED';
  currentProfit: number;
}

export type MultiMarketType = 'FOREX' | 'B3' | 'CRYPTO';

export interface ForexCalculationResult {
  lotSize: number;
  miniLots: number;
  microLots: number;
  units: number;
  pipValuePerLot: number;
  pipValueTotal: number;
  stopLossPips: number;
  takeProfitPips: number;
  riskAmount: number;
  riskPercent: number;
  rewardAmount: number;
  rewardPercent: number;
  riskRewardRatio: number;
  requiredMargin: number;
  effectiveLeverage: number;
}

export interface B3CalculationResult {
  contracts: number;
  pointValueTotal: number;
  stopLossPoints: number;
  takeProfitPoints: number;
  riskAmount: number;
  riskPercent: number;
  rewardAmount: number;
  rewardPercent: number;
  riskRewardRatio: number;
  requiredMargin: number;
  instrumentType: 'WIN' | 'WDO' | 'STOCKS' | 'WSP';
}

export interface CryptoCalculationResult {
  positionSizeUsd: number;
  coinAmount: number;
  isolatedMargin: number;
  riskAmount: number;
  riskPercent: number;
  rewardAmount: number;
  rewardPercent: number;
  riskRewardRatio: number;
  estimatedLiquidationPrice: number;
  isLiquidationBeforeStop: boolean;
  roiOnMarginPercent: number;
  priceStopPercent: number;
  priceTargetPercent: number;
}
