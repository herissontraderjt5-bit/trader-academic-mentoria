import fetch from 'node-fetch';

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const HIOVE_KEY = process.env.HIOVE_KEY;
    if (!HIOVE_KEY) {
      console.error('HIOVE_KEY environment variable is missing.');
      return res.status(500).json({ error: 'Configuração do servidor ausente.' });
    }

    const r = await fetch('https://access.hiove.io/api/v1/access-check', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + HIOVE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!r.ok) {
      // Handle rate limits and errors
      return res.status(r.status).json({ 
        error: 'Não conseguimos validar agora, tente em alguns minutos.' 
      });
    }

    const data = await r.json();
    return res.status(200).json({ access: data.access === true });

  } catch (error) {
    console.error('Hiove access-check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
