import crypto from 'crypto';

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    tenantId: user.tenant_id || null,
    timestamp: Date.now(),
  };
  const secret = process.env.JWT_SECRET || 'diario-bordo-secret-key-2024';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return Buffer.from(JSON.stringify(payload)).toString('base64') + '.' + signature;
}

export function verifyToken(token) {
  try {
    const [payloadB64, signature] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf-8'));
    const secret = process.env.JWT_SECRET || 'diario-bordo-secret-key-2024';
    const expected = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify({ userId: payload.userId, username: payload.username, role: payload.role, tenantId: payload.tenantId || null, timestamp: payload.timestamp }))
      .digest('hex');
    if (expected !== signature) return null;
    return payload;
  } catch {
    return null;
  }
}

export function requireAuth(req, res, roles) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    res.status(401).json({ error: 'Não autorizado' });
    return null;
  }

  if (roles && !roles.includes(payload.role)) {
    res.status(403).json({ error: 'Permissão negada' });
    return null;
  }

  return payload;
}

export function setCors(res, methods = 'GET, POST, PUT, DELETE, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (res.req && res.req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }
  return true;
}