import dotenv from 'dotenv';
dotenv.config();

function aggregateCandles(candles, multiplier) {
  const aggregated = [];
  const groups = {};
  for (const c of candles) {
    const key = Math.floor(c.time / (60 * multiplier)) * (60 * multiplier);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(c);
  }
  
  const sortedKeys = Object.keys(groups).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  for (const keyStr of sortedKeys) {
    const key = parseInt(keyStr, 10);
    const group = groups[key];
    group.sort((a, b) => a.time - b.time);
    const open = group[0].open;
    const close = group[group.length - 1].close;
    const high = Math.max(...group.map(c => c.high));
    const low = Math.min(...group.map(c => c.low));
    const volume = group.reduce((sum, c) => sum + (c.volume || 0), 0);
    aggregated.push({
      time: key,
      open,
      high,
      low,
      close,
      volume
    });
  }
  return aggregated;
}

// Helper to fetch real-time crypto candles with multi-source resilient endpoints
async function fetchCandlesFromSources(ticker, interval, limit) {
  const isCustomTimeframe = interval === "2m";
  const fetchInterval = isCustomTimeframe ? "1m" : interval;
  const fetchLimit = isCustomTimeframe ? limit * 2 + 10 : limit;

  const sources = [
    `https://data-api.binance.vision/api/v3/klines?symbol=${ticker}&interval=${fetchInterval}&limit=${fetchLimit}`,
    `https://api.binance.us/api/v3/klines?symbol=${ticker}&interval=${fetchInterval}&limit=${fetchLimit}`,
    `https://api.binance.com/api/v3/klines?symbol=${ticker}&interval=${fetchInterval}&limit=${fetchLimit}`,
  ];

  let fetchedCandles = null;
  for (const url of sources) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "CandleX-AI/1.0" },
        signal: AbortSignal.timeout(3500),
      });

      if (response.ok) {
        const rawData = await response.json();
        if (Array.isArray(rawData) && rawData.length > 0) {
          fetchedCandles = rawData.map((item) => ({
            time: Math.floor(item[0] / 1000),
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
          }));
          break;
        }
      }
    } catch {
      // Continue to next source silently
    }
  }

  // Try Bybit as secondary global provider
  if (!fetchedCandles) {
    try {
      const bybitInterval = fetchInterval === "5m" ? "5" : fetchInterval === "15m" ? "15" : "1";
      const bybitUrl = `https://api.bybit.com/v5/market/kline?category=spot&symbol=${ticker}&interval=${bybitInterval}&limit=${fetchLimit}`;
      const bybitRes = await fetch(bybitUrl, { signal: AbortSignal.timeout(3500) });
      if (bybitRes.ok) {
        const data = await bybitRes.json();
        if (data.result?.list && Array.isArray(data.result.list) && data.result.list.length > 0) {
          fetchedCandles = data.result.list
            .slice()
            .reverse()
            .map((item) => ({
              time: Math.floor(parseInt(item[0], 10) / 1000),
              open: parseFloat(item[1]),
              high: parseFloat(item[2]),
              low: parseFloat(item[3]),
              close: parseFloat(item[4]),
              volume: parseFloat(item[5]),
            }));
        }
      }
    } catch {
      // Continue
    }
  }

  if (fetchedCandles && isCustomTimeframe) {
    const aggregated = aggregateCandles(fetchedCandles, 2);
    return aggregated.slice(-limit);
  }

  return fetchedCandles;
}

// In-memory price state for fallback (in serverless, this is instance-level, but acts as a decent buffer)
const priceCache = {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ticker = (req.query.ticker || "ETHUSDT").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const interval = (req.query.interval || "1m");
  const limit = Math.min(parseInt(req.query.limit || "60", 10), 100);

  const realCandles = await fetchCandlesFromSources(ticker, interval, limit);
  if (realCandles && realCandles.length > 0) {
    priceCache[ticker] = {
      lastPrice: realCandles[realCandles.length - 1].close,
      lastUpdate: Date.now(),
      candles: realCandles,
    };
    return res.status(200).json({ success: true, ticker, interval, candles: realCandles, source: "live" });
  }

  // Realistic synthetic fallback
  const now = Math.floor(Date.now() / 1000);
  let basePrice = ticker.includes("ETH")
    ? 2680.0
    : ticker.includes("BTC")
    ? 93400.0
    : ticker.includes("SOL")
    ? 188.0
    : ticker.includes("BNB")
    ? 640.0
    : ticker.includes("XRP")
    ? 2.45
    : 100.0;

  if (priceCache[ticker]?.lastPrice) {
    basePrice = priceCache[ticker].lastPrice;
  }

  const candles = [];
  const intervalSeconds = interval === "5m" ? 300 : interval === "15m" ? 900 : 60;
  
  let currentClose = basePrice;
  for (let i = limit - 1; i >= 0; i--) {
    const time = now - i * intervalSeconds;
    const delta = (Math.random() - 0.492) * (basePrice * 0.0025);
    const open = currentClose;
    const close = +(open + delta).toFixed(2);
    const spread = Math.abs(close - open);
    const high = +(Math.max(open, close) + Math.random() * (spread + basePrice * 0.0008)).toFixed(2);
    const low = +(Math.min(open, close) - Math.random() * (spread + basePrice * 0.0008)).toFixed(2);
    const volume = +(Math.random() * 40 + 15).toFixed(2);
    candles.push({ time, open, high, low, close, volume });
    currentClose = close;
  }

  priceCache[ticker] = {
    lastPrice: candles[candles.length - 1].close,
    lastUpdate: Date.now(),
    candles,
  };

  return res.status(200).json({ success: true, ticker, interval, candles, isSynthetic: true });
}
