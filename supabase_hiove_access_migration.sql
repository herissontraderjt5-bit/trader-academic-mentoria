-- Execute este script no SQL Editor do seu Supabase para adicionar a verificação da Hiove
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hiove_access BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hiove_email TEXT;
