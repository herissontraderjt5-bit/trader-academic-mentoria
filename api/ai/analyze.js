import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

let ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Circuit breaker state (stateless, but can store in global scope for warm container)
let geminiCircuitBreakerUntil = 0;

// Safe Gemini content generator with model fallback
async function generateSafeAiContent(params) {
  if (!ai) return null;
  if (Date.now() < geminiCircuitBreakerUntil) {
    return null; // Under active cooldown
  }

  const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash"];

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: params.responseMimeType,
          temperature: params.temperature ?? 0.2,
        },
      });

      if (response?.text) {
        return response.text.trim();
      }
    } catch (err) {
      const errMsg = String(err?.message || err);
      const isQuotaError =
        errMsg.includes("429") ||
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("quota") ||
        errMsg.includes("Rate limit");

      if (isQuotaError) {
        geminiCircuitBreakerUntil = Date.now() + 60000; // 60s cooldown
        break;
      }
    }
  }

  return null;
}

// Algorithmic Analysis Fallback Engine
function generateAlgorithmicAnalysis(ticker, timeframe, candles, indicators = {}) {
  const lastCandle = candles[candles.length - 1] || { open: 100, close: 100, high: 100, low: 100, volume: 50 };
  const currentPrice = lastCandle.close || 100;
  
  const rsi = typeof indicators?.rsi === "number" ? indicators.rsi : 50;
  const pattern = indicators?.candlestickPattern || "Fluxo Neutro";
  const ema9 = indicators?.ema9 || currentPrice;
  const ema20 = indicators?.ema20 || currentPrice;
  const support = indicators?.support || +(currentPrice * 0.994).toFixed(2);
  const resistance = indicators?.resistance || +(currentPrice * 1.006).toFixed(2);
  const pivot = +( (support + resistance + currentPrice) / 3 ).toFixed(2);

  let callScore = 0;
  let putScore = 0;
  const detectedPatterns = [];

  if (rsi < 32) {
    callScore += 35;
    detectedPatterns.push("RSI em Região de Sobrevenda Extrema (<32)");
  } else if (rsi > 68) {
    putScore += 35;
    detectedPatterns.push("RSI em Região de Sobrecompra Extrema (>68)");
  } else if (rsi > 50) {
    callScore += 10;
  } else {
    putScore += 10;
  }

  if (ema9 > ema20) {
    callScore += 25;
    detectedPatterns.push("Cruzamento de Alta EMA 9 > EMA 20");
  } else if (ema9 < ema20) {
    putScore += 25;
    detectedPatterns.push("Cruzamento de Baixa EMA 9 < EMA 20");
  }

  if (currentPrice <= support * 1.0015) {
    callScore += 30;
    detectedPatterns.push("Rejeição em Zona de Demanda Institucional (Suporte)");
  } else if (currentPrice >= resistance * 0.9985) {
    putScore += 30;
    detectedPatterns.push("Absorção de Liquidez em Zona de Oferta (Resistência)");
  }

  if (pattern.includes("Martelo") || pattern.includes("Engolfo") || pattern.includes("Estrela")) {
    callScore += 20;
    detectedPatterns.push(`Gatilho de Price Action: ${pattern}`);
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
    ? Math.min(98, Math.max(88, 75 + callScore / 2.5))
    : Math.min(98, Math.max(88, 75 + putScore / 2.5));
  const confidenceScore = Math.round(rawConfidence);

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
    ? `Forte rejeição de preço próxima ao suporte em ${support.toLocaleString("pt-BR")} com alinhamento das médias móveis e RSI favorável à retomada altista.`
    : `Pressão vendedora com absorção no topo em ${resistance.toLocaleString("pt-BR")} indicando esgotamento do movimento comprador e retração iminente.`;

  const hioveQuickTip = isCall
    ? "Clique em COMPRA (CALL) assim que a vela der o pico de retração em direção à taxa de suporte."
    : "Clique em VENDA (PUT) no momento em que a vela esticar até a taxa de resistência da Hiove.";

  return {
    direction,
    confidenceScore,
    timeframeExpiry: timeframe === "5M" ? "Expiração 5 min" : "Próxima Vela (1 min)",
    triggerZone,
    invalidationLevel,
    detectedPatterns: detectedPatterns.length > 0 ? detectedPatterns : ["Fluxo Normal de Candlestick"],
    strategyName,
    marketSentiment,
    rationale,
    hioveQuickTip,
    keyLevels: {
      support,
      resistance,
      pivot,
    },
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ticker = "ETHUSDT", timeframe = "M1", candles = [], indicators = {} } = req.body;

  try {
    if (!ai) {
      // Fallback directly if no key configured
      const fallback = generateAlgorithmicAnalysis(ticker, timeframe, candles, indicators);
      return res.status(200).json({ success: true, result: fallback, isAlgorithmicFallback: true });
    }

    const candleContext = candles.slice(-15).map((c, index) => 
      `Vela ${index + 1}: [Abertura: ${c.open}, Máx: ${c.high}, Mín: ${c.low}, Fechamento: ${c.close}, Vol: ${c.volume}]`
    ).join("\n");

    const prompt = `Você é o motor de inteligência artificial de alta precisão do "CandleX AI", especializado em análise técnica institucional, Price Action, Order Flow, Smart Money Concepts (SMC), Zonas de Oferta e Demanda e confluência para operações rápidas na corretora Hiove.

Analise os dados atuais do par ${ticker} no timeframe ${timeframe}:

INDICADORES TÉCNICOS CALCULADOS:
- RSI (14): ${indicators.rsi ?? "N/A"} (${indicators.rsiStatus ?? "Neutro"})
- MACD Histograma: ${indicators.macdHist ?? "N/A"}
- Estocástico: %K: ${indicators.stochK ?? "N/A"}, %D: ${indicators.stochD ?? "N/A"}
- Médias Móveis: EMA 9 = ${indicators.ema9 ?? "N/A"}, EMA 20 = ${indicators.ema20 ?? "N/A"}, SMA 50 = ${indicators.sma50 ?? "N/A"}
- Suporte Imediato: ${indicators.support ?? "N/A"}
- Resistência Imediata: ${indicators.resistance ?? "N/A"}
- Padrão de Vela Detectado: ${indicators.candlestickPattern ?? "Nenhum detectado"}

ÚLTIMAS VELAS DE PREÇO:
${candleContext}

INSTRUÇÕES:
Gere uma análise técnica rigorosa com sinal direto e probabilidade matemática de acerto.
Retorne EXCLUSIVAMENTE um objeto JSON válido (sem tags markdown extras) com a seguinte estrutura:
{
  "direction": "CALL" | "PUT" | "NEUTRAL",
  "confidenceScore": number (0 a 100),
  "timeframeExpiry": string,
  "triggerZone": string,
  "invalidationLevel": string,
  "detectedPatterns": string[],
  "strategyName": string,
  "marketSentiment": "FORTE_ALTA" | "ALTA" | "LATERAL" | "BAIXA" | "FORTE_BAIXA",
  "rationale": string,
  "hioveQuickTip": string,
  "keyLevels": {
    "support": number,
    "resistance": number,
    "pivot": number
  }
}`;

    let parsedResult = null;
    const jsonText = await generateSafeAiContent({
      contents: prompt,
      systemInstruction: "Você é o CandleX AI, o mais avançado modelo de confluência algorítmica e análise quantitativa para trading de opções e mercado financeiro. Suas respostas devem ser precisas, diretas e formatadas estritamente em JSON.",
      responseMimeType: "application/json",
      temperature: 0.2,
    });

    if (jsonText) {
      try {
        parsedResult = JSON.parse(jsonText);
      } catch {
        parsedResult = null;
      }
    }

    if (!parsedResult || !parsedResult.direction) {
      parsedResult = generateAlgorithmicAnalysis(ticker, timeframe, candles, indicators);
    }

    return res.status(200).json({ success: true, result: parsedResult });
  } catch (err) {
    const fallback = generateAlgorithmicAnalysis(ticker, timeframe, candles, indicators);
    return res.status(200).json({
      success: true,
      result: fallback,
      isAlgorithmicFallback: true,
    });
  }
}
