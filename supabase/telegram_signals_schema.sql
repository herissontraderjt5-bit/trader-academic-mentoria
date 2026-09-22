-- ==========================================
-- TELEGRAM SIGNALS SETTINGS SCHEMA
-- ==========================================

CREATE TABLE IF NOT EXISTS public.telegram_signal_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  bot_token TEXT DEFAULT '',
  channel_id TEXT DEFAULT '',
  allowed_pairs TEXT[] DEFAULT '{"EUR/USD", "GBP/USD", "USD/JPY"}',
  morning_start_time TEXT DEFAULT '08:00',
  morning_end_time TEXT DEFAULT '12:00',
  afternoon_start_time TEXT DEFAULT '13:00',
  afternoon_end_time TEXT DEFAULT '18:00',
  night_start_time TEXT DEFAULT '19:00',
  night_end_time TEXT DEFAULT '23:00',
  start_message_template TEXT DEFAULT 'Bom dia Traders! Iniciando as operações do dia.',
  end_message_template TEXT DEFAULT 'Fim das operações da sessão. Relatório parcial:',
  daily_result_message_template TEXT DEFAULT 'RESULTADO DO DIA!\nWins: {WINS} | Losses: {LOSSES} | Assertividade: {ASSERTIVIDADE}%',
  pre_alert_message_template TEXT DEFAULT 'Atenção! Possível sinal de {DIRECTION} em {TICKER} - {TIMEFRAME}',
  confirmation_message_template TEXT DEFAULT 'SINAL CONFIRMADO! 🟢 Entrada: {DIRECTION} | Ativo: {TICKER} | Tempo: {TIMEFRAME}',
  pre_alert_minutes INTEGER DEFAULT 1,
  martingale_level INTEGER DEFAULT 0,
  emoji_win TEXT DEFAULT '✅',
  emoji_loss TEXT DEFAULT '❌',
  emoji_doji TEXT DEFAULT '🔄',
  is_active BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.telegram_signal_settings ENABLE ROW LEVEL SECURITY;

-- Policies (Viewable by everyone or just admins, let's make it full access for now to match other config tables, but ideally restricted to admins)
DROP POLICY IF EXISTS "Telegram signals settings full access" ON public.telegram_signal_settings;
CREATE POLICY "Telegram signals settings full access"
  ON public.telegram_signal_settings FOR ALL USING (true) WITH CHECK (true);

-- Insert default row
INSERT INTO public.telegram_signal_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;
