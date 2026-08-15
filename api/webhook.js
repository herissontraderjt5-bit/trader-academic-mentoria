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
      service: 'Universal Trader Academic Webhook Endpoint',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const body = req.body || {};
    
    // Auto-detect format (Cakto, Kiwify, Hotmart)
    const event = (body.event || body.webhook_event_type || body.order_status || '').toLowerCase();
    const data = body.data || body;
    const status = (data.status || body.order_status || '').toLowerCase();
    
    const customer = data.customer || body.Customer || body.buyer || {};
    const name = customer.name || customer.full_name || 'Aluno VIP';
    const email = (customer.email || '').trim().toLowerCase();
    const phone = customer.phone || customer.mobile || customer.checkout_phone || '';
    
    const product = data.product || body.Product || {};
    const productName = (product.name || product.product_name || 'VIP').toLowerCase();
    
    let tier = 'VIP';
    if (productName.includes('free')) {
      tier = 'Free';
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email do aluno não informado no payload.'
      });
    }

    const isPaid = status === 'paid' || status === 'approved' || event === 'order.paid' || event === 'order_approved' || event === 'purchase_approved';
    const isRefunded = status === 'refunded' || status === 'refund' || event === 'order.refunded' || event === 'order_refunded';

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
      service: 'universal_webhook',
      message: isRefunded 
        ? `Acesso do aluno ${email} foi revogado/bloqueado via Webhook.`
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
    console.error('Universal Webhook Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno ao processar Webhook'
    });
  }
}
