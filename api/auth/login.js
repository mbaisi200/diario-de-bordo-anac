import crypto from 'crypto';
import { query } from '../lib/db.js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(userId, username) {
  const payload = { userId, username, timestamp: Date.now() };
  const secret = process.env.JWT_SECRET || 'diario-bordo-secret-key-2024';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return Buffer.from(JSON.stringify(payload)).toString('base64') + '.' + signature;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    // Ensure tables exist
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE
      )
    `);

    // Create default user if not exists
    const existing = await query("SELECT id FROM users WHERE username = 'neto'");
    if (existing.length === 0) {
      const hash = crypto.createHash('sha256').update('123456').digest('hex');
      await query(
        "INSERT INTO users (id, username, password_hash, name) VALUES ($1, $2, $3, $4)",
        ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'neto', hash, 'Neto']
      );
    }

    // Find user
    const result = await query(
      'SELECT id, username, name, password_hash FROM users WHERE username = $1',
      [username]
    );

    if (result.length === 0) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    const user = result[0];
    const passwordHash = hashPassword(password);

    if (user.password_hash !== passwordHash) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user.id, user.username);

    return res.status(200).json({
      token,
      user: { id: user.id, username: user.username, name: user.name },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
}
