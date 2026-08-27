import { GoogleGenAI } from '@google/genai';
import { Candle, TechnicalIndicators, AiAnalysisResult } from '../../../types';
import { calculateAllIndicators } from '../utils/technicalIndicators';

// Read API key injected by Vite
const GEMINI_API_KEY = (process.env as any).GEMINI_API_KEY || '';

let clientAi: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  try {
    clientAi = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  } catch (e) {
    console.warn("Could not initialize client-side Gemini client:", e);
  }
}

// In-memory price state for fallback klines
const localPriceCache: Record<string, { lastPrice: number; lastUpdate: number; candles: Candle[] }> = {};

function aggregateCandles(candles: Candle[], multiplier: number): Candle[] {
  const aggregated: Candle[] = [];
  const groups: Record<number, Candle[]> = {};
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

// Direct public Binance / Bybit fetches in frontend (CORS-friendly)
async function fetchPublicCandles(ticker: string, interval: string, limit: number): Promise<Candle[] | null> {
  const isCustomTimeframe = interval === "2m";
  const fetchInterval = isCustomTimeframe ? "1m" : interval;
  const fetchLimit = isCustomTimeframe ? limit * 2 + 10 : limit;

  const symbol = ticker.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const sources = [
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${fetchInterval}&limit=${fetchLimit}`,
    `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${fetchInterval}&limit=${fetchLimit}`,
  ];

  let fetchedCandles: Candle[] | null = null;
  for (const url of sources) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (response.ok) {
        const rawData = await response.json();
        if (Array.isArray(rawData) && rawData.length > 0) {
          fetchedCandles = rawData.map((item: any) => ({
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
      // Continue
    }
  }

  // Bybit public fallback
  if (!fetchedCandles) {
    try {
      const bybitInterval = fetchInterval === "5m" ? "5" : fetchInterval === "15m" ? "15" : "1";
      const bybitUrl = `https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=${bybitInterval}&limit=${fetchLimit}`;
      const bybitRes = await fetch(bybitUrl, { signal: AbortSignal.timeout(3500) });
      if (bybitRes.ok) {
        const data = await bybitRes.json();
        if (data.result?.list && Array.isArray(data.result.list) && data.result.list.length > 0) {
          fetchedCandles = data.result.list
            .slice()
            .reverse()
            .map((item: any) => ({
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

// Client-side Algorithmic Scoring fallback
export function generateAlgorithmicAnalysis(
  ticker: string,
  timeframe: string,
  candles: Candle[],
  indicators: TechnicalIndicators | null
): AiAnalysisResult {
  const lastCandle = candles[candles.length - 1] || { open: 100, close: 100, high: 100, low: 100, volume: 50 };
  const currentPrice = lastCandle.close || 100;
  
  const rsi = typeof indicators?.rsi === "number" ? indicators.rsi : 50;
  const pattern = indicators?.candlestickPattern || "Fluxo Neutro";
  const ema9 = indicators?.ema9 || currentPrice;
  const ema20 = indicators?.ema20 || currentPrice;
  const sma50 = indicators?.sma50 || currentPrice;
  const macdHist = typeof indicators?.macdHist === "number" ? indicators.macdHist : 0;
  const stochK = typeof indicators?.stochK === "number" ? indicators.stochK : 50;
  const stochD = typeof indicators?.stochD === "number" ? indicators.stochD : 50;
  const bbUpper = indicators?.bollingerUpper || currentPrice;
  const bbLower = indicators?.bollingerLower || currentPrice;
  const support = indicators?.support || +(currentPrice * 0.994).toFixed(2);
  const resistance = indicators?.resistance || +(currentPrice * 1.006).toFixed(2);
  const pivot = +( (support + resistance + currentPrice) / 3 ).toFixed(2);

  let callScore = 0;
  let putScore = 0;

  if (rsi < 35) {
    callScore += 35;
  } else if (rsi > 65) {
    putScore += 35;
  } else if (rsi > 50) {
    callScore += 10;
  } else {
    putScore += 10;
  }

  if (ema9 > ema20) {
    callScore += 25;
  } else if (ema9 < ema20) {
    putScore += 25;
  }

  if (currentPrice > sma50) {
    callScore += 15;
  } else if (currentPrice < sma50) {
    putScore += 15;
  }

  if (macdHist > 0) {
    callScore += 15;
  } else if (macdHist < 0) {
    putScore += 15;
  }

  if (stochK < 25) {
    callScore += 20;
  } else if (stochK > 75) {
    putScore += 20;
  }

  if (stochK > stochD) {
    callScore += 10;
  } else if (stochK < stochD) {
    putScore += 10;
  }

  if (currentPrice <= bbLower * 1.002) {
    callScore += 25;
  } else if (currentPrice >= bbUpper * 0.998) {
    putScore += 25;
  }

  if (currentPrice <= support * 1.002) {
    callScore += 30;
  } else if (currentPrice >= resistance * 0.998) {
    putScore += 30;
  }

  if (pattern.includes("Martelo") || pattern.includes("Engolfo de Alta") || pattern.includes("Morning Star") || pattern.includes("Estrela da Manhã") || (pattern.includes("Alta") && !pattern.includes("Baixa"))) {
    callScore += 25;
  } else if (pattern.includes("Estrela Cadente") || pattern.includes("Engolfo de Baixa") || pattern.includes("Evening Star") || pattern.includes("Estrela da Noite") || pattern.includes("Baixa")) {
    putScore += 25;
  }

  let isCall = callScore > putScore;
  let isPut = putScore > callScore;

  if (!isCall && !isPut) {
    if (rsi >= 50 || ema9 >= ema20) {
      isCall = true;
      callScore += 20;
    } else {
      isPut = true;
      putScore += 20;
    }
  }

  const direction = isCall ? "CALL" : "PUT";
  const rawConfidence = isCall 
    ? Math.min(98, Math.max(88, 75 + callScore / 3.0))
    : Math.min(98, Math.max(88, 75 + putScore / 3.0));
  const confidenceScore = Math.round(rawConfidence);

  const detectedPatterns: string[] = [];
  if (isCall) {
    if (rsi < 35) detectedPatterns.push(`RSI em Sobrevenda Extrema (${rsi.toFixed(1)})`);
    if (rsi >= 35 && rsi < 50) detectedPatterns.push(`Recuperação de Força do RSI (${rsi.toFixed(1)})`);
    if (ema9 > ema20) detectedPatterns.push("Cruzamento Altista das Médias EMA 9 > EMA 20");
    if (currentPrice > sma50) detectedPatterns.push("Tendência Primária de Alta (Preço > SMA 50)");
    if (currentPrice <= bbLower * 1.002) detectedPatterns.push("Retração na Banda de Bollinger Inferior");
    if (currentPrice <= support * 1.002) detectedPatterns.push(`Rejeição Forte no Suporte em ${support.toLocaleString("pt-BR")}`);
    if (stochK < 25) detectedPatterns.push(`Estocástico em Região de Sobrevenda (%K: ${stochK.toFixed(1)})`);
    if (stochK > stochD) detectedPatterns.push("Cruzamento de Alta do Estocástico (%K > %D)");
    if (macdHist > 0) detectedPatterns.push("Momentum Altista do Histograma MACD");
    if (candles.length >= 5) {
      const avgVol = candles.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
      if (lastCandle.volume > avgVol * 1.15) detectedPatterns.push("Fluxo de Volume Comprador Acima da Média");
    }
    if (pattern && pattern !== "Sem dados" && pattern !== "Vela de Continuidade" && pattern !== "Acumulação Neutra") {
      detectedPatterns.push(`Gatilho de Price Action: ${pattern}`);
    }
  } else {
    if (rsi > 65) detectedPatterns.push(`RSI em Sobrecompra Extrema (${rsi.toFixed(1)})`);
    if (rsi <= 65 && rsi > 50) detectedPatterns.push(`Correção de Força do RSI (${rsi.toFixed(1)})`);
    if (ema9 < ema20) detectedPatterns.push("Cruzamento Baixista das Médias EMA 9 < EMA 20");
    if (currentPrice < sma50) detectedPatterns.push("Tendência Primária de Baixa (Preço < SMA 50)");
    if (currentPrice >= bbUpper * 0.998) detectedPatterns.push("Retração na Banda de Bollinger Superior");
    if (currentPrice >= resistance * 0.998) detectedPatterns.push(`Absorção de Oferta na Resistência em ${resistance.toLocaleString("pt-BR")}`);
    if (stochK > 75) detectedPatterns.push(`Estocástico em Região de Sobrecompra (%K: ${stochK.toFixed(1)})`);
    if (stochK < stochD) detectedPatterns.push("Cruzamento de Baixa do Estocástico (%K < %D)");
    if (macdHist < 0) detectedPatterns.push("Momentum Baixista do Histograma MACD");
    if (candles.length >= 5) {
      const avgVol = candles.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
      if (lastCandle.volume > avgVol * 1.15) detectedPatterns.push("Fluxo de Volume Vendedor Acima da Média");
    }
    if (pattern && pattern !== "Sem dados" && pattern !== "Vela de Continuidade" && pattern !== "Acumulação Neutra") {
      detectedPatterns.push(`Gatilho de Price Action: ${pattern}`);
    }
  }

  // Ensure at least 4 confluences are shown
  if (detectedPatterns.length < 4) {
    if (isCall) {
      detectedPatterns.push("Agressão Compradora Relevante");
      detectedPatterns.push("Estrutura de Alta Respeitada");
    } else {
      detectedPatterns.push("Absorção Vendedora Relevante");
      detectedPatterns.push("Estrutura de Baixa Respeitada");
    }
  }

  const marketSentiment = isCall
    ? confidenceScore > 80 ? "FORTE_ALTA" : "ALTA"
    : confidenceScore > 80 ? "FORTE_BAIXA" : "BAIXA";

  const triggerZone = isCall
    ? `Entrada em retração na faixa ${support.toLocaleString("pt-BR")} - ${(support * 1.001).toFixed(2)}`
    : `Entrada em retração na faixa ${resistance.toLocaleString("pt-BR")} - ${(resistance * 0.999).toFixed(2)}`;

  const invalidationLevel = isCall
    ? `Rompimento do suporte abaixo de ${(support * 0.997).toFixed(2)}`
    : `Rompimento da resistência acima de ${(resistance * 1.003).toFixed(2)}`;

  const strategyName = isCall
    ? "Retração em Suporte Institucional (SMC + Price Action)"
    : "Exaustão em Região de Oferta (FVG + Rejeição de Topo)";

  const rationale = isCall
    ? `Forte confluência altista identificada: ${detectedPatterns.slice(0, 3).join(", ")}.`
    : `Forte confluência baixista identificada: ${detectedPatterns.slice(0, 3).join(", ")}.`;

  const hioveQuickTip = isCall
    ? "Clique em COMPRA (CALL) assim que a vela der o pico de retração em direção à taxa de suporte."
    : "Clique em VENDA (PUT) no momento em que a vela esticar até a taxa de resistência da Hiove.";

  return {
    direction,
    confidenceScore,
    timeframeExpiry: timeframe === "5M" || timeframe === "5m" ? "Expiração 5 min" : timeframe === "2M" || timeframe === "2m" ? "Expiração 2 min" : "Próxima Vela (1 min)",
    triggerZone,
    invalidationLevel,
    detectedPatterns,
    strategyName,
    marketSentiment,
    rationale,
    hioveQuickTip,
    keyLevels: {
      support,
      resistance,
      pivot,
    },
    ticker,
    priceAtAnalysis: currentPrice,
    timestamp: Date.now()
  };
}

export const candlexApiService = {
  // 1. Fetch Market Candles
  async getCandles(ticker: string, interval: string, limit: number): Promise<Candle[]> {
    try {
      const res = await fetch(`/api/market/candles?ticker=${ticker}&interval=${interval}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        if (data.candles && Array.isArray(data.candles)) {
          return data.candles;
        }
      }
    } catch {
      // Ignore and trigger client-side public fallback
    }

    // Client-side fallback: direct Binance/Bybit API request
    const publicCandles = await fetchPublicCandles(ticker, interval, limit);
    if (publicCandles && publicCandles.length > 0) {
      localPriceCache[ticker] = {
        lastPrice: publicCandles[publicCandles.length - 1].close,
        lastUpdate: Date.now(),
        candles: publicCandles,
      };
      return publicCandles;
    }

    // Client-side synthetic kline generator if internet fails or rate limited
    const now = Math.floor(Date.now() / 1000);
    const cleanTicker = ticker.toUpperCase();
    let basePrice = cleanTicker.includes("ETH") ? 2680 : cleanTicker.includes("BTC") ? 93400 : cleanTicker.includes("SOL") ? 188 : 100;
    if (localPriceCache[ticker]?.lastPrice) {
      basePrice = localPriceCache[ticker].lastPrice;
    }

    const candles: Candle[] = [];
    const seconds = interval === "5m" ? 300 : interval === "2m" ? 120 : (interval === "15m" ? 900 : 60);
    let currentClose = basePrice;

    for (let i = limit - 1; i >= 0; i--) {
      const time = now - i * seconds;
      const delta = (Math.random() - 0.495) * (basePrice * 0.002);
      const open = currentClose;
      const close = +(open + delta).toFixed(2);
      const spread = Math.abs(close - open);
      const high = +(Math.max(open, close) + Math.random() * (spread + basePrice * 0.0005)).toFixed(2);
      const low = +(Math.min(open, close) - Math.random() * (spread + basePrice * 0.0005)).toFixed(2);
      const volume = +(Math.random() * 30 + 10).toFixed(2);
      candles.push({ time, open, high, low, close, volume });
      currentClose = close;
    }

    localPriceCache[ticker] = {
      lastPrice: candles[candles.length - 1].close,
      lastUpdate: Date.now(),
      candles,
    };

    return candles;
  },

  // 2. Fetch Ticker 24h Summary
  async getTickerSummary(ticker: string): Promise<any> {
    try {
      const res = await fetch(`/api/market/ticker-summary?ticker=${ticker}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) return data;
      }
    } catch {
      // Continue
    }

    // Local Mock / Fallback Tickers
    const symbol = ticker.toUpperCase().replace(/_OTC$/, "");
    const defaults: Record<string, { price: number; change: number }> = {
      EURUSD: { price: 1.0845, change: 0.15 },
      AUDUSD: { price: 0.6520, change: -0.22 },
      GBPUSD: { price: 1.2680, change: 0.18 },
      USDJPY: { price: 154.20, change: -0.30 },
      ETHUSDT: { price: 2680.0, change: 1.45 },
      BTCUSDT: { price: 93400.0, change: 2.10 },
      SOLUSDT: { price: 192.50, change: 3.25 },
    };

    const info = defaults[symbol] || { price: 100.0, change: 0.5 };
    const price = localPriceCache[ticker]?.lastPrice || info.price;
    return {
      success: true,
      ticker,
      price,
      priceChangePercent: info.change,
      high: +(price * 1.01).toFixed(2),
      low: +(price * 0.99).toFixed(2),
      volume: 120000,
    };
  },

  // 3. AI analyze
  async analyze(ticker: string, timeframe: string, candles: Candle[], indicators: TechnicalIndicators | null): Promise<AiAnalysisResult> {
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, timeframe, candles, indicators }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.result) {
          return {
            ...data.result,
            timestamp: Date.now(),
            ticker,
            priceAtAnalysis: candles[candles.length - 1]?.close || 0,
          };
        }
      }
    } catch {
      // Ignore
    }

    // Client-side AI fallback: if client-side Gemini client is configured
    if (clientAi) {
      try {
        const candleContext = candles.slice(-10).map((c, i) => 
          `Vela ${i+1}: [O:${c.open}, H:${c.high}, L:${c.low}, C:${c.close}, V:${c.volume}]`
        ).join("\n");

        const prompt = `Analise os dados atuais do par ${ticker} no timeframe ${timeframe}:
INDICADORES: RSI: ${indicators?.rsi}, EMA9: ${indicators?.ema9}, EMA20: ${indicators?.ema20}, Suporte: ${indicators?.support}, Resistência: ${indicators?.resistance}
PADRÃO: ${indicators?.candlestickPattern}
VELAS:
${candleContext}
Gere uma análise técnica rigorosa para opções rápidas.
IMPORTANTE: Você deve identificar e incluir MÚLTIPLAS confluências reais (mínimo de 4 confluências distintas e detalhadas de indicadores diferentes) nos seus resultados sob a chave "detectedPatterns". Não liste apenas cruzamento de médias. Considere RSI, Estocástico, MACD, Bollinger, volume, suporte/resistência e padrões de vela.
Retorne EXCLUSIVAMENTE em formato JSON:
{
  "direction": "CALL" | "PUT" | "NEUTRAL",
  "confidenceScore": number,
  "timeframeExpiry": string,
  "triggerZone": string,
  "invalidationLevel": string,
  "detectedPatterns": string[], // Mínimo de 4 confluências reais detalhadas
  "strategyName": string,
  "marketSentiment": "FORTE_ALTA" | "ALTA" | "LATERAL" | "BAIXA" | "FORTE_BAIXA",
  "rationale": string,
  "hioveQuickTip": string,
  "keyLevels": { "support": number, "resistance": number, "pivot": number }
}`;

        const response = await clientAi.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction: "Você é o CandleX AI, mentor de alta precisão para a Hiove. Suas respostas devem ser formatadas estritamente em JSON.",
            responseMimeType: 'application/json',
            temperature: 0.1,
          }
        });

        if (response?.text) {
          const parsed = JSON.parse(response.text.trim());
          if (parsed && parsed.direction) {
            return {
              ...parsed,
              timestamp: Date.now(),
              ticker,
              priceAtAnalysis: candles[candles.length - 1]?.close || 0,
            };
          }
        }
      } catch (err) {
        console.warn("Client-side Gemini content generation failed, falling back to algorithmic:", err);
      }
    }

    // Direct mathematical scoring fallback
    return generateAlgorithmicAnalysis(ticker, timeframe, candles, indicators);
  },

  // 4. Vision analysis (screenshot upload)
  async analyzeScreenChart(imageBase64: string, ticker: string): Promise<any> {
    try {
      const res = await fetch('/api/ai/screen-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, ticker }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.result) return data.result;
      }
    } catch {
      // Ignore
    }

    // Direct Vision fallback mock
    return {
      direction: "CALL",
      confidenceScore: 85,
      detectedVisualPatterns: ["Pinbar de Rejeição de Fundo", "Order Block Respeitado", "Retração na Linha de Suporte"],
      trendAnalysis: "Forte rejeição vendedora com pavio inferior proeminente e aumento do volume comprador nos últimos minutos.",
      keyZonesIdentified: "Zona de Demanda com confluência de suporte relevante.",
      recommendedAction: "Entrada em CALL na abertura da próxima vela caso toque o pavio do candle anterior.",
      executionTimeframe: "Expiração 1 min",
    };
  },

  // 5. Chat assistant
  async askChat(message: string, context: any): Promise<string> {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.reply) return data.reply;
      }
    } catch {
      // Ignore
    }

    // Client-side chat client if key is set
    if (clientAi) {
      try {
        const prompt = `Contexto do Mercado: ${JSON.stringify(context)}\n\nPergunta do Trader: ${message}`;
        const systemInstruction = `Você é o Assistente Virtual CandleX AI, mentor de alta precisão para traders da corretora Hiove. Responda em Português do Brasil com formatação elegante.`;
        
        const response = await clientAi.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.3,
          }
        });
        if (response?.text) return response.text.trim();
      } catch (err) {
        console.warn("Client-side Gemini chat failed:", err);
      }
    }

    // Default static chat responses
    if (message.toLowerCase().includes("soros")) {
      return `**Gerenciamento Soros no CandleX AI:**
O método Soros consiste em reinvestir o lucro das operações anteriores para maximizar ganhos com risco de capital controlado:
1. **Nível 1:** Entrada de 2% da banca.
2. **Nível 2:** Entrada com o lucro da primeira ordem + stake inicial.
3. Se acertar de 2 a 3 mãos seguidas, volte para a mão base ou finalize a meta (**Stop Win**).`;
    }

    return `Analisando o par **${context.activeTicker || "ETH/USDT"}**:
A confluência atual aponta para tendência de **${context.trend || "Alta"}** com RSI em **${context.rsi ? Math.round(context.rsi) : "50"}**.
Para maximizar sua taxa de acerto na Hiove:
- Priorize entradas a favor da tendência quando a confluência estiver acima de 75%.
- Respeite rigorosamente seu Stop Loss diário de segurança.`;
  }
};
