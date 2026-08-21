import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { sql } from '../lib/db.js';

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function parseToken(req: Request): { userId: string; role: string; tenantId: string | null } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const [payloadB64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    return { userId: payload.userId, role: payload.role || 'pilot', tenantId: payload.tenantId || null };
  } catch {
    return null;
  }
}

router.use(async (req, res, next) => {
  await sql(`
    CREATE TABLE IF NOT EXISTS admins (
      id UUID PRIMARY KEY,
      user_id UUID,
      company_name VARCHAR(255) NOT NULL,
      cnpj_cpf VARCHAR(20) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phones JSONB NOT NULL DEFAULT '[]',
      address JSONB NOT NULL DEFAULT '{}',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  next();
});

router.get('/admins', async (req: Request, res: Response) => {
  const auth = parseToken(req);
  if (!auth) { res.status(401).json({ error: 'Não autorizado' }); return; }
  if (auth.role !== 'master') { res.status(403).json({ error: 'Permissão negada' }); return; }

  try {
    const result = await sql(`
      SELECT a.*, u.username
      FROM admins a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC
    `);
    res.json(result);
  } catch (error) {
    console.error('Master admins error:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

router.post('/admins', async (req: Request, res: Response) => {
  const auth = parseToken(req);
  if (!auth) { res.status(401).json({ error: 'Não autorizado' }); return; }
  if (auth.role !== 'master') { res.status(403).json({ error: 'Permissão negada' }); return; }

  try {
    const { companyName, cnpjCpf, email, phones, address, username, password } = req.body;

    if (!companyName || !cnpjCpf || !email) {
      res.status(400).json({ error: 'Razão social, CNPJ/CPF e email são obrigatórios' });
      return;
    }
    if (!username || !password) {
      res.status(400).json({ error: 'Usuário e senha de acesso são obrigatórios' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
      return;
    }

    const usernameExists = await sql('SELECT id FROM users WHERE username = $1', [username]);
    if (usernameExists.length > 0) {
      res.status(409).json({ error: 'Este usuário já está em uso' });
      return;
    }

    const cnpjExists = await sql('SELECT id FROM admins WHERE cnpj_cpf = $1', [cnpjCpf]);
    if (cnpjExists.length > 0) {
      res.status(409).json({ error: 'Este CNPJ/CPF já está cadastrado' });
      return;
    }

    const adminId = crypto.randomUUID();
    const userId = crypto.randomUUID();

    await sql(
      `INSERT INTO users (id, username, password_hash, name, email, role, tenant_id)
       VALUES ($1, $2, $3, $4, $5, 'admin', $6)`,
      [userId, username, hashPassword(password), companyName, email, adminId]
    );

    const result = await sql(
      `INSERT INTO admins (id, user_id, company_name, cnpj_cpf, email, phones, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [adminId, userId, companyName, cnpjCpf, email, JSON.stringify(phones || []), JSON.stringify(address || {})]
    );

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Master admins error:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

router.delete('/admins', async (req: Request, res: Response) => {
  const auth = parseToken(req);
  if (!auth) { res.status(401).json({ error: 'Não autorizado' }); return; }
  if (auth.role !== 'master') { res.status(403).json({ error: 'Permissão negada' }); return; }

  try {
    const adminId = String(req.query.adminId || req.query.id || '');

    const admin = await sql('SELECT * FROM admins WHERE id = $1', [adminId]);
    if (admin.length === 0) {
      res.status(404).json({ error: 'Admin não encontrado' });
      return;
    }

    if (admin[0].user_id) {
      await sql('DELETE FROM users WHERE id = $1', [admin[0].user_id]);
    }
    await sql('DELETE FROM admins WHERE id = $1', [adminId]);

    res.json({ ok: true });
  } catch (error) {
    console.error('Master admins error:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

export default router;