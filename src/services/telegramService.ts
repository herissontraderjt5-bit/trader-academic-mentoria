import { TelegramSignalSettings } from '../types';

export const telegramService = {
  async sendMessage(settings: TelegramSignalSettings, text: string): Promise<{ success: boolean; message?: string }> {
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

  async sendSticker(settings: TelegramSignalSettings, stickerFileId: string): Promise<{ success: boolean; message?: string }> {
    if (!settings.botToken || !settings.channelId) {
      return { success: false, message: 'Token ou ID do Canal não configurados.' };
    }

    try {
      const url = `https://api.telegram.org/bot${settings.botToken}/sendSticker`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.channelId,
          sticker: stickerFileId,
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        return { success: false, message: data.description || 'Erro ao enviar sticker.' };
      }
      return { success: true };
    } catch (e: any) {
      console.error('Error sending Telegram sticker:', e);
      return { success: false, message: e.message || 'Erro de conexão.' };
    }
  },

  async sendPhoto(settings: TelegramSignalSettings, photoBase64: string, caption?: string): Promise<{ success: boolean; message?: string }> {
    if (!settings.botToken || !settings.channelId) {
      return { success: false, message: 'Token ou ID do Canal não configurados.' };
    }

    try {
      const url = `https://api.telegram.org/bot${settings.botToken}/sendPhoto`;

      if (photoBase64.startsWith('http')) {
        // Send as JSON for URLs
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: settings.channelId,
            photo: photoBase64,
            caption: caption,
            parse_mode: 'HTML'
          }),
        });
        const data = await response.json();
        if (!data.ok) {
          return { success: false, message: data.description || 'Erro ao enviar foto.' };
        }
        return { success: true };
      }

      // Send as FormData for Base64 (canvas rendered images)
      const formData = new FormData();
      formData.append('chat_id', settings.channelId);

      const base64Data = photoBase64.split(',')[1] || photoBase64;
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      const blob = new Blob(byteArrays, { type: 'image/png' });
      formData.append('photo', blob, 'chart.png');

      if (caption) {
        formData.append('caption', caption);
        formData.append('parse_mode', 'HTML');
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!data.ok) {
        return { success: false, message: data.description || 'Erro ao enviar foto.' };
      }
      return { success: true };
    } catch (e: any) {
      console.error('Error sending Telegram photo:', e);
      return { success: false, message: e.message || 'Erro de conexão.' };
    }
  },

  isStickerId(text: string): boolean {
    // Basic heuristic: Telegram file IDs are long strings without spaces
    return text && text.length > 20 && !text.includes(' ');
  },

  async sendTestSignal(settings: TelegramSignalSettings): Promise<{ success: boolean; message?: string }> {
    const formatEmojiDisplay = (emoji: string) => this.isStickerId(emoji) ? "🖼️ Sticker/Imagem" : emoji;

    const text = `
<b>🔔 TESTE DE SINAL CANDLEX-IA</b>
Par Permitido Exemplo: ${settings.allowedPairs[0] || 'EUR/USD'}
Horário da Manhã: ${settings.morningStartTime} - ${settings.morningEndTime}

<i>Se você está vendo esta mensagem, a integração foi configurada com sucesso!</i>

Testando Configuração de Resultados:
${formatEmojiDisplay(settings.emojiWin)} Win
${formatEmojiDisplay(settings.emojiLoss)} Loss
${formatEmojiDisplay(settings.emojiDoji)} Doji
`;
    // We bypass the isActive check for the test
    const testSettings = { ...settings, isActive: true };
    
    // Test sending stickers if they are configured as file IDs
    if (this.isStickerId(settings.emojiWin)) await this.sendSticker(testSettings, settings.emojiWin);
    if (this.isStickerId(settings.emojiLoss)) await this.sendSticker(testSettings, settings.emojiLoss);
    if (this.isStickerId(settings.emojiDoji)) await this.sendSticker(testSettings, settings.emojiDoji);

    return this.sendMessage(testSettings, text);
  }
};
