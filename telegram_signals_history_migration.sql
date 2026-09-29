-- ========================================================
-- TELEGRAM SIGNALS HISTORY MIGRATION SCRIPT
-- Execute este script no SQL Editor do seu Painel do Supabase
-- ========================================================

CREATE TABLE IF NOT EXISTS public.telegram_signals_history (
  id TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'CALL' ou 'PUT'
  timeframe TEXT NOT NULL, -- '1M', '2M', '5M'
  result TEXT NOT NULL, -- 'WIN', 'LOSS', 'DOJI'
  timestamp BIGINT NOT NULL
);

-- Habilitar RLS e criar política de acesso simplificada
ALTER TABLE public.telegram_signals_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Telegram signals full access" ON public.telegram_signals_history;
CREATE POLICY "Telegram signals full access"
  ON public.telegram_signals_history FOR ALL USING (true) WITH CHECK (true);
