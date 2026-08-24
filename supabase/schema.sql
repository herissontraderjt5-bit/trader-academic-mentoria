-- ==========================================
-- BESA / TRADER ACADEMIC - SUPABASE SCHEMA
-- Database Schema, RLS Policies & Initial Seed Data
-- ==========================================

-- Enable UUID Extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------
-- 1. PROFILES TABLE (Syncs with auth.users)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
  role TEXT NOT NULL DEFAULT 'student', -- 'student' | 'admin'
  tier TEXT NOT NULL DEFAULT 'Free', -- 'Free' | 'VIP'
  status TEXT NOT NULL DEFAULT 'Ativo', -- 'Ativo' | 'Pendente' | 'Bloqueado' | 'Expirado'
  joined_at DATE DEFAULT CURRENT_DATE,
  expires_at TIMESTAMP WITH TIME ZONE,
  whatsapp TEXT DEFAULT '',
  password TEXT DEFAULT '',
  trading_market TEXT DEFAULT '',
  trading_style TEXT DEFAULT '',
  daily_target TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  custom_allowed_module_ids TEXT[] DEFAULT '{}',
  referred_by_id TEXT REFERENCES public.profiles(id),
  referral_balance NUMERIC NOT NULL DEFAULT 0.00,
  total_earned NUMERIC NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by authenticated or anon" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile or admins can update any" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile or admins" ON public.profiles;
DROP POLICY IF EXISTS "Profiles full access" ON public.profiles;
CREATE POLICY "Profiles full access"
  ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Automatic Profile Creation Trigger for Supabase Auth Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  old_tier TEXT := 'Free';
  old_status TEXT := 'Ativo';
  old_role TEXT := 'student';
  old_modules TEXT[] := '{}';
  profile_exists BOOLEAN := false;
BEGIN
  -- Check if profile with same email exists (e.g. manually created by admin)
  SELECT true, tier, status, role, custom_allowed_module_ids 
  INTO profile_exists, old_tier, old_status, old_role, old_modules
  FROM public.profiles 
  WHERE LOWER(email) = LOWER(new.email)
  LIMIT 1;

  -- Delete the old profile if it exists to avoid duplicate email key violation
  IF profile_exists THEN
    DELETE FROM public.profiles WHERE LOWER(email) = LOWER(new.email);
  END IF;

  -- Insert new profile, preserving admin settings if they existed
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    avatar, 
    whatsapp, 
    role, 
    tier, 
    status, 
    joined_at, 
    terms_accepted, 
    terms_accepted_at,
    custom_allowed_module_ids
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(new.raw_user_meta_data->>'whatsapp', ''),
    COALESCE(old_role, CASE WHEN LOWER(new.email) IN ('viniciussestremmm@gmail.com', 'herisson.trader.jt5@gmail.com') THEN 'admin' ELSE 'student' END),
    COALESCE(old_tier, CASE WHEN LOWER(new.email) IN ('viniciussestremmm@gmail.com', 'herisson.trader.jt5@gmail.com') THEN 'VIP' ELSE 'Free' END),
    COALESCE(old_status, 'Ativo'),
    CURRENT_DATE,
    true,
    NOW(),
    COALESCE(old_modules, '{}')
  );

  -- Also initialize progress row
  INSERT INTO public.user_progress (user_id, completed_lesson_ids)
  VALUES (new.id, '{}')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------
-- 2. USER PROGRESS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed_lesson_ids TEXT[] DEFAULT '{}',
  last_watched_lesson_id TEXT,
  last_watched_module_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User progress viewable by owner or admin" ON public.user_progress;
DROP POLICY IF EXISTS "User progress editable by owner or admin" ON public.user_progress;
DROP POLICY IF EXISTS "User progress full access" ON public.user_progress;
CREATE POLICY "User progress full access"
  ON public.user_progress FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------
-- 3. USER NOTES TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User notes viewable by owner" ON public.user_notes;
DROP POLICY IF EXISTS "User notes editable by owner" ON public.user_notes;
DROP POLICY IF EXISTS "User notes full access" ON public.user_notes;
CREATE POLICY "User notes full access"
  ON public.user_notes FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------
-- 4. MODULES TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.modules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  description TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  category TEXT DEFAULT '',
  order_index INT NOT NULL DEFAULT 0,
  required_tier TEXT NOT NULL DEFAULT 'Free',
  badge_text TEXT DEFAULT '',
  price NUMERIC DEFAULT 0,
  is_new BOOLEAN DEFAULT false,
  is_live_module BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Modules viewable by everyone" ON public.modules;
DROP POLICY IF EXISTS "Modules manageable by admins" ON public.modules;
DROP POLICY IF EXISTS "Modules full access" ON public.modules;
CREATE POLICY "Modules full access"
  ON public.modules FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------
-- 5. LESSONS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  youtube_url TEXT DEFAULT '',
  duration_minutes INT DEFAULT 0,
  order_index INT NOT NULL DEFAULT 0,
  key_takeaways TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lessons viewable by everyone" ON public.lessons;
DROP POLICY IF EXISTS "Lessons manageable by admins" ON public.lessons;
DROP POLICY IF EXISTS "Lessons full access" ON public.lessons;
CREATE POLICY "Lessons full access"
  ON public.lessons FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------
-- 6. MATERIALS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.materials (
  id TEXT PRIMARY KEY,
  lesson_id TEXT REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'pdf',
  size TEXT DEFAULT ''
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Materials viewable by everyone" ON public.materials;
DROP POLICY IF EXISTS "Materials manageable by admins" ON public.materials;
DROP POLICY IF EXISTS "Materials full access" ON public.materials;
CREATE POLICY "Materials full access"
  ON public.materials FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------
-- 7. LESSON COMMENTS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  module_id TEXT REFERENCES public.modules(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT DEFAULT '',
  user_role TEXT DEFAULT 'student',
  text TEXT NOT NULL,
  likes INT DEFAULT 0,
  parent_id TEXT REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.lesson_comments;
CREATE POLICY "Comments viewable by everyone"
  ON public.lesson_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Comments insertable by authenticated users" ON public.lesson_comments;
CREATE POLICY "Comments insertable by authenticated users"
  ON public.lesson_comments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Comments manageable by author or admins" ON public.lesson_comments;
CREATE POLICY "Comments manageable by author or admins"
  ON public.lesson_comments FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------
-- 8. ANNOUNCEMENTS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'update',
  link_text TEXT DEFAULT '',
  link_url TEXT DEFAULT '',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Announcements viewable by everyone" ON public.announcements;
DROP POLICY IF EXISTS "Announcements manageable by admins" ON public.announcements;
DROP POLICY IF EXISTS "Announcements full access" ON public.announcements;
CREATE POLICY "Announcements full access"
  ON public.announcements FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------
-- 9. LIVE SESSIONS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT DEFAULT '',
  time TEXT DEFAULT '',
  topic TEXT DEFAULT '',
  status TEXT DEFAULT 'upcoming', -- 'upcoming' | 'live' | 'ended'
  youtube_url TEXT DEFAULT '',
  zoom_url TEXT DEFAULT '',
  instructor TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Live sessions viewable by everyone" ON public.live_sessions;
DROP POLICY IF EXISTS "Live sessions manageable by admins" ON public.live_sessions;
DROP POLICY IF EXISTS "Live sessions full access" ON public.live_sessions;
CREATE POLICY "Live sessions full access"
  ON public.live_sessions FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------
-- 10. TRADE JOURNAL TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.trade_journal (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  asset TEXT NOT NULL,
  type TEXT NOT NULL, -- 'BUY' | 'SELL'
  contracts NUMERIC NOT NULL DEFAULT 1,
  entry_price NUMERIC NOT NULL DEFAULT 0,
  exit_price NUMERIC NOT NULL DEFAULT 0,
  result_currency NUMERIC NOT NULL DEFAULT 0,
  setup_name TEXT DEFAULT '',
  outcome TEXT NOT NULL DEFAULT 'GAIN', -- 'GAIN' | 'LOSS' | 'BE'
  notes TEXT DEFAULT '',
  screenshot_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.trade_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Journal entries viewable by owner or admin" ON public.trade_journal;
DROP POLICY IF EXISTS "Journal entries editable by owner or admin" ON public.trade_journal;
CREATE POLICY "Journal entries full access"
  ON public.trade_journal FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------
-- 11. PLATFORM SETTINGS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  platform_name TEXT NOT NULL DEFAULT 'Trader Academic',
  mentor_name TEXT DEFAULT 'Mestre Trader & Equipe',
  tagline TEXT DEFAULT '',
  support_whatsapp TEXT DEFAULT '',
  telegram_vip_url TEXT DEFAULT '',
  discord_vip_url TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  banner_headline TEXT DEFAULT '',
  banner_subtext TEXT DEFAULT '',
  primary_color TEXT DEFAULT '#ff6b00',
  lifetime_price NUMERIC DEFAULT 499.90,
  referral_commission_percent NUMERIC NOT NULL DEFAULT 10.00,
  min_withdrawal_amount NUMERIC NOT NULL DEFAULT 50.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings viewable by everyone" ON public.platform_settings;
DROP POLICY IF EXISTS "Settings manageable by admins" ON public.platform_settings;
DROP POLICY IF EXISTS "Settings full access" ON public.platform_settings;
CREATE POLICY "Settings full access"
  ON public.platform_settings FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------
-- TRIGGER FOR AUTOMATIC PROFILE ON SUPABASE AUTH SIGNUP
-- ------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar, role, tier, status, joined_at)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'avatar', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'),
    CASE WHEN LOWER(NEW.email) IN ('viniciussestremmm@gmail.com', 'herisson.trader.jt5@gmail.com') THEN 'admin' ELSE 'student' END,
    CASE WHEN LOWER(NEW.email) IN ('viniciussestremmm@gmail.com', 'herisson.trader.jt5@gmail.com') THEN 'VIP' ELSE 'Free' END,
    'Ativo',
    CURRENT_DATE
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    tier = EXCLUDED.tier;

  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id::text)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------
-- INITIAL SEED DATA
-- ------------------------------------------
INSERT INTO public.platform_settings (id, platform_name, mentor_name, tagline, support_whatsapp, telegram_vip_url, discord_vip_url, instagram_url, banner_headline, banner_subtext, primary_color, lifetime_price, referral_commission_percent, min_withdrawal_amount)
VALUES (
  'default',
  'Trader Academic',
  'Mestre Trader & Equipe',
  'Da Teoria à Consistência Operacional nos Mercados Financeiros',
  '5511999999999',
  'https://t.me/traderacademicvip',
  'https://discord.gg/traderacademic',
  'https://instagram.com/traderacademic',
  'DOMINE O MERCADO COM MÉTODO E DISCIPLINA',
  'Acesse o curso gratuito de Opções Binárias e faça o upgrade para a Formação Completa VIP por apenas R$ 499,90.',
  '#ff6b00',
  499.90,
  10.00,
  50.00
)
ON CONFLICT (id) DO NOTHING;

-- Initial Modules Seed
INSERT INTO public.modules (id, title, subtitle, description, cover_image, category, order_index, required_tier, badge_text, is_new, is_live_module)
VALUES 
(
  'mod-ob-free',
  'Módulo: Formação Completa em Opções Binárias',
  'Do Zero aos Primeiros Lucros • Estratégias M1, M5, Suporte, Resistência & Gestão',
  'Módulo 100% Liberado no Plano Free! Aprenda o funcionamento das corretoras (Pocket Option, Quotex, IQ Option), leitura de velas, gatilhos de retração, reversão, pullback e gestão matemática 2x1 sem gale.',
  'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=800&auto=format&fit=crop',
  'Opções Binárias (Free)',
  1,
  'Free',
  'PLANO FREE LIBERADO',
  true,
  false
),
(
  'mod-1',
  'Módulo 1: Boas-Vindas & Alinhamento de Expectativas VIP',
  'O mapa mental para a consistência e configuração de telas',
  'Entenda os pilares da mentoria avançada, mentalidade de alta performance no mercado e configure seu ambiente operacional (Profit, MetaTrader, TradingView) como um profissional.',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop',
  'Formação VIP',
  2,
  'VIP',
  'VIP (R$ 499,90)',
  false,
  false
),
(
  'mod-2',
  'Módulo 2: Fundamentos do Mercado B3 & Mini-Contratos',
  'Mini-Índice (WIN), Mini-Dólar (WDO) e Horários Nobres',
  'Compreenda a mecânica por trás da B3 e mercados futuros, precificação de contratos, pontuação, margens de garantia e horários institucionais.',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800&auto=format&fit=crop',
  'Mercado B3',
  3,
  'VIP',
  'VIP',
  false,
  false
),
(
  'mod-3',
  'Módulo 3: Price Action Avançado & Estrutura Institucional',
  'Leitura pura do gráfico, fractais, topos, fundos e gatilhos de alta precisão',
  'Aprenda a ler o contexto institucional sem se perder em indicadores confusos. Suportes e resistências dinâmicas, canais, lateralidades e rompimentos verdadeiros.',
  'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?q=80&w=800&auto=format&fit=crop',
  'Análise Técnica VIP',
  4,
  'VIP',
  'VIP',
  false,
  false
),
(
  'mod-4',
  'Módulo 4: Order Flow & Leitura de Fluxo (Tape Reading)',
  'Enxergando a pegada dos grandes bancos e tesourarias',
  'Vá além do gráfico e veja o rastro dos grandes players: agressão no Times & Trades, absorção no Book de Ofertas e Volume at Price.',
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=800&auto=format&fit=crop',
  'Tape Reading VIP',
  5,
  'VIP',
  'VIP EXCLUSIVO',
  true,
  false
),
(
  'mod-5',
  'Módulo 5: Setups Proprietários & Gerenciamento R$ 499 VIP',
  'Estratégias testadas com mais de 75% de assertividade e gestão 3:1',
  'Nossos 4 principais setups de entrada detalhados: Trap de Abertura, Reversão de VWAP, Pullback em Médias e Scalp no Dólar.',
  'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?q=80&w=800&auto=format&fit=crop',
  'Setups VIP',
  6,
  'VIP',
  'VIP',
  false,
  false
),
(
  'mod-6',
  'Módulo 6: Gravações de Salas Operacionais Ao Vivo & Indicadores',
  'Pregões reais comentados segundo a segundo e indicadores VIP para download',
  'Veja na prática como lemos o mercado ao vivo em dias de alta volatilidade com execução em tempo real e faça o download das regras de coloração.',
  'https://images.unsplash.com/photo-1516245834210-c4c142787335?q=80&w=800&auto=format&fit=crop',
  'Ao Vivo & Ferramentas',
  7,
  'VIP',
  'AO VIVO GRAVADO',
  true,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Initial Lessons Seed
INSERT INTO public.lessons (id, module_id, title, description, youtube_url, duration_minutes, order_index, key_takeaways)
VALUES
(
  'les-ob-1',
  'mod-ob-free',
  'Aula 01: Introdução às Opções Binárias & Criação de Conta',
  'Como funciona o mercado binário (Payout, Expiração, Paridades de Moedas OTC e Mercado Aberto). Configuração de gráficos e velas de 1 minuto.',
  'https://www.youtube.com/watch?v=kY31FpT-hOU',
  22,
  1,
  ARRAY['Nunca opere com mais de 2% do seu capital total por clique.', 'Evite horários de baixa volatilidade ou payouts abaixo de 80%.', 'Sempre marque suportes e resistências em tempos maiores (M15 / H1).']
),
(
  'les-ob-2',
  'mod-ob-free',
  'Aula 02: Price Action em M1 & M5 - Suporte, Resistência e Linhas de Tendência',
  'Aprenda a traçar zonas de retração de vela, falsos rompimentos e a importância do histórico de toques (máximo 3 toques).',
  'https://www.youtube.com/watch?v=F_3T216k5_U',
  32,
  2,
  ARRAY['Zonas com mais de 3 toques perdem a força de retenção.', 'Em M1 a confirmação do tempo de expiração deve ser ajustada antes do clique.']
),
(
  'les-ob-3',
  'mod-ob-free',
  'Aula 03: Estratégia de Pullback e Rompimento com Confirmação de Volume',
  'Como operar rompimentos verdadeiros e pegar a taxa no teste da região rompida.',
  'https://www.youtube.com/watch?v=r_s9s88h9b0',
  28,
  3,
  ARRAY['Aguardar o pullback tocar na região rompida.', 'Verificar se o volume confirma o rompimento.']
),
(
  'les-ob-4',
  'mod-ob-free',
  'Aula 04: Gestão de Banca 2x1 & Soros Nível 1 sem Martingale',
  'A matemática para ser lucrativo mesmo acertando 50% a 60% das operações, eliminando o risco de quebrar a banca.',
  'https://www.youtube.com/watch?v=b0VwJ3J5u34',
  25,
  4,
  ARRAY['Meta batida: pare imediatamente.', 'Limite diário de perda: 2 entradas erradas no dia.']
),
(
  'les-1-1',
  'mod-1',
  'Aula 01: Boas-vindas à Mentoria Trader Academic VIP',
  'Apresentação da metodologia, cronograma das aulas e como extrair o máximo do portal de membros.',
  'https://www.youtube.com/watch?v=kY31FpT-hOU',
  18,
  1,
  ARRAY['Assista os módulos na ordem cronológica recomendada.', 'Nunca opere na conta real antes de validar o gerenciamento de risco no simulador.', 'Participe dos plantões de dúvidas semanais.']
),
(
  'les-1-2',
  'mod-1',
  'Aula 02: Configuração Profissional do Profit Pro & Telas',
  'Passo a passo da montagem do layout operacional: Times & Trades, Livro Visual, SuperDOM e Gráficos de Candlestick e Renko.',
  'https://www.youtube.com/watch?v=F_3T216k5_U',
  34,
  2,
  ARRAY['Utilize o SuperDOM para envios rápidos de ordens OCO com stop automático.']
),
(
  'les-2-1',
  'mod-2',
  'Aula 01: Como Funciona o Mini-Índice (WIN) e Mini-Dólar (WDO)',
  'Variação em pontos, cálculo de ganho e perda por contrato, rollover de contratos e alavancagem inteligente.',
  'https://www.youtube.com/watch?v=r_s9s88h9b0',
  28,
  1,
  ARRAY['Mini-índice: R$ 0,20 por ponto por contrato.', 'Mini-dólar: R$ 10,00 por ponto por contrato.']
),
(
  'les-2-2',
  'mod-2',
  'Aula 02: Horários Nobres de Liquidez & Calendário Econômico',
  'Abertura do mercado à vista (10h), abertura de Nova York (10h30), Payroll, CPI e decisões de taxa de juros.',
  'https://www.youtube.com/watch?v=b0VwJ3J5u34',
  31,
  2,
  ARRAY['Evite operar 5 minutos antes e depois de notícias 3 touros / Payroll.']
),
(
  'les-3-1',
  'mod-3',
  'Aula 01: Identificação de Tendências Fortes vs Mercados Laterais',
  'Como classificar o estado do mercado logo nos primeiros 30 minutos de pregão.',
  'https://www.youtube.com/watch?v=F_3T216k5_U',
  42,
  1,
  ARRAY['Mercado em canal estreito: apenas opere a favor da tendência.', 'Mercado lateral: compre no fundo e venda no topo.']
),
(
  'les-3-2',
  'mod-3',
  'Aula 02: O Segredo dos Falsos Rompimentos (Traps Institucionais)',
  'Onde os amadores colocam o stop e como os grandes bancos exploram essa liquidez para entrar pesado.',
  'https://www.youtube.com/watch?v=r_s9s88h9b0',
  38,
  2,
  ARRAY['Aguardar o fechamento do candle fora da região antes de confirmar o rompimento.']
),
(
  'les-4-1',
  'mod-4',
  'Aula 01: Fundamentos de Tape Reading e Times & Trades',
  'Identificando agressão de compra e venda e lotes ocultos (Iceberg orders).',
  'https://www.youtube.com/watch?v=b0VwJ3J5u34',
  45,
  1,
  ARRAY['Agressão continuada com deslocamento de preço confirma intenção dos players.']
),
(
  'les-5-1',
  'mod-5',
  'Aula 01: Setup 01 - O Trap de Abertura no Mini-Índice',
  'Regras de entrada, stop técnico e alvos de 500 a 1000 pontos.',
  'https://www.youtube.com/watch?v=r_s9s88h9b0',
  48,
  1,
  ARRAY['Relação risco/retorno mínima de 3:1.']
),
(
  'les-6-1',
  'mod-6',
  'Sala 01: Operando o Payroll ao Vivo (+1.850 Pontos no WIN)',
  'Leitura da reação da taxa de desemprego dos EUA e execução precisa.',
  'https://www.youtube.com/watch?v=b0VwJ3J5u34',
  62,
  1,
  ARRAY['Aguarde a primeira barra de 5 minutos do Payroll se definir.']
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------
-- 12. WITHDRAWAL REQUESTS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  pix_key_type TEXT NOT NULL,
  pix_key TEXT NOT NULL,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente', -- 'Pendente' | 'Realizado' | 'Cancelado'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Withdrawal requests full access" ON public.withdrawal_requests;
CREATE POLICY "Withdrawal requests full access"
  ON public.withdrawal_requests FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------
-- 13. STORAGE BUCKET CONFIGURATION (Copy & paste in Supabase SQL Editor)
-- ------------------------------------------
-- 1. Criar o bucket público 'materials' se ele não existir
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('materials', 'materials', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- 2. Habilitar upload público para o bucket 'materials'
-- CREATE POLICY "Permitir upload para qualquer pessoa"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'materials');
--
-- 3. Habilitar leitura pública para o bucket 'materials'
-- CREATE POLICY "Permitir leitura pública"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'materials');


