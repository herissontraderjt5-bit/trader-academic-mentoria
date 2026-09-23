import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fetchPublicCandles, generateAlgorithmicAnalysis } from '../src/components/CandleX/services/apiService.js';
import { calculateAllIndicators } from '../src/components/CandleX/utils/technicalIndicators.js';
import { telegramService } from '../src/services/telegramService.js';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

// Worker State
let telegramSettings: any = null;
let lastCancelTime = 0;
let signalBotSession = {
  wins: 0,
  losses: 0,
  dojis: 0,
  signalsGenerated: 0,
  workflow: { status: 'IDLE' } as any,
};
let trades: any[] = [];
let activeSession: 'MORNING' | 'AFTERNOON' | 'NIGHT' | null = null;
let dailyStats = { wins: 0, losses: 0, dojis: 0 };
let pairCooldowns: Record<string, number> = {};

let signalBotConfig = {
  enabled: true,
  timeframes: ['1m', '2m', '5m', '15m'],
  minAiConfidence: 70, // Lowered from 85 temporarily to prove it sends signals
};

function loadSignalBotConfig() {
  try {
    const configPath = path.join(process.cwd(), 'signalBotConfig.json');
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(data);
      signalBotConfig = { ...signalBotConfig, ...parsed, timeframes: parsed.timeframes || signalBotConfig.timeframes };
    }
  } catch (e) {
    // ignore
  }
}

async function generateSafeAiContent(prompt: string) {
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Você é o CandleX AI, o mais avançado modelo de análise quantitativa. Suas respostas devem ser precisas, formatadas estritamente em JSON.",
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });
    return response?.text ? response.text.trim() : null;
  } catch (e) {
    console.error("AI Generation Error:", e);
    return null;
  }
}

// Fallback algorithm logic (simplified or ported from api/ai/analyze.js)
// For brevity and to avoid duplicating 600 lines, we strongly rely on Gemini
// If you want the full algorithmic fallback, it should be extracted to a shared file.

async function fetchSettings() {
  const { data, error } = await supabase.from('telegram_signal_settings').select('*').eq('id', 'default').single();
  if (error || !data) return null;
  return {
    id: data.id,
    botToken: data.bot_token,
    channelId: data.channel_id,
    allowedPairs: data.allowed_pairs || [],
    morningStartTime: data.morning_start_time,
    morningEndTime: data.morning_end_time,
    afternoonStartTime: data.afternoon_start_time,
    afternoonEndTime: data.afternoon_end_time,
    nightStartTime: data.night_start_time,
    nightEndTime: data.night_end_time,
    startMessageTemplate: data.start_message_template,
    endMessageTemplate: data.end_message_template,
    dailyResultMessageTemplate: data.daily_result_message_template,
    preAlertMessageTemplate: data.pre_alert_message_template,
    confirmationMessageTemplate: data.confirmation_message_template,
    preAlertMinutes: data.pre_alert_minutes ?? 1,
    martingaleLevel: data.martingale_level ?? 0,
    emojiWin: data.emoji_win || "✅",
    emojiLoss: data.emoji_loss || "❌",
    emojiDoji: data.emoji_doji || "➖",
    winStickerId: data.win_sticker_id,
    lossStickerId: data.loss_sticker_id,
    dojiStickerId: data.doji_sticker_id,
    isActive: data.is_active ?? false,
  };
}

const getCurrentSession = (settings: any): 'MORNING' | 'AFTERNOON' | 'NIGHT' | null => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const parseTime = (timeStr: string) => {
    if (!timeStr) return -1;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const inWindow = (start: string, end: string) => {
    if (!start || !end) return false;
    const s = parseTime(start);
    const e = parseTime(end);
    if (s > e) return currentMinutes >= s || currentMinutes <= e;
    return currentMinutes >= s && currentMinutes <= e;
  };

  if (inWindow(settings.morningStartTime, settings.morningEndTime)) return 'MORNING';
  if (inWindow(settings.afternoonStartTime, settings.afternoonEndTime)) return 'AFTERNOON';
  if (inWindow(settings.nightStartTime, settings.nightEndTime)) return 'NIGHT';
  return null;
};

const cleanPair = (pair: string) => pair.replace('/', '').replace(' (OTC)', '_OTC').trim();

async function runWorkerLoop() {
  console.log('Worker loop tick...');
  loadSignalBotConfig();
  
  telegramSettings = await fetchSettings();
  if (!telegramSettings || !telegramSettings.isActive || !signalBotConfig.enabled) {
    console.log('Bot is disabled or settings not found. Sleeping...');
    return;
  }
  
  console.log(`Bot is ACTIVE! Checking time windows... allowedPairs length: ${telegramSettings.allowedPairs?.length}`);
  const currentSession = getCurrentSession(telegramSettings);
  const currentlyInWindow = currentSession !== null;
  console.log(`currentlyInWindow: ${currentlyInWindow}, session: ${currentSession}`);
  
  const endActiveSession = async (endedSession: string) => {
    if (telegramSettings.endMessageTemplate) {
       let endMsg = telegramSettings.endMessageTemplate;
       const wins = signalBotSession.wins;
       const losses = signalBotSession.losses;
       const dojis = signalBotSession.dojis;
       const total = wins + losses + dojis;
       const assertividade = total > 0 ? Math.round((wins / total) * 100) : 0;

       endMsg = endMsg.replace(/{WINS}/g, wins.toString());
       endMsg = endMsg.replace(/{LOSSES}/g, losses.toString());
       endMsg = endMsg.replace(/{ASSERTIVIDADE}/g, assertividade.toString());
       await telegramService.sendMessage(telegramSettings, endMsg);
    }
    
    signalBotSession.wins = 0;
    signalBotSession.losses = 0;
    signalBotSession.dojis = 0;

    if (endedSession === 'NIGHT') {
       if (telegramSettings.dailyResultMessageTemplate) {
         let dailyMsg = telegramSettings.dailyResultMessageTemplate;
         const dWins = dailyStats.wins;
         const dLosses = dailyStats.losses;
         const dDojis = dailyStats.dojis;
         const dTotal = dWins + dLosses + dDojis;
         const dAssertividade = dTotal > 0 ? Math.round((dWins / dTotal) * 100) : 0;

         dailyMsg = dailyMsg.replace(/{WINS}/g, dWins.toString());
         dailyMsg = dailyMsg.replace(/{LOSSES}/g, dLosses.toString());
         dailyMsg = dailyMsg.replace(/{ASSERTIVIDADE}/g, dAssertividade.toString());
         
         await telegramService.sendMessage(telegramSettings, dailyMsg);
       }
       
       dailyStats.wins = 0;
       dailyStats.losses = 0;
       dailyStats.dojis = 0;
    }
  };

  if (currentSession !== null && activeSession === null) {
    activeSession = currentSession;
    if (telegramSettings.startMessageTemplate) {
       await telegramService.sendMessage(telegramSettings, telegramSettings.startMessageTemplate);
    }
  } else if (currentSession === null && activeSession !== null) {
    await endActiveSession(activeSession);
    activeSession = null;
  } else if (currentSession !== null && activeSession !== null && currentSession !== activeSession) {
    await endActiveSession(activeSession);
    activeSession = currentSession;
    if (telegramSettings.startMessageTemplate) {
       await telegramService.sendMessage(telegramSettings, telegramSettings.startMessageTemplate);
    }
  }

  if (!currentlyInWindow) {
    if (signalBotSession.workflow.status !== "IDLE") {
      signalBotSession.workflow = { status: "IDLE" };
    }
    return;
  }

  const workflow = signalBotSession.workflow;
  const now = Date.now();

  const formatTemplate = (template: string, ticker: string, tf: string, dir: string, targetTimestamp?: number) => {
    let msg = template || '';
    const tfMinutes = parseInt(tf.replace(/\D/g, '')) || 5;

    msg = msg.replace(/{TICKER}/g, ticker);
    msg = msg.replace(/{TIMEFRAME}/g, tf.toUpperCase());
    msg = msg.replace(/{TIMERFRAME}/g, tf.toUpperCase()); 
    msg = msg.replace(/{MINUTES}/g, tfMinutes.toString());
    
    const emojiDir = dir === "CALL" ? "🟩 COMPRA (CALL)" : "🟥 VENDA (PUT)";
    msg = msg.replace(/{DIRECTION}/g, emojiDir);

    if (targetTimestamp) {
      const entryDate = new Date(targetTimestamp);
      const expiryDate = new Date(targetTimestamp + (tfMinutes * 60 * 1000));
      const formatTime = (d: Date) => isNaN(d.getTime()) ? '--:--' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      msg = msg.replace(/{TIME}/g, formatTime(entryDate));
      msg = msg.replace(/{ENTRY_TIME}/g, formatTime(entryDate));
      msg = msg.replace(/{EXPIRY_TIME}/g, formatTime(expiryDate));
    }
    return msg;
  };

  if (workflow.status === "IDLE") {
    if (Date.now() - lastCancelTime < 60000) return;

    for (const pair of telegramSettings.allowedPairs) {
      const cleanPairName = cleanPair(pair);
      
      // Skip this pair if it is on cooldown (took a loss recently)
      if (pairCooldowns[cleanPairName] && Date.now() < pairCooldowns[cleanPairName]) {
         continue;
      }

      for (const tf of signalBotConfig.timeframes) {
        await new Promise(r => setTimeout(r, 200));
        try {
          // Normalize interval for Binance mapping
          const normInterval = tf.toLowerCase();
          const cands = await fetchPublicCandles(cleanPairName, normInterval, 60);
          if (!cands || cands.length === 0) continue;
          
          const inds = calculateAllIndicators(cands);
          
          // Local Algorithmic Analysis (Extremely fast, no API limits)
          const result = generateAlgorithmicAnalysis(cleanPairName, tf, cands, inds);
          console.log(`Scan ${cleanPairName} ${tf}: Dir=${result?.direction}, Conf=${result?.confidenceScore}% (min: ${signalBotConfig.minAiConfidence}%)`);
          
          if (result && result.direction !== "NEUTRAL" && result.confidenceScore >= signalBotConfig.minAiConfidence) {
            const tfMinutes = parseInt(tf.replace('m', '')) || 1;
            const currentMinute = new Date().getMinutes();
            const minutesToNextCandle = tfMinutes - (currentMinute % tfMinutes);
            const nextCandleTime = new Date();
            nextCandleTime.setMinutes(currentMinute + minutesToNextCandle, 0, 0);
            
            const targetTimestamp = nextCandleTime.getTime();
            const preAlertTime = targetTimestamp - ((telegramSettings.preAlertMinutes || 1) * 60 * 1000);

            console.log(`Checking pre-alert window: now=${new Date(now).toISOString()}, preAlertTime=${new Date(preAlertTime).toISOString()}, limit=${new Date(preAlertTime + 60000).toISOString()}`);

            if (now >= preAlertTime && now < preAlertTime + 60000) {
              const msg = formatTemplate(telegramSettings.preAlertMessageTemplate, cleanPairName, tf, result.direction, targetTimestamp);
              
              // Worker no canvas on pre-alert, send TEXT ONLY as requested by user
              await telegramService.sendMessage(telegramSettings, msg);

              signalBotSession.workflow = {
                status: "PRE_ALERT",
                activeTicker: cleanPairName,
                activeTimeframe: tf,
                activeDirection: result.direction,
                targetTime: targetTimestamp,
                galeCount: 0
              };
              return;
            }
          }
        } catch (e) {
          console.warn("Signal bot error scanning:", cleanPairName, e);
        }
      }
    }
  } else if (workflow.status === "PRE_ALERT") {
    // wait for confirmation time (10 seconds before)
    const confirmationTime = workflow.targetTime - 10000;
    console.log(`In PRE_ALERT state. now=${new Date(now).toISOString()}, confirmationTime=${new Date(confirmationTime).toISOString()}`);
    
    if (now >= confirmationTime) {
       // --- Regra Anti-Loss ---
       // Verifica se a vela atual (que está prestes a fechar) tem a mesma cor do sinal.
       const checkCands = await fetchPublicCandles(workflow.activeTicker, workflow.activeTimeframe, 2);
       if (checkCands && checkCands.length > 0) {
         const currentCandle = checkCands[checkCands.length - 1];
         const isGreen = currentCandle.close > currentCandle.open;
         const isRed = currentCandle.close < currentCandle.open;
         
         let isCanceled = false;
         let cancelReason = "";
         
         if (workflow.activeDirection === "CALL" && !isGreen) {
           isCanceled = true;
           cancelReason = "Vela de pré-entrada não está Verde (Alta).";
         } else if (workflow.activeDirection === "PUT" && !isRed) {
           isCanceled = true;
           cancelReason = "Vela de pré-entrada não está Vermelha (Baixa).";
         }
         
         if (isCanceled) {
           console.log(`Signal Canceled (Anti-Loss): ${workflow.activeTicker} ${workflow.activeDirection} - ${cancelReason}`);
           const cancelMsg = `❌ <b>SINAL CANCELADO</b> ❌\n\nAtivo: ${workflow.activeTicker}\nTempo: ${workflow.activeTimeframe.toUpperCase()}\nDireção: ${workflow.activeDirection === "CALL" ? "🟩 COMPRA (CALL)" : "🟥 VENDA (PUT)"}\n\n<b>Motivo:</b> Regra Anti-Loss (${cancelReason})`;
           await telegramService.sendMessage(telegramSettings, cancelMsg);
           
           signalBotSession.workflow = { status: "IDLE" };
           lastCancelTime = Date.now();
           return;
         }
       }
       // -----------------------

       // Confirmed
       const msg = formatTemplate(telegramSettings.confirmationMessageTemplate, workflow.activeTicker, workflow.activeTimeframe, workflow.activeDirection, workflow.targetTime);
       
       // Generate and send image on CONFIRMATION as requested
       try {
         const { generateChartImageBase64Node } = await import('./chartRendererNode.js');
         // We already fetched checkCands, but we need more candles for the chart
         const chartCands = await fetchPublicCandles(workflow.activeTicker, workflow.activeTimeframe, 60);
         const inds = calculateAllIndicators(chartCands);
         const photoBase64 = generateChartImageBase64Node({
           candles: chartCands,
           support: inds.support,
           resistance: inds.resistance,
         });
         
         if (photoBase64) {
           await telegramService.sendPhoto(telegramSettings, photoBase64, msg);
         } else {
           await telegramService.sendMessage(telegramSettings, msg);
         }
       } catch(e) {
         console.error("Error generating confirmation image", e);
         await telegramService.sendMessage(telegramSettings, msg);
       }

       const newTrade = {
         id: "sig_" + Date.now(),
         ticker: workflow.activeTicker,
         direction: workflow.activeDirection,
         entryPrice: 0, // Simplified
         stake: 10,
         result: "PENDING"
       };
       trades.unshift(newTrade);
       signalBotSession.workflow.status = "WAITING_RESULT";
    }
  } else if (workflow.status === "WAITING_RESULT") {
    const tfMinutes = parseInt(workflow.activeTimeframe.replace(/\D/g, '')) || 5;
    const expiryDurationMs = tfMinutes * 60 * 1000;
    const expiryTimestamp = workflow.targetTime + expiryDurationMs;
    
    if (now >= expiryTimestamp + 2000) {
       try {
         const pendingTradeIndex = trades.findIndex(t => t.result === "PENDING" && t.ticker === workflow.activeTicker);
         if (pendingTradeIndex < 0) {
           signalBotSession.workflow = { status: "IDLE" };
           return;
         }
         
         const cands = await fetchPublicCandles(workflow.activeTicker, workflow.activeTimeframe, 2);
         const closeCandle = cands && cands.length > 1 ? cands[cands.length - 2] : (cands && cands.length > 0 ? cands[0] : null);
         const expiryPrice = closeCandle?.close || 0;
         
         if (expiryPrice <= 0) return;
         
         const t = trades[pendingTradeIndex];
         if (t.entryPrice === 0 && cands && cands.length > 1) {
            t.entryPrice = cands[cands.length - 2].open; 
         }
         
         let outcome = "DRAW";
         const diff = expiryPrice - t.entryPrice;
         if (Math.abs(diff) <= 0.000001) outcome = "DRAW";
         else if (t.direction === "CALL") outcome = expiryPrice > t.entryPrice ? "WIN" : "LOSS";
         else outcome = expiryPrice < t.entryPrice ? "WIN" : "LOSS";
         
         t.result = outcome;
         
         const maxGale = telegramSettings?.martingaleLevel || 0;
         const currentGaleCount = workflow.galeCount || 0;
         
         if (outcome === "LOSS" && currentGaleCount < maxGale) {
            await telegramService.sendMessage(telegramSettings, `⚠️ <b>PREPARAR GALE ${currentGaleCount + 1}!</b>\nEntrem novamente para mesma direção.`);
            trades.unshift({ ...t, id: "sig_gale_" + Date.now(), result: "PENDING", stake: t.stake * 2 });
            signalBotSession.workflow.galeCount = currentGaleCount + 1;
            signalBotSession.workflow.targetTime = Date.now();
         } else {
            let emoji = outcome === "WIN" ? telegramSettings.emojiWin : (outcome === "LOSS" ? telegramSettings.emojiLoss : telegramSettings.emojiDoji);
            if (emoji.length > 15) emoji = outcome === "WIN" ? "✅" : "❌";
            let text = outcome === "WIN" ? "WIN" : (outcome === "LOSS" ? "LOSS" : "EMPATE / DOJI");
            
            const resultMsg = `${emoji} <b>RESULTADO FINAL: ${text}</b>\nPar: ${t.ticker}\nPreço Fechamento: ${expiryPrice}`;
            
            // Generate and send image on RESULT as requested
            try {
              const { generateChartImageBase64Node } = await import('./chartRendererNode.js');
              const fullCands = await fetchPublicCandles(workflow.activeTicker, workflow.activeTimeframe, 60);
              const inds = calculateAllIndicators(fullCands);
              const photoBase64 = generateChartImageBase64Node({
                candles: fullCands,
                support: inds.support,
                resistance: inds.resistance,
              });
              
              if (photoBase64) {
                await telegramService.sendPhoto(telegramSettings, photoBase64, resultMsg);
              } else {
                await telegramService.sendMessage(telegramSettings, resultMsg);
              }
            } catch(e) {
              console.error("Error generating result image", e);
              await telegramService.sendMessage(telegramSettings, resultMsg);
            }
            
            const stickerId = outcome === "WIN" ? telegramSettings.winStickerId : (outcome === "LOSS" ? telegramSettings.lossStickerId : telegramSettings.dojiStickerId);
            if (stickerId && stickerId.trim() !== '') {
               await telegramService.sendSticker(telegramSettings, stickerId);
            }
            
            if (outcome === "WIN") {
               signalBotSession.wins++;
               dailyStats.wins++;
            }
            if (outcome === "LOSS") {
               signalBotSession.losses++;
               dailyStats.losses++;
               // 1-hour cooldown to force switching asset
               pairCooldowns[t.ticker] = Date.now() + 60 * 60 * 1000; 
            }
            if (outcome === "DRAW") {
               signalBotSession.dojis++;
               dailyStats.dojis++;
            }
            signalBotSession.workflow = { status: "IDLE" };
         }
       } catch (e) {
         console.warn("Resolve error", e);
         signalBotSession.workflow = { status: "IDLE" };
       }
    }
  }
}

// Start worker loop
console.log("Starting CandleX Signal Bot Worker...");
setInterval(runWorkerLoop, 15000);
runWorkerLoop();
