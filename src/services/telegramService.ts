import { TelegramSignalSettings } from '../types';

export const telegramService = {
  async sendMessage(settings: TelegramSignalSettings, text: string): Promise<{ success: boolean; message?: string }> {
    if (!settings.isActive) {
      return { success: false, message: 'O envio de sinais está desativado nas configurações.' };
    }
    if (!settings.botToken || !settings.channelId) {
      return { success: false, message: 'Token ou ID do Canal não configurados.' };
    }

    try {
      const url = `https://api.telegram.org/bot${settings.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: settings.channelId,
          text: text,
          parse_mode: 'HTML',
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        return { success: false, message: data.description || 'Erro da API do Telegram.' };
      }

      return { success: true };
    } catch (e: any) {
      console.error('Error sending Telegram message:', e);
      return { success: false, message: e.message || 'Erro de conexão.' };
    }
  },

  async sendTestSignal(settings: TelegramSignalSettings): Promise<{ success: boolean; message?: string }> {
    const text = `
<b>🔔 TESTE DE SINAL CANDLEX-IA</b>
Par Permitido Exemplo: ${settings.allowedPairs[0] || 'EUR/USD'}
Horário da Manhã: ${settings.morningStartTime} - ${settings.morningEndTime}

<i>Se você está vendo esta mensagem, a integração foi configurada com sucesso!</i>

Testando Emojis:
${settings.emojiWin} Win
${settings.emojiLoss} Loss
${settings.emojiDoji} Doji
`;
    // We bypass the isActive check for the test
    const testSettings = { ...settings, isActive: true };
    return this.sendMessage(testSettings, text);
  }
};
