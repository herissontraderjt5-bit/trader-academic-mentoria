import {
  Operation,
  Transaction,
  MonthConfig,
  MonthlyStats,
  DailySummary,
  DailyOperationalTime,
  Management2x1State,
  ForexCalculationResult,
  B3CalculationResult,
  CryptoCalculationResult,
} from '../types';

/**
 * Calculates operation profit based on result, investment, and payout percentage
 */
export function calculateOperationProfit(
  investment: number,
  payoutPercent: number,
  result: 'WIN' | 'LOSS' | 'EMPATE'
): number {
  if (result === 'WIN') {
    return Number((investment * (payoutPercent / 100)).toFixed(2));
  }
  if (result === 'LOSS') {
    return -Number(investment.toFixed(2));
  }
  return 0;
}

/**
 * Computes complete 2x1 mathematical table & recommendations:
 * - Capital / Working Days = Daily Stop Loss & First Entry Amount
 * - Payout Minimum 80%
 * - If Win on Entry 1 -> Entry 2 = Entry 1 Amount + Profit from Entry 1
 */
export function calculate2x1Management(
  bankroll: number,
  workingDays: number = 20,
  payout: number = 85
): Management2x1State {
  const currentBankroll = bankroll > 0 ? bankroll : 100;
  const days = workingDays > 0 ? workingDays : 20;
  const currentPayout = Math.max(80, payout || 80);

  // 1. Valor da entrada / Stop diário = Valor do Capital / Quantidade de Dias
  // A primeira mão de entrada é exatamente o valor do stop diário
  const dailyStopLoss = Number((currentBankroll / days).toFixed(2));
  const firstEntryAmount = dailyStopLoss;
  const firstEntryPercent = Number(((firstEntryAmount / currentBankroll) * 100).toFixed(2));

  // Lucro da primeira mão se der WIN
  const firstEntryNetProfit = Number((firstEntryAmount * (currentPayout / 100)).toFixed(2));
  const firstEntryEstimatedReturn = Number((firstEntryAmount + firstEntryNetProfit).toFixed(2));

  // Se der WIN: a próxima entrada é com o valor da primeira mão + lucro obtido
  const secondEntryAmount = Number((firstEntryAmount + firstEntryNetProfit).toFixed(2));
  const secondEntryNetProfit = Number((secondEntryAmount * (currentPayout / 100)).toFixed(2));
  const secondEntryEstimatedReturn = Number((secondEntryAmount + secondEntryNetProfit).toFixed(2));

  // Lucro líquido total do dia caso atinja 2x0 (Meta Batida)
  // Retorno total recebido ao vencer a 2ª mão menos o capital inicial arriscado (Mão 1)
  const totalTargetProfit = Number((secondEntryEstimatedReturn - firstEntryAmount).toFixed(2));
  const maxRiskAmount = dailyStopLoss;
  const bankrollPercentUsed = firstEntryPercent;

  const bankrollAfterWin = Number((currentBankroll + totalTargetProfit).toFixed(2));
  const bankrollAfterLoss = Number((currentBankroll - dailyStopLoss).toFixed(2));

  return {
    bankroll: currentBankroll,
    workingDays: days,
    payout: currentPayout,
    dailyStopLoss,
    firstEntryPercent,
    firstEntryAmount,
    firstEntryEstimatedReturn,
    firstEntryNetProfit,
    secondEntryAmount,
    secondEntryEstimatedReturn,
    secondEntryNetProfit,
    totalTargetProfit,
    maxRiskAmount,
    bankrollPercentUsed,
    bankrollAfterWin,
    bankrollAfterLoss,
  };
}

export interface Management5x2Calculation {
  bankroll: number;
  workingDays: number;
  payout: number;
  dailyStopLoss: number;
  fixedEntryAmount: number;
  fixedEntryPercent: number;
  singleWinProfit: number;
  singleWinReturn: number;
  dailyTarget5x0: number;
  dailyTarget4x1: number;
  dailyTarget3x2: number;
  dailyStop0x2: number;
  dailyStop1x2: number;
  dailyStop2x2: number;
}

/**
 * Computes 5x2 Management:
 * 1. Capital Inicial / Quantidade de Dias = Stop do Dia (2 perdas)
 * 2. Stop do Dia / 2 = Valor da Mão Fixa de cada entrada
 * 3. Máximo de 5 operações no dia, parando com 2 LOSS ou batendo meta
 */
export function calculate5x2Management(
  bankroll: number,
  workingDays: number = 20,
  payout: number = 85
): Management5x2Calculation {
  const currentBankroll = bankroll > 0 ? bankroll : 100;
  const days = workingDays > 0 ? workingDays : 20;
  const currentPayout = Math.max(80, payout || 80);

  // Stop Diário = Capital / Quantidade de Dias
  const dailyStopLoss = Number((currentBankroll / days).toFixed(2));

  // Valor da Mão Fixa = Stop Diário / 2 (pois são 2 perdas)
  const fixedEntryAmount = Number((dailyStopLoss / 2).toFixed(2));
  const fixedEntryPercent = Number(((fixedEntryAmount / currentBankroll) * 100).toFixed(2));

  // Lucro líquido em 1 WIN
  const singleWinProfit = Number((fixedEntryAmount * (currentPayout / 100)).toFixed(2));
  const singleWinReturn = Number((fixedEntryAmount + singleWinProfit).toFixed(2));

  // Cenários
  const dailyTarget5x0 = Number((5 * singleWinProfit).toFixed(2));
  const dailyTarget4x1 = Number((4 * singleWinProfit - fixedEntryAmount).toFixed(2));
  const dailyTarget3x2 = Number((3 * singleWinProfit - 2 * fixedEntryAmount).toFixed(2));

  const dailyStop0x2 = Number((2 * fixedEntryAmount).toFixed(2)); // dailyStopLoss
  const dailyStop1x2 = Number((2 * fixedEntryAmount - singleWinProfit).toFixed(2));
  const dailyStop2x2 = Number((2 * fixedEntryAmount - 2 * singleWinProfit).toFixed(2));

  return {
    bankroll: currentBankroll,
    workingDays: days,
    payout: currentPayout,
    dailyStopLoss,
    fixedEntryAmount,
    fixedEntryPercent,
    singleWinProfit,
    singleWinReturn,
    dailyTarget5x0,
    dailyTarget4x1,
    dailyTarget3x2,
    dailyStop0x2,
    dailyStop1x2,
    dailyStop2x2,
  };
}

/**
 * Calculates win and loss streaks from operations ordered chronologically
 */
export function calculateStreaks(operations: Operation[]): { bestWinStreak: number; worstLossStreak: number } {
  if (!operations || operations.length === 0) {
    return { bestWinStreak: 0, worstLossStreak: 0 };
  }

  // Sort by date and time
  const sorted = [...operations].sort((a, b) => {
    const dtA = `${a.date} ${a.time}`;
    const dtB = `${b.date} ${b.time}`;
    return dtA.localeCompare(dtB);
  });

  let currentWinStreak = 0;
  let maxWinStreak = 0;
  let currentLossStreak = 0;
  let maxLossStreak = 0;

  for (const op of sorted) {
    if (op.result === 'WIN') {
      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    } else if (op.result === 'LOSS') {
      currentLossStreak++;
      currentWinStreak = 0;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
    }
    // Empates do not reset or increment win/loss streak according to binary trading standard, or they reset?
    // In trading scoreboard, empates don't count towards streak
  }

  return {
    bestWinStreak: maxWinStreak,
    worstLossStreak: maxLossStreak,
  };
}

/**
 * Aggregates operations and transactions into MonthlyStats
 */
export function calculateMonthlyStats(
  config: MonthConfig,
  operations: Operation[],
  transactions: Transaction[],
  timeLogs: DailyOperationalTime[],
  todayDateStr: string
): MonthlyStats {
  const monthOps = operations.filter((op) => op.monthId === config.id);
  const monthTrans = transactions.filter((t) => t.date.startsWith(config.id));
  const monthTimeLogs = timeLogs.filter((tl) => tl.date.startsWith(config.id));

  let totalDeposits = 0;
  let totalWithdrawals = 0;

  monthTrans.forEach((t) => {
    if (t.type === 'DEPOSIT') totalDeposits += t.amount;
    if (t.type === 'WITHDRAWAL') totalWithdrawals += t.amount;
  });

  let wins = 0;
  let losses = 0;
  let empates = 0;
  let operationalProfit = 0;
  let operationalLoss = 0;

  monthOps.forEach((op) => {
    if (op.result === 'WIN') {
      wins++;
      operationalProfit += op.profit;
    } else if (op.result === 'LOSS') {
      losses++;
      operationalLoss += Math.abs(op.profit);
    } else {
      empates++;
    }
  });

  const netProfit = Number((operationalProfit - operationalLoss).toFixed(2));
  
  // Formula requested:
  // Banca Atual = Banca Inicial + Depósitos + Lucros - Prejuízos - Saques
  const currentBankroll = Number(
    (config.initialBankroll + totalDeposits + operationalProfit - operationalLoss - totalWithdrawals).toFixed(2)
  );

  const monthlyGoalAmount = config.isMonthlyGoalPercent
    ? Number(((config.initialBankroll * config.monthlyGoal) / 100).toFixed(2))
    : config.monthlyGoal;

  // Formula requested:
  // progresso da meta = lucro mensal ÷ meta mensal × 100.
  // Se ultrapassar 100%, permitir mostrar valores como 125%, 180%, 243%, etc.
  const goalProgressPercent = monthlyGoalAmount > 0
    ? Number(((netProfit / monthlyGoalAmount) * 100).toFixed(1))
    : 0;

  const totalOperations = monthOps.length;
  // Formula requested: Assertividade = WIN ÷ (WIN + LOSS) × 100. Empates não entram no cálculo.
  const decisiveOps = wins + losses;
  const winRate = decisiveOps > 0 ? Number(((wins / decisiveOps) * 100).toFixed(1)) : 0;

  // Unique operational days in this month
  const uniqueDays = new Set(monthOps.map((op) => op.date));
  const avgOperationsPerDay = uniqueDays.size > 0
    ? Number((totalOperations / uniqueDays.size).toFixed(1))
    : 0;

  const { bestWinStreak, worstLossStreak } = calculateStreaks(monthOps);

  // Time calculations
  let totalOperationalTimeSeconds = 0;
  let todayOperationalTimeSeconds = 0;
  let weeklyOperationalTimeSeconds = 0;

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  monthTimeLogs.forEach((tl) => {
    totalOperationalTimeSeconds += tl.seconds;
    if (tl.date === todayDateStr) {
      todayOperationalTimeSeconds += tl.seconds;
    }
    const logDate = new Date(tl.date);
    if (logDate >= oneWeekAgo && logDate <= now) {
      weeklyOperationalTimeSeconds += tl.seconds;
    }
  });

  const dailyAvgOperationalTimeSeconds = uniqueDays.size > 0
    ? Math.round(totalOperationalTimeSeconds / uniqueDays.size)
    : totalOperationalTimeSeconds;

  // Best/Worst Asset
  const assetMap = new Map<string, { profit: number; wins: number; losses: number; count: number }>();
  monthOps.forEach((op) => {
    const current = assetMap.get(op.asset) || { profit: 0, wins: 0, losses: 0, count: 0 };
    current.count++;
    current.profit += op.profit;
    if (op.result === 'WIN') current.wins++;
    if (op.result === 'LOSS') current.losses++;
    assetMap.set(op.asset, current);
  });

  let bestAsset: MonthlyStats['bestAsset'] = null;
  let worstAsset: MonthlyStats['worstAsset'] = null;

  assetMap.forEach((val, key) => {
    const rate = val.wins + val.losses > 0 ? (val.wins / (val.wins + val.losses)) * 100 : 0;
    const item = { asset: key, profit: Number(val.profit.toFixed(2)), winRate: Number(rate.toFixed(1)), count: val.count };
    if (!bestAsset || item.profit > bestAsset.profit) bestAsset = item;
    if (!worstAsset || item.profit < worstAsset.profit) worstAsset = item;
  });

  // Best Strategy
  const strategyMap = new Map<string, { profit: number; wins: number; losses: number; count: number }>();
  monthOps.forEach((op) => {
    const strat = op.strategy || 'Padrão';
    const current = strategyMap.get(strat) || { profit: 0, wins: 0, losses: 0, count: 0 };
    current.count++;
    current.profit += op.profit;
    if (op.result === 'WIN') current.wins++;
    if (op.result === 'LOSS') current.losses++;
    strategyMap.set(strat, current);
  });

  let bestStrategy: MonthlyStats['bestStrategy'] = null;
  strategyMap.forEach((val, key) => {
    const rate = val.wins + val.losses > 0 ? (val.wins / (val.wins + val.losses)) * 100 : 0;
    const item = { strategy: key, profit: Number(val.profit.toFixed(2)), winRate: Number(rate.toFixed(1)), count: val.count };
    if (!bestStrategy || item.profit > bestStrategy.profit) bestStrategy = item;
  });

  // Best Trading Hour
  const hourMap = new Map<string, { profit: number; wins: number; losses: number; count: number }>();
  monthOps.forEach((op) => {
    const hour = op.time ? `${op.time.split(':')[0]}:00` : '10:00';
    const current = hourMap.get(hour) || { profit: 0, wins: 0, losses: 0, count: 0 };
    current.count++;
    current.profit += op.profit;
    if (op.result === 'WIN') current.wins++;
    if (op.result === 'LOSS') current.losses++;
    hourMap.set(hour, current);
  });

  let bestTradingHour: MonthlyStats['bestTradingHour'] = null;
  hourMap.forEach((val, key) => {
    const rate = val.wins + val.losses > 0 ? (val.wins / (val.wins + val.losses)) * 100 : 0;
    const item = { hour: key, profit: Number(val.profit.toFixed(2)), winRate: Number(rate.toFixed(1)), count: val.count };
    if (!bestTradingHour || item.profit > bestTradingHour.profit) bestTradingHour = item;
  });

  return {
    initialBankroll: config.initialBankroll,
    totalDeposits,
    totalWithdrawals,
    operationalProfit,
    operationalLoss,
    netProfit,
    currentBankroll,
    monthlyGoalAmount,
    goalProgressPercent,
    workingDays: config.workingDays || 20,
    operatedDaysCount: uniqueDays.size,
    totalOperations,
    wins,
    losses,
    empates,
    winRate,
    avgOperationsPerDay,
    bestWinStreak,
    worstLossStreak,
    totalOperationalTimeSeconds,
    todayOperationalTimeSeconds,
    weeklyOperationalTimeSeconds,
    dailyAvgOperationalTimeSeconds,
    bestAsset,
    worstAsset,
    bestStrategy,
    bestTradingHour,
  };
}

/**
 * Builds the 1 to 31 Day table for the modern monthly management spreadsheet
 */
export function buildMonthlyManagementTable(
  monthId: string,
  operations: Operation[],
  timeLogs: DailyOperationalTime[]
): DailySummary[] {
  const [yearStr, monthStr] = monthId.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  const result: DailySummary[] = [];

  for (let day = 1; day <= 31; day++) {
    const dayPadded = String(day).padStart(2, '0');
    const dateStr = `${yearStr}-${monthStr}-${dayPadded}`;
    const isValidDay = day <= daysInMonth;

    if (!isValidDay) {
      result.push({
        dayNumber: day,
        date: dateStr,
        assets: [],
        averagePayout: 0,
        financialResult: 0,
        wins: 0,
        losses: 0,
        empates: 0,
        totalOperations: 0,
        operationalTimeSeconds: 0,
        status: 'NO_OPS',
      });
      continue;
    }

    const dayOps = operations.filter((op) => op.date === dateStr);
    const dayTime = timeLogs.find((tl) => tl.date === dateStr)?.seconds || 0;

    let wins = 0;
    let losses = 0;
    let empates = 0;
    let financialResult = 0;
    let payoutSum = 0;
    const assetFreq: Record<string, number> = {};

    dayOps.forEach((op) => {
      financialResult += op.profit;
      payoutSum += op.payout;
      assetFreq[op.asset] = (assetFreq[op.asset] || 0) + 1;
      if (op.result === 'WIN') wins++;
      else if (op.result === 'LOSS') losses++;
      else empates++;
    });

    const topAssets = Object.entries(assetFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);

    const averagePayout = dayOps.length > 0 ? Math.round(payoutSum / dayOps.length) : 0;
    const totalOps = dayOps.length;

    let status: DailySummary['status'] = 'NO_OPS';
    if (totalOps > 0) {
      if (financialResult > 0) status = 'POSITIVE';
      else if (financialResult < 0) status = 'NEGATIVE';
      else status = 'ZERO';
    }

    result.push({
      dayNumber: day,
      date: dateStr,
      assets: topAssets,
      averagePayout,
      financialResult: Number(financialResult.toFixed(2)),
      wins,
      losses,
      empates,
      totalOperations: totalOps,
      operationalTimeSeconds: dayTime,
      status,
    });
  }

  return result;
}

/**
 * Builds data for bankroll evolution line chart
 */
export function buildBankrollEvolutionChartData(
  config: MonthConfig,
  dailySummaries: DailySummary[],
  transactions: Transaction[]
) {
  let runningBankroll = config.initialBankroll;
  const chartData: { day: string; date: string; bankroll: number; dailyProfit: number; formattedProfit: string }[] = [];

  dailySummaries.forEach((d) => {
    // Add deposits/withdrawals for this day
    const dayTrans = transactions.filter((t) => t.date === d.date);
    dayTrans.forEach((t) => {
      if (t.type === 'DEPOSIT') runningBankroll += t.amount;
      if (t.type === 'WITHDRAWAL') runningBankroll -= t.amount;
    });

    runningBankroll += d.financialResult;

    chartData.push({
      day: `Dia ${String(d.dayNumber).padStart(2, '0')}`,
      date: d.date,
      bankroll: Number(runningBankroll.toFixed(2)),
      dailyProfit: d.financialResult,
      formattedProfit: d.financialResult >= 0 ? `+R$ ${d.financialResult.toFixed(2)}` : `-R$ ${Math.abs(d.financialResult).toFixed(2)}`,
    });
  });

  return chartData;
}

/**
 * Calculates Forex Lot Size, Margin, Pip Value and Risk/Reward parameters
 */
export function calculateForexLotSize({
  bankroll,
  riskAmount,
  stopLossPips,
  takeProfitPips,
  asset = 'EUR/USD',
  leverage = 100,
  currentPrice = 1.085,
}: {
  bankroll: number;
  riskAmount: number;
  stopLossPips: number;
  takeProfitPips: number;
  asset?: string;
  leverage?: number;
  currentPrice?: number;
}): ForexCalculationResult {
  const safeBankroll = Math.max(1, bankroll);
  const safeRisk = Math.max(0.1, riskAmount);
  const safeStop = Math.max(1, stopLossPips);
  const safeTp = Math.max(1, takeProfitPips);
  const isGold = asset.toUpperCase().includes('XAU') || asset.toUpperCase().includes('GOLD');
  const isJpy = asset.toUpperCase().includes('JPY');

  // Pip value for 1 standard lot (100,000 units for currencies, 100 oz for Gold)
  let pipValuePerLot = 10; // default for USD quote pairs (EUR/USD, GBP/USD, etc.)
  if (isJpy && currentPrice > 0) {
    pipValuePerLot = Number(((100000 * 0.01) / currentPrice).toFixed(2));
  } else if (isGold) {
    pipValuePerLot = 10; // $10 per 0.10 move on 100 oz lot
  }

  // Calculated standard lot: Risk / (Stop Pips * Pip Value per Standard Lot)
  const rawLots = safeRisk / (safeStop * pipValuePerLot);
  const lotSize = Number(Math.max(0.01, rawLots).toFixed(2));
  const miniLots = Number((lotSize * 10).toFixed(1));
  const microLots = Number((lotSize * 100).toFixed(0));

  const contractUnits = isGold ? 100 : 100000;
  const units = Math.round(lotSize * contractUnits);
  const pipValueTotal = Number((lotSize * pipValuePerLot).toFixed(2));

  const actualRisk = Number((safeStop * pipValueTotal).toFixed(2));
  const riskPercent = Number(((actualRisk / safeBankroll) * 100).toFixed(2));

  const rewardAmount = Number((safeTp * pipValueTotal).toFixed(2));
  const rewardPercent = Number(((rewardAmount / safeBankroll) * 100).toFixed(2));

  const riskRewardRatio = Number((safeTp / safeStop).toFixed(2));

  // Required Margin = (Units * Price) / Leverage
  const notionalValue = units * (currentPrice > 0 ? currentPrice : 1);
  const requiredMargin = Number((notionalValue / (leverage > 0 ? leverage : 100)).toFixed(2));
  const effectiveLeverage = Number((notionalValue / safeBankroll).toFixed(1));

  return {
    lotSize,
    miniLots,
    microLots,
    units,
    pipValuePerLot,
    pipValueTotal,
    stopLossPips: safeStop,
    takeProfitPips: safeTp,
    riskAmount: actualRisk,
    riskPercent,
    rewardAmount,
    rewardPercent,
    riskRewardRatio,
    requiredMargin,
    effectiveLeverage,
  };
}

/**
 * Calculates B3 Position Sizing (Mini Índice, Mini Dólar, Ações)
 */
export function calculateB3Contracts({
  bankroll,
  riskAmount,
  stopLossPoints,
  takeProfitPoints,
  instrumentType = 'WIN',
  brokerMarginPerContract = 100,
}: {
  bankroll: number;
  riskAmount: number;
  stopLossPoints: number;
  takeProfitPoints: number;
  instrumentType?: 'WIN' | 'WDO' | 'STOCKS' | 'WSP';
  brokerMarginPerContract?: number;
}): B3CalculationResult {
  const safeBankroll = Math.max(1, bankroll);
  const safeRisk = Math.max(1, riskAmount);
  const safeStop = Math.max(0.01, stopLossPoints);
  const safeTp = Math.max(0.01, takeProfitPoints);

  // Point value per 1 contract or 1 share:
  let pointValue = 0.2; // WIN default: R$ 0,20 por ponto
  if (instrumentType === 'WDO') {
    pointValue = 10.0; // WDO: R$ 10,00 por ponto (R$ 5,00 cada 0.5 ponto)
  } else if (instrumentType === 'STOCKS') {
    pointValue = 1.0; // R$ 1,00 por variação de R$ 1,00 por ação
  } else if (instrumentType === 'WSP') {
    pointValue = 13.0; // Micro S&P Futuro
  }

  // Max contracts: Risk / (Stop Points * Point Value)
  const rawContracts = Math.floor(safeRisk / (safeStop * pointValue));
  const contracts = Math.max(1, rawContracts);

  const pointValueTotal = Number((contracts * pointValue).toFixed(2));
  const actualRisk = Number((contracts * safeStop * pointValue).toFixed(2));
  const riskPercent = Number(((actualRisk / safeBankroll) * 100).toFixed(2));

  const rewardAmount = Number((contracts * safeTp * pointValue).toFixed(2));
  const rewardPercent = Number(((rewardAmount / safeBankroll) * 100).toFixed(2));

  const riskRewardRatio = Number((safeTp / safeStop).toFixed(2));
  const requiredMargin = Number((contracts * (brokerMarginPerContract || 100)).toFixed(2));

  return {
    contracts,
    pointValueTotal,
    stopLossPoints: safeStop,
    takeProfitPoints: safeTp,
    riskAmount: actualRisk,
    riskPercent,
    rewardAmount,
    rewardPercent,
    riskRewardRatio,
    requiredMargin,
    instrumentType,
  };
}

/**
 * Calculates Crypto Position Size, Isolated Margin, Liquidation & Risk Parameters
 */
export function calculateCryptoPosition({
  bankroll,
  riskAmount,
  entryPrice,
  stopLossPrice,
  takeProfitPrice,
  leverage = 20,
  direction = 'LONG',
}: {
  bankroll: number;
  riskAmount: number;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  leverage?: number;
  direction?: 'LONG' | 'SHORT';
}): CryptoCalculationResult {
  const safeBankroll = Math.max(1, bankroll);
  const safeRisk = Math.max(0.1, riskAmount);
  const safeEntry = Math.max(0.000001, entryPrice);
  const safeLev = Math.max(1, Math.min(125, leverage));

  // Calculate stop difference based on direction
  let stopDiff = Math.abs(safeEntry - stopLossPrice);
  if (stopDiff <= 0) stopDiff = safeEntry * 0.02; // fallback 2%

  const priceStopPercent = Number(((stopDiff / safeEntry) * 100).toFixed(2));
  const targetDiff = Math.abs(takeProfitPrice - safeEntry);
  const priceTargetPercent = Number(((targetDiff / safeEntry) * 100).toFixed(2));

  // Position Size (Notional USD) = Risk / Stop %
  const positionSizeUsd = Number((safeRisk / (stopDiff / safeEntry)).toFixed(2));
  const coinAmount = Number((positionSizeUsd / safeEntry).toFixed(6));
  const isolatedMargin = Number((positionSizeUsd / safeLev).toFixed(2));

  const rewardAmount = Number((coinAmount * targetDiff).toFixed(2));
  const riskPercent = Number(((safeRisk / safeBankroll) * 100).toFixed(2));
  const rewardPercent = Number(((rewardAmount / safeBankroll) * 100).toFixed(2));

  const riskRewardRatio = Number((targetDiff / stopDiff).toFixed(2));
  const roiOnMarginPercent = isolatedMargin > 0 ? Number(((rewardAmount / isolatedMargin) * 100).toFixed(1)) : 0;

  // Estimated Liquidation Price with maintenance margin ~0.5%
  const maintMarginRate = 0.005;
  let estimatedLiquidationPrice = 0;
  let isLiquidationBeforeStop = false;

  if (direction === 'LONG') {
    estimatedLiquidationPrice = Number(
      (safeEntry * (1 - 1 / safeLev + maintMarginRate)).toFixed(safeEntry < 1 ? 4 : 2)
    );
    if (stopLossPrice <= estimatedLiquidationPrice) {
      isLiquidationBeforeStop = true;
    }
  } else {
    estimatedLiquidationPrice = Number(
      (safeEntry * (1 + 1 / safeLev - maintMarginRate)).toFixed(safeEntry < 1 ? 4 : 2)
    );
    if (stopLossPrice >= estimatedLiquidationPrice) {
      isLiquidationBeforeStop = true;
    }
  }

  return {
    positionSizeUsd,
    coinAmount,
    isolatedMargin,
    riskAmount: Number(safeRisk.toFixed(2)),
    riskPercent,
    rewardAmount,
    rewardPercent,
    riskRewardRatio,
    estimatedLiquidationPrice,
    isLiquidationBeforeStop,
    roiOnMarginPercent,
    priceStopPercent,
    priceTargetPercent,
  };
}
