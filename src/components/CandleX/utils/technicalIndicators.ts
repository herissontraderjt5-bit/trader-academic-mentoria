import { Candle, TechnicalIndicators } from "../../../types";

// Exchange Server Time Synchronizer (NTP/TradingView/Binance clock sync)
let serverOffsetMs = 0;
let isSyncing = false;
let lastSyncTime = 0;

export async function syncExchangeTime(): Promise<number> {
  if (isSyncing) return serverOffsetMs;
  isSyncing = true;
  
  const sources = [
    "https://api.binance.com/api/v3/time",
    "https://data-api.binance.vision/api/v3/time",
    "https://api.bybit.com/v5/market/time"
  ];

  for (const url of sources) {
    try {
      const t0 = performance.now();
      const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
      const t1 = performance.now();
      const latency = (t1 - t0) / 2;

      if (res.ok) {
        const data = await res.json();
        let serverTimestamp = 0;
        if (data.serverTime) {
          serverTimestamp = typeof data.serverTime === "number" ? data.serverTime : parseInt(data.serverTime, 10);
        } else if (data.result?.timeNano) {
          serverTimestamp = Math.floor(parseInt(data.result.timeNano, 10) / 1000000);
        } else if (data.result?.timeSecond) {
          serverTimestamp = parseInt(data.result.timeSecond, 10) * 1000;
        }

        if (serverTimestamp > 0) {
          const estimatedServerNow = serverTimestamp + latency;
          serverOffsetMs = estimatedServerNow - Date.now();
          lastSyncTime = Date.now();
          break;
        }
      }
    } catch {
      // Continue to next source
    }
  }

  isSyncing = false;
  return serverOffsetMs;
}

// Auto-sync on client initialization and periodically every 20 seconds
if (typeof window !== "undefined") {
  syncExchangeTime();
  setInterval(() => {
    if (Date.now() - lastSyncTime > 20000) {
      syncExchangeTime();
    }
  }, 20000);
}

export function getSynchronizedDate(): Date {
  return new Date(Date.now() + serverOffsetMs);
}

export function getSynchronizedTimestamp(): number {
  return Date.now() + serverOffsetMs;
}

export function getCandleTimeRemaining(customDate?: Date, timeframe: string = "1m"): {
  remainingSeconds: number;
  formatted: string;
  candleLengthMs: number;
  elapsedSeconds: number;
  synchronizedDate: Date;
} {
  const now = customDate || getSynchronizedDate();
  const tf = (timeframe || "1m").toLowerCase();
  const seconds = now.getSeconds();
  const milliseconds = now.getMilliseconds();
  const totalSecondsOfCurrentMinute = seconds + milliseconds / 1000;

  let candleLengthMs = 60 * 1000;
  let elapsedSeconds = totalSecondsOfCurrentMinute;
  let totalRemaining = 60 - totalSecondsOfCurrentMinute;

  if (tf.includes("5m") || tf === "5" || tf === "m5") {
    candleLengthMs = 300 * 1000;
    const minutes = now.getMinutes();
    elapsedSeconds = (minutes % 5) * 60 + totalSecondsOfCurrentMinute;
    totalRemaining = 300 - elapsedSeconds;
  } else if (tf.includes("2m") || tf === "2" || tf === "m2") {
    candleLengthMs = 120 * 1000;
    const minutes = now.getMinutes();
    elapsedSeconds = (minutes % 2) * 60 + totalSecondsOfCurrentMinute;
    totalRemaining = 120 - elapsedSeconds;
  } else if (tf.includes("15m") || tf === "15" || tf === "m15") {
    candleLengthMs = 900 * 1000;
    const minutes = now.getMinutes();
    elapsedSeconds = (minutes % 15) * 60 + totalSecondsOfCurrentMinute;
    totalRemaining = 900 - elapsedSeconds;
  }

  const remainingSeconds = Math.max(0, Math.ceil(totalRemaining));
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;

  return {
    remainingSeconds,
    formatted: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
    candleLengthMs,
    elapsedSeconds,
    synchronizedDate: now,
  };
}

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

// 1. RSI (Relative Strength Index)
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

// 2. Bollinger Bands
export function calculateBollingerBands(candles: Candle[], period = 20, multiplier = 2) {
  if (candles.length < period) {
    const last = candles[candles.length - 1]?.close || 0;
    return { upper: last * 1.005, middle: last, lower: last * 0.995 };
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

// 3. MACD
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

// 4. Stochastic
export function calculateStochastic(candles: Candle[], period = 14) {
  if (candles.length < period) return { k: 50, d: 50 };
  const slice = candles.slice(-period);
  const currentClose = slice[slice.length - 1].close;
  const lowestLow = Math.min(...slice.map((c) => c.low));
  const highestHigh = Math.max(...slice.map((c) => c.high));

  if (highestHigh === lowestLow) return { k: 50, d: 50 };
  const k = +(((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100).toFixed(2);
  const d = k;
  return { k, d };
}

// 5. ATR (Average True Range)
export function calculateATR(candles: Candle[], period = 14): number {
  if (candles.length < 2) return (candles[0]?.close || 100) * 0.002;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      c.high - c.low,
      Math.abs(c.high - prev.close),
      Math.abs(c.low - prev.close)
    );
    trs.push(tr);
  }
  const slice = trs.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return +(sum / Math.max(1, slice.length)).toFixed(4);
}

// 6. ADX (Average Directional Index)
export function calculateADX(candles: Candle[], period = 14): number {
  if (candles.length < period * 2) return 28.5; // Baseline healthy trend strength
  let plusDM = 0;
  let minusDM = 0;
  let trSum = 0;

  for (let i = candles.length - period; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const highDiff = curr.high - prev.high;
    const lowDiff = prev.low - curr.low;

    if (highDiff > lowDiff && highDiff > 0) plusDM += highDiff;
    if (lowDiff > highDiff && lowDiff > 0) minusDM += lowDiff;

    const tr = Math.max(curr.high - curr.low, Math.abs(curr.high - prev.close), Math.abs(curr.low - prev.close));
    trSum += tr;
  }

  if (trSum === 0) return 25;
  const plusDI = (plusDM / trSum) * 100;
  const minusDI = (minusDM / trSum) * 100;
  const diSum = plusDI + minusDI;
  if (diSum === 0) return 25;
  const dx = (Math.abs(plusDI - minusDI) / diSum) * 100;
  return +dx.toFixed(2);
}

// 7. Volume Delta & VSA
export function calculateVolumeDelta(candles: Candle[]): number {
  if (candles.length < 5) return 0;
  let buyVol = 0;
  let sellVol = 0;

  const recent = candles.slice(-5);
  for (const c of recent) {
    const range = c.high - c.low || 0.0001;
    const isBull = c.close >= c.open;
    const body = Math.abs(c.close - c.open);
    const ratio = body / range;

    if (isBull) {
      buyVol += c.volume * (0.5 + ratio * 0.5);
      sellVol += c.volume * (0.5 - ratio * 0.5);
    } else {
      sellVol += c.volume * (0.5 + ratio * 0.5);
      buyVol += c.volume * (0.5 - ratio * 0.5);
    }
  }

  const total = buyVol + sellVol;
  if (total === 0) return 0;
  return +(((buyVol - sellVol) / total) * 100).toFixed(2);
}

// 8. SMC Order Block Detection
export function detectOrderBlock(candles: Candle[]): { type: "BULLISH" | "BEARISH"; top: number; bottom: number } | null {
  if (candles.length < 5) return null;
  const len = candles.length;

  // Check for Bullish Order Block (Last bearish candle before impulsive breakout up)
  for (let i = len - 2; i >= Math.max(1, len - 6); i--) {
    const c = candles[i];
    const isBearish = c.close < c.open;
    const next1 = candles[i + 1];
    const next2 = candles[i + 2] || next1;

    if (isBearish && (next1.close > c.high || next2.close > c.high)) {
      return {
        type: "BULLISH",
        top: Math.max(c.open, c.close),
        bottom: c.low,
      };
    }
  }

  // Check for Bearish Order Block (Last bullish candle before impulsive breakout down)
  for (let i = len - 2; i >= Math.max(1, len - 6); i--) {
    const c = candles[i];
    const isBullish = c.close > c.open;
    const next1 = candles[i + 1];
    const next2 = candles[i + 2] || next1;

    if (isBullish && (next1.close < c.low || next2.close < c.low)) {
      return {
        type: "BEARISH",
        top: c.high,
        bottom: Math.min(c.open, c.close),
      };
    }
  }

  return null;
}

// 9. SMC Fair Value Gap (FVG / Imbalance)
export function detectFairValueGap(candles: Candle[]): { type: "BULLISH" | "BEARISH"; top: number; bottom: number } | null {
  if (candles.length < 3) return null;
  const len = candles.length;
  const c3 = candles[len - 1]; // latest
  const c2 = candles[len - 2]; // impulsive
  const c1 = candles[len - 3]; // previous

  // Bullish FVG: Low of c3 > High of c1 (gap in c2)
  if (c3.low > c1.high && c2.close > c2.open) {
    return {
      type: "BULLISH",
      top: c3.low,
      bottom: c1.high,
    };
  }

  // Bearish FVG: High of c3 < Low of c1 (gap in c2)
  if (c3.high < c1.low && c2.close < c2.open) {
    return {
      type: "BEARISH",
      top: c1.low,
      bottom: c3.high,
    };
  }

  return null;
}

// 10. SMC Break of Structure (BOS) / Change of Character (CHoCH)
export function detectStructure(candles: Candle[]): "BOS_BULL" | "BOS_BEAR" | "CHOCH_BULL" | "CHOCH_BEAR" | "RANGE" {
  if (candles.length < 10) return "RANGE";
  const recent = candles.slice(-10);
  const current = recent[recent.length - 1];
  const prevHighs = recent.slice(0, -1).map((c) => c.high);
  const prevLows = recent.slice(0, -1).map((c) => c.low);

  const highestHigh = Math.max(...prevHighs);
  const lowestLow = Math.min(...prevLows);

  if (current.close > highestHigh) {
    return "BOS_BULL";
  } else if (current.close < lowestLow) {
    return "BOS_BEAR";
  }

  const prev2 = recent[recent.length - 2];
  if (prev2.close < prev2.open && current.close > prev2.high) {
    return "CHOCH_BULL";
  } else if (prev2.close > prev2.open && current.close < prev2.low) {
    return "CHOCH_BEAR";
  }

  return "RANGE";
}

// 11. SMC / ICT Liquidity Sweep (Stop Hunt)
export function detectLiquiditySweep(candles: Candle[]): { detected: boolean; type: "SWEEP_HIGHS" | "SWEEP_LOWS" | "NONE" } {
  if (candles.length < 6) return { detected: false, type: "NONE" };
  const current = candles[candles.length - 1];
  const lookback = candles.slice(-6, -1);
  const maxHigh = Math.max(...lookback.map((c) => c.high));
  const minLow = Math.min(...lookback.map((c) => c.low));

  // Sweep Highs: Wick broke above maxHigh but closed below maxHigh
  if (current.high > maxHigh && current.close <= maxHigh) {
    return { detected: true, type: "SWEEP_HIGHS" };
  }

  // Sweep Lows: Wick broke below minLow but closed above minLow
  if (current.low < minLow && current.close >= minLow) {
    return { detected: true, type: "SWEEP_LOWS" };
  }

  return { detected: false, type: "NONE" };
}

// 12. ICT Optimal Trade Entry (OTE / Fibonacci Discount/Premium)
export function calculateOTE(candles: Candle[]): { isOteZone: boolean; discountPremium: "DISCOUNT" | "PREMIUM" | "EQUILIBRIUM"; fibLevel: number } {
  if (candles.length < 15) {
    return { isOteZone: false, discountPremium: "EQUILIBRIUM", fibLevel: 50 };
  }

  const slice = candles.slice(-20);
  const high = Math.max(...slice.map((c) => c.high));
  const low = Math.min(...slice.map((c) => c.low));
  const current = slice[slice.length - 1].close;
  const range = high - low || 0.0001;

  // Percentage from Low to High (0% = low, 100% = high)
  const fibLevel = +(((current - low) / range) * 100).toFixed(1);

  // OTE is between 61.8% and 78.6% (retracement zone)
  const isOteZone = (fibLevel >= 61.8 && fibLevel <= 78.6) || (fibLevel >= 21.4 && fibLevel <= 38.2);
  const discountPremium = fibLevel < 50 ? "DISCOUNT" : fibLevel > 50 ? "PREMIUM" : "EQUILIBRIUM";

  return { isOteZone, discountPremium, fibLevel };
}

// 13. Candlestick Price Action Patterns (Strict Mathematical Japanese Candlestick Criteria)
export function detectCandlestickPattern(candles: Candle[]): string {
  if (!candles || candles.length < 3) return "Fluxo Normal";

  const len = candles.length;
  const c3 = candles[len - 1]; // current/latest closed candle
  const c2 = candles[len - 2];
  const c1 = candles[len - 3];

  const body3 = Math.abs(c3.close - c3.open);
  const range3 = Math.max(0.0001, c3.high - c3.low);
  const isBull3 = c3.close > c3.open;
  const isBear3 = c3.close < c3.open;

  const upperWick3 = c3.high - Math.max(c3.open, c3.close);
  const lowerWick3 = Math.min(c3.open, c3.close) - c3.low;

  const body2 = Math.abs(c2.close - c2.open);
  const range2 = Math.max(0.0001, c2.high - c2.low);
  const isBear2 = c2.close < c2.open;
  const isBull2 = c2.close > c2.open;

  // 1. Strict Bullish Hammer (Martelo de Alta)
  // Requisitos: Corpo pequeno no topo, pavio inferior longo (>=55% do range total e >=2x o corpo), pavio superior minúsculo (<=12% do range) e corpo comprador ou rejeição em fundo prévio
  const isHammerShape = lowerWick3 >= range3 * 0.55 && lowerWick3 >= body3 * 1.8 && upperWick3 <= range3 * 0.15 && body3 >= range3 * 0.10;
  if (isHammerShape) {
    if (isBull3) {
      return "Martelo de Alta (Bullish Hammer - Rejeição de Fundo)";
    } else {
      return "Pinbar de Rejeição de Fundo";
    }
  }

  // 2. Strict Shooting Star (Estrela Cadente)
  // Requisitos: Corpo pequeno na base, pavio superior longo (>=55% do range total e >=2x o corpo), pavio inferior minúsculo (<=12% do range) e corpo vendedor
  const isShootingStarShape = upperWick3 >= range3 * 0.55 && upperWick3 >= body3 * 1.8 && lowerWick3 <= range3 * 0.15 && body3 >= range3 * 0.10;
  if (isShootingStarShape) {
    if (isBear3) {
      return "Estrela Cadente (Shooting Star - Rejeição de Topo)";
    } else {
      return "Pinbar de Rejeição de Topo";
    }
  }

  // 3. Strict Bullish Engulfing (Engolfo de Alta)
  // Requisitos: Vela anterior vermelha, vela atual verde com corpo maior e cobrindo completamente a abertura/fechamento anterior
  if (isBear2 && isBull3 && body3 > body2 * 1.05 && c3.open <= c2.close * 1.0005 && c3.close >= c2.open * 0.9995 && body3 >= range3 * 0.5) {
    return "Engolfo de Alta (Bullish Engulfing Institucional)";
  }

  // 4. Strict Bearish Engulfing (Engolfo de Baixa)
  // Requisitos: Vela anterior verde, vela atual vermelha com corpo maior e cobrindo completamente a abertura/fechamento anterior
  if (isBull2 && isBear3 && body3 > body2 * 1.05 && c3.open >= c2.close * 0.9995 && c3.close <= c2.open * 1.0005 && body3 >= range3 * 0.5) {
    return "Engolfo de Baixa (Bearish Engulfing Institucional)";
  }

  // 5. Morning Star (Estrela da Manhã)
  const isBear1 = c1.close < c1.open;
  if (isBear1 && body2 < range2 * 0.4 && isBull3 && c3.close > (c1.open + c1.close) / 2 && body3 > range3 * 0.45) {
    return "Estrela da Manhã (Morning Star - Reversão de Alta)";
  }

  // 6. Evening Star (Estrela da Noite)
  const isBull1 = c1.close > c1.open;
  if (isBull1 && body2 < range2 * 0.4 && isBear3 && c3.close < (c1.open + c1.close) / 2 && body3 > range3 * 0.45) {
    return "Estrela da Noite (Evening Star - Reversão de Baixa)";
  }

  // 7. Marubozu (Vela de Força Pura sem pavios)
  if (body3 >= range3 * 0.88 && range3 >= 0.0005) {
    return isBull3 ? "Marubozu de Alta (Força Compradora Institucional)" : "Marubozu de Baixa (Força Vendedora Institucional)";
  }

  // 8. Doji (Indecisão pura)
  if (body3 <= range3 * 0.08) {
    if (lowerWick3 >= range3 * 0.65) return "Dragonfly Doji (Rejeição de Fundo)";
    if (upperWick3 >= range3 * 0.65) return "Gravestone Doji (Rejeição de Topo)";
    return "Doji (Indecisão Neutra)";
  }

  // 9. Rejeição Genérica por Pavio
  if (lowerWick3 >= range3 * 0.45) {
    return "Rejeição de Fundo por Pavio Inferior";
  }
  if (upperWick3 >= range3 * 0.45) {
    return "Rejeição de Topo por Pavio Superior";
  }

  return isBull3 ? "Vela de Continuidade Altista" : "Vela de Continuidade Baixista";
}

// 14. Quadrant Color Alternation & Choppy Market Detector (Padrão Xadrez / Ping-Pong Sem Fluxo)
export function detectColorAlternation(candles: Candle[]): { isAlternating: boolean; flipsCount: number; colorSequence: string } {
  if (!candles || candles.length < 5) {
    return { isAlternating: false, flipsCount: 0, colorSequence: "" };
  }

  const recent = candles.slice(-5); // last 5 candles
  const colors = recent.map((c) => (c.close >= c.open ? "G" : "R")); // Green / Red
  const colorSequence = colors.map((c) => (c === "G" ? "🟢" : "🔴")).join(" ");

  const colorStr = colors.join(""); // e.g. "GRGRG" or "RGRGR"
  const last4Str = colors.slice(-4).join(""); // e.g. "GRGR" or "RGRG"

  let flips = 0;
  for (let i = 1; i < colors.length; i++) {
    if (colors[i] !== colors[i - 1]) {
      flips++;
    }
  }

  // True Quadrant Alternation is STRICTLY an alternating ping-pong pattern:
  // "GRGRG" or "RGRGR" (4 flips) or "GRGR" / "RGRG" (3 flips in last 4)
  const isStrictPingPong = colorStr === "GRGRG" || colorStr === "RGRGR" || last4Str === "GRGR" || last4Str === "RGRG";

  // Check if price is trapped in a tight flat sideways range
  const lastCandle = recent[recent.length - 1];
  const firstCandle = recent[0];
  const rangeVariation = Math.abs(lastCandle.close - firstCandle.open) / (lastCandle.close || 1);
  const isFlatRange = rangeVariation < 0.0015;

  const isAlternating = isStrictPingPong && isFlatRange;

  return { isAlternating, flipsCount: flips, colorSequence };
}

// 15. Master Indicators Engine with Near Defense Region
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
      ema50: 0,
      ema200: 0,
      sma50: 0,
      bollingerUpper: 0,
      bollingerMiddle: 0,
      bollingerLower: 0,
      atr: 0,
      adx: 25,
      volumeDelta: 0,
      support: 0,
      resistance: 0,
      candlestickPattern: "Sem dados",
      trend: "LATERAL",
      isAlternatingQuadrant: false,
      choppyMarket: false,
    };
  }

  const closes = candles.map((c) => c.close);
  const currentPrice = closes[closes.length - 1] || 100;

  const rsi = calculateRSI(candles, 14);
  const macd = calculateMACD(candles);
  const stoch = calculateStochastic(candles, 14);
  const bb = calculateBollingerBands(candles, 20, 2);
  const atr = calculateATR(candles, 14);
  const adx = calculateADX(candles, 14);
  const volumeDelta = calculateVolumeDelta(candles);

  const ema9Arr = calculateEMA(closes, 9);
  const ema20Arr = calculateEMA(closes, 20);
  const ema50Arr = calculateEMA(closes, 50);
  const ema200Arr = calculateEMA(closes, Math.min(closes.length, 200));

  const ema9 = +(ema9Arr[ema9Arr.length - 1] || currentPrice).toFixed(2);
  const ema20 = +(ema20Arr[ema20Arr.length - 1] || currentPrice).toFixed(2);
  const ema50 = +(ema50Arr[ema50Arr.length - 1] || currentPrice).toFixed(2);
  const ema200 = +(ema200Arr[ema200Arr.length - 1] || currentPrice).toFixed(2);
  const sma50 = calculateSMA(closes, Math.min(closes.length, 50));

  // Micro Support & Resistance (Immediate Near Pivots, 5 to 15 candles)
  const nearSlice = candles.slice(-12);
  const nearSupport = +Math.min(...nearSlice.map((c) => c.low)).toFixed(2);
  const nearResistance = +Math.max(...nearSlice.map((c) => c.high)).toFixed(2);

  // Macro Support & Resistance (30 to 50 candles)
  const macroSlice = candles.slice(-40);
  const support = +Math.min(...macroSlice.map((c) => c.low)).toFixed(2);
  const resistance = +Math.max(...macroSlice.map((c) => c.high)).toFixed(2);

  // SMC & ICT
  const smcOrderBlock = detectOrderBlock(candles);
  const smcFairValueGap = detectFairValueGap(candles);
  const smcStructure = detectStructure(candles);
  const liquiditySweep = detectLiquiditySweep(candles);
  const ictOptimalTradeEntry = calculateOTE(candles);

  const pattern = detectCandlestickPattern(candles);
  const rsiStatus = rsi >= 70 ? "Sobrecompra" : rsi <= 30 ? "Sobrevenda" : "Neutro";

  // Quadrant color alternation detection
  const alternation = detectColorAlternation(candles);
  const isAlternatingQuadrant = alternation.isAlternating;
  const choppyMarket = isAlternatingQuadrant || (adx < 20 && Math.abs(ema9 - ema20) / currentPrice < 0.0003);

  let trend: "ALTA" | "BAIXA" | "LATERAL" = "LATERAL";
  if (!isAlternatingQuadrant) {
    if (ema9 > ema20 && currentPrice > ema9) {
      trend = "ALTA";
    } else if (ema9 < ema20 && currentPrice < ema9) {
      trend = "BAIXA";
    }
  }

  // Calculate near defense region (1 to 1.2x ATR from entry trigger)
  const defenseOffset = Math.max(currentPrice * 0.0008, +(atr * 1.1).toFixed(2));
  const defensePrice = trend === "ALTA" ? +(currentPrice - defenseOffset).toFixed(2) : +(currentPrice + defenseOffset).toFixed(2);
  const distancePercent = +((defenseOffset / currentPrice) * 100).toFixed(2);

  const defenseZone = {
    entryTrigger: currentPrice,
    defensePrice,
    distancePercent,
    label: trend === "ALTA" ? `Defesa no fundo imediato em $${defensePrice}` : `Defesa no topo imediato em $${defensePrice}`,
  };

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
    ema50,
    ema200,
    sma50,
    bollingerUpper: bb.upper,
    bollingerMiddle: bb.middle,
    bollingerLower: bb.lower,
    atr,
    adx,
    volumeDelta,
    support,
    resistance,
    nearSupport,
    nearResistance,
    candlestickPattern: pattern,
    trend,
    smcOrderBlock,
    smcFairValueGap,
    smcStructure,
    liquiditySweep,
    ictOptimalTradeEntry,
    defenseZone,
    isAlternatingQuadrant,
    choppyMarket,
  };
}
