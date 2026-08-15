export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'Kiwify Webhook Integration Endpoint',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const body = req.body || {};
    
    // Parse Kiwify real payload format
    const event = (body.webhook_event_type || body.event || '').toLowerCase();
    const status = (body.order_status || '').toLowerCase();
    
    const customer = body.Customer || body.customer || {};
    const name = customer.full_name || customer.name || 'Aluno VIP';
    const email = (customer.email || '').trim().toLowerCase();
    const phone = customer.mobile || customer.phone || '';
    
    const product = body.Product || body.product || {};
    const productName = (product.product_name || product.name || 'VIP').toLowerCase();
    
    let tier = 'VIP';
    if (productName.includes('free')) {
      tier = 'Free';
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email do aluno não informado no payload enviado pela Kiwify.'
      });
    }

    const isPaid = status === 'paid' || status === 'approved' || event === 'order_approved';
    const isRefunded = status === 'refunded' || status === 'chargedback' || event === 'order_refunded';

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gopxkuvjwyxevyexhujs.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hocqoUx4wYq7lzbgIBb8gA_nT4JGoO1';

    const targetStatus = isRefunded ? 'Bloqueado' : 'Ativo';
    const targetTier = isPaid ? tier : 'Free';
    const userId = 'usr-wh-' + Buffer.from(email).toString('hex').slice(0, 16);

    const profileData = {
      id: userId,
      email: email,
      name: name,
      whatsapp: phone,
      tier: targetTier,
      status: targetStatus,
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
      joined_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    };

    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(profileData)
    });

    return res.status(200).json({
      success: true,
      gateway: 'kiwify',
      message: isRefunded 
        ? `Acesso do aluno ${email} foi revogado/bloqueado via Webhook Kiwify.`
        : `Acesso do aluno ${email} liberado com sucesso para o plano ${targetTier}!`,
      user: {
        id: userId,
        name: name,
        email: email,
        whatsapp: phone,
        tier: targetTier,
        status: targetStatus
      }
    });
  } catch (error) {
    console.error('Kiwify Webhook Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno ao processar Webhook da Kiwify'
    });
  }
}
