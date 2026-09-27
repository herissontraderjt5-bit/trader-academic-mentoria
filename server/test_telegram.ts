import { telegramService } from '../src/services/telegramService.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function test() {
  const settings = {
    botToken: '8657810677:AAEdoTgJ9RanBVswXTvLJfGUREbgR2SsGuw',
    channelId: '-1003922322668',
  };
  console.log("Sending photo test...");
  const res = await telegramService.sendPhoto(settings, 'https://oqdbvbhxpejckppluais.supabase.co/storage/v1/object/public/materials/lessons/1790192086340-o8655lmt.png', 'Test start photo caption');
  console.log("Photo response:", res);

  console.log("Sending message test...");
  const msgRes = await telegramService.sendMessage(settings, `⏳ <b>SISTEMA ATIVADO</b>\nO robô está ligado e operando em segundo plano.`);
  console.log("Msg response:", msgRes);
}
test();
