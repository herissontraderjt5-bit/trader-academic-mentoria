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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated or anon" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated or anon"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile or admins can update any" ON public.profiles;
CREATE POLICY "Users can update their own profile or admins can update any"
  ON public.profiles FOR UPDATE USING (
    auth.uid()::text = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can insert their own profile or admins" ON public.profiles;
CREATE POLICY "Users can insert their own profile or admins"
  ON public.profiles FOR INSERT WITH CHECK (true);

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
CREATE POLICY "User progress viewable by owner or admin"
  ON public.user_progress FOR SELECT USING (
    auth.uid()::text = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

DROP POLICY IF EXISTS "User progress editable by owner or admin" ON public.user_progress;
CREATE POLICY "User progress editable by owner or admin"
  ON public.user_progress FOR ALL USING (
    auth.uid()::text = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

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
CREATE POLICY "User notes viewable by owner"
  ON public.user_notes FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "User notes editable by owner" ON public.user_notes;
CREATE POLICY "User notes editable by owner"
  ON public.user_notes FOR ALL USING (auth.uid()::text = user_id);

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
  is_new BOOLEAN DEFAULT false,
  is_live_module BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Modules viewable by everyone" ON public.modules;
CREATE POLICY "Modules viewable by everyone"
  ON public.modules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Modules manageable by admins" ON public.modules;
CREATE POLICY "Modules manageable by admins"
  ON public.modules FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

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
CREATE POLICY "Lessons viewable by everyone"
  ON public.lessons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lessons manageable by admins" ON public.lessons;
CREATE POLICY "Lessons manageable by admins"
  ON public.lessons FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

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
CREATE POLICY "Materials viewable by everyone"
  ON public.materials FOR SELECT USING (true);

DROP POLICY IF EXISTS "Materials manageable by admins" ON public.materials;
CREATE POLICY "Materials manageable by admins"
  ON public.materials FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

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
  ON public.lesson_comments FOR ALL USING (
    auth.uid()::text = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

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
CREATE POLICY "Announcements viewable by everyone"
  ON public.announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Announcements manageable by admins" ON public.announcements;
CREATE POLICY "Announcements manageable by admins"
  ON public.announcements FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

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
CREATE POLICY "Live sessions viewable by everyone"
  ON public.live_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Live sessions manageable by admins" ON public.live_sessions;
CREATE POLICY "Live sessions manageable by admins"
  ON public.live_sessions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

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
CREATE POLICY "Journal entries viewable by owner or admin"
  ON public.trade_journal FOR SELECT USING (
    auth.uid()::text = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

DROP POLICY IF EXISTS "Journal entries editable by owner or admin" ON public.trade_journal;
CREATE POLICY "Journal entries editable by owner or admin"
  ON public.trade_journal FOR ALL USING (
    auth.uid()::text = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings viewable by everyone" ON public.platform_settings;
CREATE POLICY "Settings viewable by everyone"
  ON public.platform_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Settings manageable by admins" ON public.platform_settings;
CREATE POLICY "Settings manageable by admins"
  ON public.platform_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

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
    'student',
    'Free',
    'Ativo',
    CURRENT_DATE
  )
  ON CONFLICT (id) DO NOTHING;

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
INSERT INTO public.platform_settings (id, platform_name, mentor_name, tagline, support_whatsapp, telegram_vip_url, discord_vip_url, instagram_url, banner_headline, banner_subtext, primary_color)
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
  '#ff6b00'
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
)
ON CONFLICT (id) DO NOTHING;
