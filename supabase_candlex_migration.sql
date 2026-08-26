-- ========================================================
-- CANDLEX AI INTEGRATION MIGRATION SCRIPT
-- Execute este script no SQL Editor do seu Painel do Supabase
-- ========================================================

-- 1. Tabela de Banca (Configurações e saldo virtual de operações do CandleX)
CREATE TABLE IF NOT EXISTS public.candlex_bankroll (
  user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  initial_balance NUMERIC NOT NULL DEFAULT 500.00,
  current_balance NUMERIC NOT NULL DEFAULT 500.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  daily_stop_win NUMERIC NOT NULL DEFAULT 100.00,
  daily_stop_loss NUMERIC NOT NULL DEFAULT 50.00,
  base_stake_percent NUMERIC NOT NULL DEFAULT 2.00,
  strategy_mode TEXT NOT NULL DEFAULT 'SOROS',
  soros_level INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS e criar política de acesso simplificada condizente com o projeto
ALTER TABLE public.candlex_bankroll ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candlex bankroll full access" ON public.candlex_bankroll;
CREATE POLICY "Candlex bankroll full access"
  ON public.candlex_bankroll FOR ALL USING (true) WITH CHECK (true);

-- 2. Tabela de Configurações da Automação (Robô de IA do CandleX)
CREATE TABLE IF NOT EXISTS public.candlex_autotrader (
  user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  daily_stop_win NUMERIC NOT NULL DEFAULT 100.00,
  daily_stop_loss NUMERIC NOT NULL DEFAULT 50.00,
  stake_amount NUMERIC NOT NULL DEFAULT 10.00,
  min_payout NUMERIC NOT NULL DEFAULT 85.00,
  timeframe TEXT NOT NULL DEFAULT '1m',
  management_mode TEXT NOT NULL DEFAULT '2x1',
  min_ai_confidence NUMERIC NOT NULL DEFAULT 78.00,
  sound_alerts BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS e criar política de acesso
ALTER TABLE public.candlex_autotrader ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candlex autotrader full access" ON public.candlex_autotrader;
CREATE POLICY "Candlex autotrader full access"
  ON public.candlex_autotrader FOR ALL USING (true) WITH CHECK (true);

-- 3. Tabela do Diário de Trades (Histórico de Ordens executadas pelos alunos/IA)
CREATE TABLE IF NOT EXISTS public.candlex_trades (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  type TEXT NOT NULL, -- 'CALL' ou 'PUT'
  stake NUMERIC NOT NULL,
  payout_percent NUMERIC NOT NULL,
  result TEXT NOT NULL, -- 'WIN', 'LOSS', 'PENDING' ou 'DRAW'
  pnl NUMERIC NOT NULL,
  timestamp BIGINT NOT NULL,
  timeframe TEXT NOT NULL,
  strategy_used TEXT DEFAULT '',
  confidence_at_entry NUMERIC DEFAULT 0,
  notes TEXT DEFAULT ''
);

-- Habilitar RLS e criar política de acesso
ALTER TABLE public.candlex_trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candlex trades full access" ON public.candlex_trades;
CREATE POLICY "Candlex trades full access"
  ON public.candlex_trades FOR ALL USING (true) WITH CHECK (true);
