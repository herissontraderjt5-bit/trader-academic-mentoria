import { Candle, TechnicalIndicators } from "../../../types";

export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];
  const k = 2 / (period + 1);
  const emaArray: number[] = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    const ema = prices[i] * k + emaArray[i - 1] * (1 - k);
    emaArray.push(ema);
  }
  return emaArray;
}

export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return +(sum / period).toFixed(2);
}

export function calculateRSI(candles: Candle[], period = 14): number {
  if (candles.length <= period) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);
  return +rsi.toFixed(2);
}

export function calculateBollingerBands(candles: Candle[], period = 20, multiplier = 2) {
  if (candles.length < period) {
    const last = candles[candles.length - 1]?.close || 0;
    return { upper: last * 1.01, middle: last, lower: last * 0.99 };
  }

  const closes = candles.slice(-period).map((c) => c.close);
  const mean = closes.reduce((a, b) => a + b, 0) / period;
  const variance = closes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: +(mean + stdDev * multiplier).toFixed(2),
    middle: +mean.toFixed(2),
    lower: +(mean - stdDev * multiplier).toFixed(2),
  };
}

export function calculateMACD(candles: Candle[]) {
  const closes = candles.map((c) => c.close);
  if (closes.length < 26) {
    return { line: 0, signal: 0, hist: 0 };
  }

  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);

  const macdLineArr: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    macdLineArr.push(ema12[i] - ema26[i]);
  }

  const signalLineArr = calculateEMA(macdLineArr, 9);
  const line = +(macdLineArr[macdLineArr.length - 1] || 0).toFixed(4);
  const signal = +(signalLineArr[signalLineArr.length - 1] || 0).toFixed(4);
  const hist = +(line - signal).toFixed(4);

  return { line, signal, hist };
}

export function calculateStochastic(candles: Candle[], period = 14) {
  if (candles.length < period) return { k: 50, d: 50 };
  const slice = candles.slice(-period);
  const currentClose = slice[slice.length - 1].close;
  const lowestLow = Math.min(...slice.map((c) => c.low));
  const highestHigh = Math.max(...slice.map((c) => c.high));

  if (highestHigh === lowestLow) return { k: 50, d: 50 };
  const k = +(((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100).toFixed(2);
  const d = k; // simplified last D
  return { k, d };
}

export function detectCandlestickPattern(candles: Candle[]): string {
  if (candles.length < 3) return "Acumulação Neutra";

  const c3 = candles[candles.length - 1]; // current/latest closed
  const c2 = candles[candles.length - 2];
  const c1 = candles[candles.length - 3];

  const body3 = Math.abs(c3.close - c3.open);
  const range3 = c3.high - c3.low || 0.0001;
  const isBull3 = c3.close > c3.open;
  const isBear3 = c3.close < c3.open;

  const upperWick3 = c3.high - Math.max(c3.open, c3.close);
  const lowerWick3 = Math.min(c3.open, c3.close) - c3.low;

  // Pinbar / Hammer
  if (lowerWick3 >= body3 * 2 && upperWick3 <= body3 * 0.5) {
    return isBull3 ? "Martelo / Pinbar Bullish de Rejeição" : "Martelo de Alta";
  }

  // Shooting Star / Inverted Hammer
  if (upperWick3 >= body3 * 2 && lowerWick3 <= body3 * 0.5) {
    return isBear3 ? "Estrela Cadente (Shooting Star Bearish)" : "Martelo Invertido";
  }

  // Doji
  if (body3 <= range3 * 0.1) {
    if (lowerWick3 > range3 * 0.6) return "Dragonfly Doji (Rejeição de Fundo)";
    if (upperWick3 > range3 * 0.6) return "Gravestone Doji (Rejeição de Topo)";
    return "Doji de Indecisão";
  }

  // Bullish Engulfing
  if (c2.close < c2.open && c3.close > c3.open && c3.open <= c2.close && c3.close >= c2.open) {
    return "Engolfo de Alta (Bullish Engulfing)";
  }

  // Bearish Engulfing
  if (c2.close > c2.open && c3.close < c3.open && c3.open >= c2.close && c3.close <= c2.open) {
    return "Engolfo de Baixa (Bearish Engulfing)";
  }

  // Morning Star
  if (c1.close < c1.open && Math.abs(c2.close - c2.open) < (c1.high - c1.low) * 0.3 && c3.close > c3.open && c3.close > (c1.open + c1.close) / 2) {
    return "Estrela da Manhã (Reversão de Alta)";
  }

  // Evening Star
  if (c1.close > c1.open && Math.abs(c2.close - c2.open) < (c1.high - c1.low) * 0.3 && c3.close < c3.open && c3.close < (c1.open + c1.close) / 2) {
    return "Estrela da Noite (Reversão de Baixa)";
  }

  // Marubozu
  if (body3 > range3 * 0.85) {
    return isBull3 ? "Marubozu de Alta (Força Compradora Extrema)" : "Marubozu de Baixa (Força Vendedora Extrema)";
  }

  return "Vela de Continuidade";
}

export function calculateAllIndicators(candles: Candle[]): TechnicalIndicators {
  if (candles.length === 0) {
    return {
      rsi: 50,
      rsiStatus: "Neutro",
      macdLine: 0,
      macdSignal: 0,
      macdHist: 0,
      stochK: 50,
      stochD: 50,
      ema9: 0,
      ema20: 0,
      sma50: 0,
      bollingerUpper: 0,
      bollingerMiddle: 0,
      bollingerLower: 0,
      support: 0,
      resistance: 0,
      candlestickPattern: "Sem dados",
      trend: "LATERAL",
    };
  }

  const closes = candles.map((c) => c.close);
  const rsi = calculateRSI(candles, 14);
  const macd = calculateMACD(candles);
  const stoch = calculateStochastic(candles, 14);
  const bb = calculateBollingerBands(candles, 20, 2);

  const ema9Arr = calculateEMA(closes, 9);
  const ema20Arr = calculateEMA(closes, 20);
  const ema9 = +(ema9Arr[ema9Arr.length - 1] || 0).toFixed(2);
  const ema20 = +(ema20Arr[ema20Arr.length - 1] || 0).toFixed(2);
  const sma50 = calculateSMA(closes, Math.min(closes.length, 50));

  const recentLows = candles.slice(-20).map((c) => c.low);
  const recentHighs = candles.slice(-20).map((c) => c.high);
  const support = +Math.min(...recentLows).toFixed(2);
  const resistance = +Math.max(...recentHighs).toFixed(2);

  const pattern = detectCandlestickPattern(candles);

  const rsiStatus = rsi >= 70 ? "Sobrecompra" : rsi <= 30 ? "Sobrevenda" : "Neutro";

  let trend: "ALTA" | "BAIXA" | "LATERAL" = "LATERAL";
  if (ema9 > ema20 && closes[closes.length - 1] > ema9) {
    trend = "ALTA";
  } else if (ema9 < ema20 && closes[closes.length - 1] < ema9) {
    trend = "BAIXA";
  }

  return {
    rsi,
    rsiStatus,
    macdLine: macd.line,
    macdSignal: macd.signal,
    macdHist: macd.hist,
    stochK: stoch.k,
    stochD: stoch.d,
    ema9,
    ema20,
    sma50,
    bollingerUpper: bb.upper,
    bollingerMiddle: bb.middle,
    bollingerLower: bb.lower,
    support,
    resistance,
    candlestickPattern: pattern,
    trend,
  };
}
