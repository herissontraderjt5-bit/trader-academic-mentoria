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

  const { message = "", context = {} } = req.body;

  try {
    if (!ai) {
      // Direct fallback response if no key is configured
      let reply = "";
      if (message.toLowerCase().includes("soros")) {
        reply = `**Gerenciamento Soros no CandleX AI:**
O método Soros consiste em reinvestir o lucro das operações anteriores para maximizar ganhos com risco controlado:
1. **Nível 1:** Entrada de 2% da banca.
2. **Nível 2:** Entrada com o lucro da primeira ordem + stake inicial.
3. Se acertar 2 a 3 mãos, volte para a mão base ou finalize a meta do dia (**Stop Win**).`;
      } else {
        reply = `Dica CandleX: Mantenha a disciplina de gerenciamento e aguarde sinais com confluência superior a 75% para operar na corretora Hiove.`;
      }
      return res.status(200).json({ success: true, reply });
    }

    const systemInstruction = `Você é o Assistente Virtual CandleX AI, mentor de alta precisão para traders da corretora Hiove.
Forneça respostas concisas, práticas, focadas em Price Action, gerenciamento de risco (Soros, Martingale moderado, Mão Fixa), identificação de padrões de vela e execução rápida.
Responda sempre em Português do Brasil com formatação elegante.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Contexto atual do mercado: ${JSON.stringify(context || {})}\n\nPergunta do trader: ${message}`,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    const reply = response?.text?.trim() || "Dica CandleX: Mantenha a disciplina de gerenciamento e aguarde sinais com confluência superior a 75% para operar na corretora Hiove.";

    return res.status(200).json({ success: true, reply });
  } catch (err) {
    return res.status(200).json({
      success: true,
      reply: `Dica CandleX: Mantenha a disciplina de gerenciamento e aguarde sinais com confluência superior a 75% para operar na corretora Hiove.`,
    });
  }
}
