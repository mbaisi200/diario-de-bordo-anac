import { query } from '../lib/db.js';
import { hashPassword, generateToken, setCors } from '../lib/auth.js';

export default async function handler(req, res) {
  if (!setCors(res, 'POST, OPTIONS')) return;

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
        role VARCHAR(20) NOT NULL DEFAULT 'pilot',
        tenant_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE
      )
    `);

    // Migrate existing table: add missing columns if they don't exist
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'pilot'`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID`);

    // Create master user (neto) if not exists
    const existing = await query("SELECT id FROM users WHERE username = 'neto'");
    if (existing.length === 0) {
      const hash = hashPassword('123456');
      await query(
        "INSERT INTO users (id, username, password_hash, name, role) VALUES ($1, $2, $3, $4, 'master')",
        ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'neto', hash, 'Neto']
      );
    } else {
      // Ensure neto is always master
      await query("UPDATE users SET role = 'master' WHERE username = 'neto'");
    }

    // Find user
    const result = await query(
      'SELECT id, username, name, password_hash, role, tenant_id, email FROM users WHERE username = $1',
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

    const token = generateToken(user);

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
}