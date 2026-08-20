import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oqdbvbhxpejckppluais.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return res.status(500).json({
      success: false,
      error: 'SUPABASE_SERVICE_ROLE_KEY não está configurado nas variáveis de ambiente da Vercel.'
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const email = 'herisson.trader.jt5@gmail.com';
    const newPassword = 'Trader@123';

    // 1. Get user ID from profiles
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (pError || !profile) {
      return res.status(404).json({
        success: false,
        error: 'Perfil não encontrado na tabela public.profiles.',
        details: pError
      });
    }

    // 2. Reset password via admin API
    const { data, error } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    );

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro no Supabase Auth admin API',
        details: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Senha redefinida com sucesso para ${email}!`,
      newPassword: newPassword
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
