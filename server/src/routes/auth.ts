import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { sql } from '../lib/db.js';
import { initializeDatabase } from '../database.js';

const router = Router();

// Garantir que o banco está inicializado antes de qualquer requisição
let dbReady = false;
router.use(async (req, res, next) => {
  if (!dbReady) {
    await initializeDatabase();
    dbReady = true;
  }
  next();
});

/**
 * Hash password using SHA-256 (for demo - use bcrypt in production)
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Generate simple JWT-like token
 */
function generateToken(userId: string, username: string): string {
  const payload = { userId, username, timestamp: Date.now() };
  const secret = process.env.JWT_SECRET || 'diario-bordo-secret-key-2024';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return Buffer.from(JSON.stringify(payload)).toString('base64') + '.' + signature;
}

/**
 * Verify token
 */
function verifyToken(token: string): { userId: string; username: string } | null {
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return null;

    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
    const secret = process.env.JWT_SECRET || 'diario-bordo-secret-key-2024';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify({ userId: payload.userId, username: payload.username, timestamp: payload.timestamp }))
      .digest('hex');

    if (signature !== expectedSignature) return null;

    // Token expires in 7 days
    if (Date.now() - payload.timestamp > 7 * 24 * 60 * 60 * 1000) {
      return null;
    }

    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}

/**
 * POST /api/auth/login
 * Login with username and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
      return;
    }

    // Find user
    const result = await sql(
      'SELECT id, username, name, password_hash FROM users WHERE username = $1',
      [username]
    );

    if (result.length === 0) {
      res.status(401).json({ error: 'Usuário ou senha inválidos' });
      return;
    }

    const user = result[0];

    // Verify password
    const passwordHash = hashPassword(password);
    if (user.password_hash !== passwordHash) {
      res.status(401).json({ error: 'Usuário ou senha inválidos' });
      return;
    }

    // Update last login
    await sql('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Generate token
    const token = generateToken(user.id, user.username);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, name, email } = req.body;

    if (!username || !password || !name) {
      res.status(400).json({ error: 'Usuário, senha e nome são obrigatórios' });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({ error: 'Usuário deve ter pelo menos 3 caracteres' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
      return;
    }

    // Check if username exists
    const existing = await sql('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Nome de usuário já existe' });
      return;
    }

    // Create user
    const id = crypto.randomUUID();
    const passwordHash = hashPassword(password);

    await sql(
      'INSERT INTO users (id, username, password_hash, name, email) VALUES ($1, $2, $3, $4, $5)',
      [id, username, passwordHash, name, email || null]
    );

    // Generate token
    const token = generateToken(id, username);

    res.status(201).json({
      token,
      user: {
        id,
        username,
        name,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires token)
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({ error: 'Token inválido ou expirado' });
      return;
    }

    const result = await sql(
      'SELECT id, username, name, email, created_at FROM users WHERE id = $1',
      [payload.userId]
    );

    if (result.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

export default router;
export { verifyToken };
