export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-tenant-id, x-timestamp'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { endpoint = '/auth/login', method = 'POST', token = null, payload = {}, targetHost = null } = req.body || {};
  const tenantId = "01JWYBZHW6DM9D7NKPBGJFDZEA";

  const host = targetHost ? targetHost.replace(/\/$/, '') : "https://broker-api.mybrokerdev.com";
  const targetUrl = `${host}${endpoint}`;

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-tenant-id': tenantId,
      'x-timestamp': String(Date.now()),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions = {
      method: method.toUpperCase(),
      headers,
    };

    if (method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') {
      fetchOptions.body = JSON.stringify(payload);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { text };
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Hiove proxy error:", error);
    return res.status(500).json({ error: error.message || 'Internal proxy error' });
  }
}
