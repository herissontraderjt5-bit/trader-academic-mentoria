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

  const detectedPatterns = [];
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

  // Scale confidenceScore to range (50% - 98%) based strictly on the number of real confluences (N)
  const N = detectedPatterns.length;
  let rawConfidence = 50;
  if (N <= 1) {
    rawConfidence = 50 + N * 10;
  } else if (N === 2) {
    rawConfidence = 68.5;
  } else if (N === 3) {
    rawConfidence = 76.2;
  } else if (N === 4) {
    rawConfidence = 84.8;
  } else if (N === 5) {
    rawConfidence = 89.5;
  } else if (N === 6) {
    rawConfidence = 93.4;
  } else if (N === 7) {
    rawConfidence = 96.1;
  } else {
    rawConfidence = Math.min(98.0, 96.0 + (N - 7) * 0.5);
  }
  const confidenceScore = parseFloat(rawConfidence.toFixed(1));

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
IMPORTANTE: Você deve identificar e incluir MÚLTIPLAS confluências reais (apenas confluências técnicas reais presentes nos dados fornecidos: RSI, Estocástico, MACD, Bollinger, volume, suporte/resistência, médias móveis e padrões de vela) nos seus resultados sob a chave "detectedPatterns". Não liste confluências fictícias.
A taxa de assertividade ("confidenceScore") deve ser calculada de acordo com as confluências reais encontradas, variando estritamente entre 50% e 98% (poucas confluências reais geram assertividade mais próxima de 50%, enquanto forte confluência em vários indicadores gera até 98%).
Retorne EXCLUSIVAMENTE um objeto JSON válido (sem tags markdown extras) com a seguinte estrutura:
{
  "direction": "CALL" | "PUT" | "NEUTRAL",
  "confidenceScore": number (50 a 98),
  "timeframeExpiry": string,
  "triggerZone": string,
  "invalidationLevel": string,
  "detectedPatterns": string[], // Lista de confluências técnicas reais encontradas
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
        if (parsedResult && parsedResult.direction && parsedResult.direction !== "NEUTRAL") {
          // Force accuracy scaling 50% - 98% based strictly on number of real confluences returned by Gemini
          const confluences = parsedResult.detectedPatterns || [];
          const N = confluences.length;
          let rawConfidence = 50;
          if (N <= 1) {
            rawConfidence = 50 + N * 10;
          } else if (N === 2) {
            rawConfidence = 68.5;
          } else if (N === 3) {
            rawConfidence = 76.2;
          } else if (N === 4) {
            rawConfidence = 84.8;
          } else if (N === 5) {
            rawConfidence = 89.5;
          } else if (N === 6) {
            rawConfidence = 93.4;
          } else if (N === 7) {
            rawConfidence = 96.1;
          } else {
            rawConfidence = Math.min(98.0, 96.0 + (N - 7) * 0.5);
          }
          parsedResult.confidenceScore = parseFloat(rawConfidence.toFixed(1));
        }
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
