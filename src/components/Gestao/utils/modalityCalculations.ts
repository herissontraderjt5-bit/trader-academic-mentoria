import {
  Operation,
  TradingModality,
  DailySummary,
  ModalityAnalytics,
  DailyOperationalTime,
} from '../types';

/**
 * Accurately determines the modality of an operation if not explicitly tagged
 */
export function getOperationModality(op: Operation): 'BINARIAS' | 'FOREX' | 'B3' | 'CRIPTO' {
  if (op.modality) return op.modality;

  const asset = (op.asset || '').toUpperCase();
  const notes = (op.notes || '').toUpperCase();
  const strategy = (op.strategy || '').toUpperCase();

  // Check B3 indicators
  if (
    asset.startsWith('WIN') ||
    asset.startsWith('WDO') ||
    asset.startsWith('WSP') ||
    asset.startsWith('PETR') ||
    asset.startsWith('VALE') ||
    asset.startsWith('ITUB') ||
    asset.startsWith('BBDC') ||
    notes.includes('[B3]') ||
    notes.includes('MINI ÍNDICE') ||
    notes.includes('MINI DÓLAR') ||
    strategy.includes('B3')
  ) {
    return 'B3';
  }

  // Check Crypto indicators
  if (
    asset.includes('USDT') ||
    asset.includes('BTC') ||
    asset.includes('ETH') ||
    asset.includes('SOL') ||
    asset.includes('BNB') ||
    asset.includes('XRP') ||
    asset.includes('DOGE') ||
    asset.includes('AVAX') ||
    notes.includes('[CRIPTO]') ||
    notes.includes('FUTUROS') ||
    notes.includes('LONG') ||
    notes.includes('SHORT') ||
    strategy.includes('CRIPTO')
  ) {
    return 'CRIPTO';
  }

  // Check Forex indicators
  if (
    asset.includes('XAU/USD') ||
    asset.includes('XAG/USD') ||
    asset.includes('US30') ||
    asset.includes('NAS100') ||
    asset.includes('GER40') ||
    notes.includes('[FOREX]') ||
    notes.includes('PIPS') ||
    notes.includes('LOTES') ||
    strategy.includes('FOREX')
  ) {
    return 'FOREX';
  }

  // Standard binary pairs / binary default
  return 'BINARIAS';
}

/**
 * Filter operations based on the active selected modality
 */
export function filterOperationsByModality(
  ops: Operation[],
  modality: TradingModality
): Operation[] {
  if (modality === 'ALL') return ops;
  return ops.filter((op) => getOperationModality(op) === modality);
}

/**
 * Calculates deep-dive analytical metrics for the chosen modality
 */
export function calculateModalityAnalytics(
  monthOps: Operation[],
  modality: TradingModality
): ModalityAnalytics {
  const filteredOps = filterOperationsByModality(monthOps, modality);
  const wins = filteredOps.filter((o) => o.result === 'WIN').length;
  const losses = filteredOps.filter((o) => o.result === 'LOSS').length;
  const empates = filteredOps.filter((o) => o.result === 'EMPATE').length;
  const decisive = wins + losses;
  const winRate = decisive > 0 ? Number(((wins / decisive) * 100).toFixed(1)) : 0;

  const netProfit = Number(
    filteredOps.reduce((acc, curr) => acc + curr.profit, 0).toFixed(2)
  );

  const grossProfit = filteredOps
    .filter((o) => o.profit > 0)
    .reduce((acc, curr) => acc + curr.profit, 0);
  const grossLoss = Math.abs(
    filteredOps
      .filter((o) => o.profit < 0)
      .reduce((acc, curr) => acc + curr.profit, 0)
  );
  const profitFactor = grossLoss > 0
    ? Number((grossProfit / grossLoss).toFixed(2))
    : grossProfit > 0
    ? 99.9
    : 0;

  const uniqueDays = new Set(filteredOps.map((o) => o.date)).size;

  const analytics: ModalityAnalytics = {
    modality,
    totalOperations: filteredOps.length,
    wins,
    losses,
    empates,
    winRate,
    netProfit,
    profitFactor,
    operatedDaysCount: uniqueDays,
  };

  // 1. Binárias specifics
  if (modality === 'BINARIAS' || modality === 'ALL') {
    const binaryOps = filteredOps.filter((o) => getOperationModality(o) === 'BINARIAS');
    if (binaryOps.length > 0) {
      const avgPayout = Math.round(
        binaryOps.reduce((acc, curr) => acc + (curr.payout || 85), 0) / binaryOps.length
      );
      const otcOps = binaryOps.filter((o) => o.marketType === 'OTC');
      const openOps = binaryOps.filter((o) => o.marketType === 'ABERTO');

      const otcWins = otcOps.filter((o) => o.result === 'WIN').length;
      const otcDecisive = otcWins + otcOps.filter((o) => o.result === 'LOSS').length;
      const otcRate = otcDecisive > 0 ? Number(((otcWins / otcDecisive) * 100).toFixed(1)) : 0;

      const openWins = openOps.filter((o) => o.result === 'WIN').length;
      const openDecisive = openWins + openOps.filter((o) => o.result === 'LOSS').length;
      const openRate = openDecisive > 0 ? Number(((openWins / openDecisive) * 100).toFixed(1)) : 0;

      const m1Count = binaryOps.filter((o) => o.expiration === 'M1').length;
      const m5Count = binaryOps.filter((o) => o.expiration === 'M5').length;
      const m15Count = binaryOps.filter((o) => o.expiration === 'M15').length;
      const otherCount = binaryOps.length - m1Count - m5Count - m15Count;

      analytics.binaryAvgPayout = avgPayout;
      analytics.binaryOtcWinRate = otcRate;
      analytics.binaryOpenWinRate = openRate;
      analytics.binaryTimeframeBreakdown = {
        M1: m1Count,
        M5: m5Count,
        M15: m15Count,
        other: otherCount,
      };
    }
  }

  // 2. Forex specifics
  if (modality === 'FOREX' || modality === 'ALL') {
    const forexOps = filteredOps.filter((o) => getOperationModality(o) === 'FOREX');
    if (forexOps.length > 0) {
      let totalPips = 0;
      let totalLots = 0;
      let sumRR = 0;
      let rrCount = 0;

      const pairMap: Record<string, { pips: number; profit: number; trades: number }> = {};

      forexOps.forEach((op) => {
        // Fallback pips calculation if not explicitly set
        let opPips = op.pips;
        if (opPips === undefined) {
          opPips = op.result === 'WIN' ? 35 : op.result === 'LOSS' ? -15 : 0;
        }
        totalPips += opPips;

        const lots = op.lotSize || (op.investment ? Number((op.investment / 100).toFixed(2)) : 0.1);
        totalLots += lots;

        const rr = op.riskRewardRatio || (op.result === 'WIN' ? 2.2 : 1.0);
        sumRR += rr;
        rrCount++;

        const asset = op.asset || 'EUR/USD';
        if (!pairMap[asset]) {
          pairMap[asset] = { pips: 0, profit: 0, trades: 0 };
        }
        pairMap[asset].pips += opPips;
        pairMap[asset].profit += op.profit;
        pairMap[asset].trades++;
      });

      analytics.forexTotalPips = Math.round(totalPips);
      analytics.forexTotalLots = Number(totalLots.toFixed(2));
      analytics.forexAvgRiskReward = rrCount > 0 ? Number((sumRR / rrCount).toFixed(2)) : 2.0;

      analytics.forexPairsBreakdown = Object.entries(pairMap)
        .map(([pair, stats]) => ({
          pair,
          pips: Math.round(stats.pips),
          profit: Number(stats.profit.toFixed(2)),
          trades: stats.trades,
        }))
        .sort((a, b) => b.profit - a.profit);
    }
  }

  // 3. B3 specifics
  if (modality === 'B3' || modality === 'ALL') {
    const b3Ops = filteredOps.filter((o) => getOperationModality(o) === 'B3');
    if (b3Ops.length > 0) {
      let winPoints = 0;
      let wdoPoints = 0;
      let totalContracts = 0;

      b3Ops.forEach((op) => {
        const asset = (op.asset || '').toUpperCase();
        const contracts = op.contracts || 1;
        totalContracts += contracts;

        if (asset.includes('WIN') || asset.includes('ÍNDICE') || op.b3Type === 'WIN') {
          const pts = op.points !== undefined ? op.points : op.result === 'WIN' ? 250 : op.result === 'LOSS' ? -120 : 0;
          winPoints += pts;
        } else if (asset.includes('WDO') || asset.includes('DÓLAR') || op.b3Type === 'WDO') {
          const pts = op.points !== undefined ? op.points : op.result === 'WIN' ? 6.5 : op.result === 'LOSS' ? -3.0 : 0;
          wdoPoints += pts;
        }
      });

      analytics.b3TotalWinPoints = winPoints;
      analytics.b3TotalWdoPoints = Number(wdoPoints.toFixed(1));
      analytics.b3TotalContracts = totalContracts;
      analytics.b3ProfitPerContract = totalContracts > 0
        ? Number((netProfit / totalContracts).toFixed(2))
        : 0;
    }
  }

  // 4. Crypto specifics
  if (modality === 'CRIPTO' || modality === 'ALL') {
    const cryptoOps = filteredOps.filter((o) => getOperationModality(o) === 'CRIPTO');
    if (cryptoOps.length > 0) {
      let totalRoi = 0;
      let totalLev = 0;
      let longWins = 0;
      let longDecisive = 0;
      let shortWins = 0;
      let shortDecisive = 0;

      const coinMap: Record<string, { profit: number; roi: number; trades: number }> = {};

      cryptoOps.forEach((op) => {
        const roi = op.roiPercent !== undefined ? op.roiPercent : op.result === 'WIN' ? 28 : op.result === 'LOSS' ? -10 : 0;
        totalRoi += roi;

        const lev = op.leverage || 10;
        totalLev += lev;

        const isLong = op.cryptoPosition === 'LONG' || op.direction === 'CALL';
        if (isLong) {
          if (op.result === 'WIN') longWins++;
          if (op.result === 'WIN' || op.result === 'LOSS') longDecisive++;
        } else {
          if (op.result === 'WIN') shortWins++;
          if (op.result === 'WIN' || op.result === 'LOSS') shortDecisive++;
        }

        const coin = op.asset || 'BTC/USDT';
        if (!coinMap[coin]) {
          coinMap[coin] = { profit: 0, roi: 0, trades: 0 };
        }
        coinMap[coin].profit += op.profit;
        coinMap[coin].roi += roi;
        coinMap[coin].trades++;
      });

      analytics.cryptoAvgRoi = Number((totalRoi / cryptoOps.length).toFixed(1));
      analytics.cryptoAvgLeverage = Math.round(totalLev / cryptoOps.length);
      analytics.cryptoLongsWinRate = longDecisive > 0 ? Number(((longWins / longDecisive) * 100).toFixed(1)) : 0;
      analytics.cryptoShortsWinRate = shortDecisive > 0 ? Number(((shortWins / shortDecisive) * 100).toFixed(1)) : 0;

      analytics.cryptoCoinsBreakdown = Object.entries(coinMap)
        .map(([coin, stats]) => ({
          coin,
          profit: Number(stats.profit.toFixed(2)),
          roi: Number((stats.roi / stats.trades).toFixed(1)),
          trades: stats.trades,
        }))
        .sort((a, b) => b.profit - a.profit);
    }
  }

  // 5. Consolidated Multi-Market Share
  if (modality === 'ALL') {
    const binOps = monthOps.filter((o) => getOperationModality(o) === 'BINARIAS');
    const fxOps = monthOps.filter((o) => getOperationModality(o) === 'FOREX');
    const b3Ops = monthOps.filter((o) => getOperationModality(o) === 'B3');
    const crpOps = monthOps.filter((o) => getOperationModality(o) === 'CRIPTO');

    analytics.marketShareProfit = {
      binarias: Number(binOps.reduce((acc, c) => acc + c.profit, 0).toFixed(2)),
      forex: Number(fxOps.reduce((acc, c) => acc + c.profit, 0).toFixed(2)),
      b3: Number(b3Ops.reduce((acc, c) => acc + c.profit, 0).toFixed(2)),
      crypto: Number(crpOps.reduce((acc, c) => acc + c.profit, 0).toFixed(2)),
    };
  }

  return analytics;
}

/**
 * Builds the Calendar Day table enriched with Modality-Specific KPIs for every single day
 */
export function buildModalityManagementTable(
  monthId: string,
  operations: Operation[],
  timeLogs: DailyOperationalTime[],
  selectedModality: TradingModality
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

    // Operations for this date
    const allDayOps = operations.filter((op) => op.date === dateStr);
    const dayOps = filterOperationsByModality(allDayOps, selectedModality);
    const dayTime = timeLogs.find((tl) => tl.date === dateStr)?.seconds || 0;

    let wins = 0;
    let losses = 0;
    let empates = 0;
    let financialResult = 0;
    let payoutSum = 0;
    const assetFreq: Record<string, number> = {};

    // Modality-specific accumulators
    const modalitiesSet = new Set<'BINARIAS' | 'FOREX' | 'B3' | 'CRIPTO'>();
    let dayPips = 0;
    let dayLots = 0;
    let dayRRSum = 0;
    let dayRRCount = 0;
    let dayWinPts = 0;
    let dayWdoPts = 0;
    let dayContracts = 0;
    let dayRoiSum = 0;
    let dayCryptoCount = 0;
    let dayLongs = 0;
    let dayShorts = 0;

    // Track present modalities from all operations on this day (for ALL view badges)
    allDayOps.forEach((op) => {
      modalitiesSet.add(getOperationModality(op));
    });

    dayOps.forEach((op) => {
      financialResult += op.profit;
      payoutSum += op.payout || 85;
      assetFreq[op.asset] = (assetFreq[op.asset] || 0) + 1;
      if (op.result === 'WIN') wins++;
      else if (op.result === 'LOSS') losses++;
      else empates++;

      const mod = getOperationModality(op);

      if (mod === 'FOREX') {
        const pips = op.pips !== undefined ? op.pips : op.result === 'WIN' ? 35 : op.result === 'LOSS' ? -15 : 0;
        dayPips += pips;
        dayLots += op.lotSize || 0.1;
        dayRRSum += op.riskRewardRatio || (op.result === 'WIN' ? 2.2 : 1.0);
        dayRRCount++;
      } else if (mod === 'B3') {
        const asset = (op.asset || '').toUpperCase();
        dayContracts += op.contracts || 1;
        if (asset.includes('WIN') || asset.includes('ÍNDICE') || op.b3Type === 'WIN') {
          dayWinPts += op.points !== undefined ? op.points : op.result === 'WIN' ? 250 : op.result === 'LOSS' ? -120 : 0;
        } else if (asset.includes('WDO') || asset.includes('DÓLAR') || op.b3Type === 'WDO') {
          dayWdoPts += op.points !== undefined ? op.points : op.result === 'WIN' ? 6.5 : op.result === 'LOSS' ? -3.0 : 0;
        }
      } else if (mod === 'CRIPTO') {
        const roi = op.roiPercent !== undefined ? op.roiPercent : op.result === 'WIN' ? 28 : op.result === 'LOSS' ? -10 : 0;
        dayRoiSum += roi;
        dayCryptoCount++;
        if (op.cryptoPosition === 'LONG' || op.direction === 'CALL') {
          dayLongs++;
        } else {
          dayShorts++;
        }
      }
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

      modalitiesPresent: Array.from(modalitiesSet),
      forexPips: dayPips,
      forexLots: Number(dayLots.toFixed(2)),
      forexAvgRiskReward: dayRRCount > 0 ? Number((dayRRSum / dayRRCount).toFixed(2)) : undefined,
      b3WinPoints: dayWinPts,
      b3WdoPoints: Number(dayWdoPts.toFixed(1)),
      b3Contracts: dayContracts,
      cryptoRoiAvg: dayCryptoCount > 0 ? Number((dayRoiSum / dayCryptoCount).toFixed(1)) : undefined,
      cryptoLongCount: dayLongs,
      cryptoShortCount: dayShorts,
    });
  }

  return result;
}
