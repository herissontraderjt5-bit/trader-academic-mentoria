// Gemini service using direct fetch to the Gemini 2.5 Flash API

const getApiKey = (): string => {
  // Check for process.env (injected by Vite define config) or standard VITE_ variable
  const apiKey = (process.env as any).GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  return apiKey.trim();
};

export const geminiService = {
  isConfigured(): boolean {
    return getApiKey() !== '';
  },

  async askMentor(question: string, lessonTitle: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('API Key do Gemini não configurada. Por favor, adicione GEMINI_API_KEY no arquivo .env.local ou .env.');
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      const systemInstruction = `Você é o Trader AI Mentor, um mentor especialista em trading, mercado financeiro, análise técnica, gestão de risco e psicologia do trader para a plataforma "Trader Academic".
Você está respondendo à pergunta de um aluno na página da aula intitulada "${lessonTitle}".
Responda de forma profissional, didática, motivadora e focada em trading e na aula atual. Seja direto, dê exemplos claros e use formatação Markdown simples (negrito, listas, etc.).
Sempre lembre o aluno de seguir o gerenciamento de risco e de praticar no simulador antes de colocar dinheiro real. Responda em português do Brasil.`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: question,
                },
              ],
            },
          ],
          systemInstruction: {
            parts: [
              {
                text: systemInstruction
              }
            ]
          },
          generationConfig: {
            temperature: 0.7,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Erro HTTP! Status: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui obter uma resposta.';
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }
};
