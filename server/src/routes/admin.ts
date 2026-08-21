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
    CREATE TABLE IF NOT EXISTS pilots (
      id UUID PRIMARY KEY,
      tenant_id UUID NOT NULL,
      user_id UUID,
      name VARCHAR(255) NOT NULL,
      license_number VARCHAR(50),
      license_type VARCHAR(50),
      medical_class VARCHAR(20),
      medical_expiry DATE,
      cpf VARCHAR(20),
      email VARCHAR(255),
      phone VARCHAR(30),
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  await sql(`
    CREATE TABLE IF NOT EXISTS aircrafts (
      id UUID PRIMARY KEY,
      tenant_id UUID NOT NULL,
      registration VARCHAR(10) NOT NULL,
      type VARCHAR(255) NOT NULL,
      model VARCHAR(255),
      manufacturer VARCHAR(255),
      category VARCHAR(50),
      year INTEGER,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  next();
});

router.get('/pilots', async (req: Request, res: Response) => {
  const auth = parseToken(req);
  if (!auth) { res.status(401).json({ error: 'Não autorizado' }); return; }
  if (!['admin', 'master'].includes(auth.role)) { res.status(403).json({ error: 'Permissão negada' }); return; }

  const tenantId = String(req.query.tenantId || auth.tenantId || '');
  if (!tenantId) { res.status(400).json({ error: 'Tenant não identificado' }); return; }

  try {
    const result = await sql(
      `SELECT p.*, u.username
       FROM pilots p
       LEFT JOIN users u ON u.id = p.user_id
       WHERE p.tenant_id = $1
       ORDER BY p.name ASC`,
      [tenantId]
    );
    res.json(result);
  } catch (error) {
    console.error('Admin pilots error:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

router.post('/pilots', async (req: Request, res: Response) => {
  const auth = parseToken(req);
  if (!auth) { res.status(401).json({ error: 'Não autorizado' }); return; }
  if (!['admin', 'master'].includes(auth.role)) { res.status(403).json({ error: 'Permissão negada' }); return; }

  const tenantId = String(req.query.tenantId || auth.tenantId || '');
  if (!tenantId) { res.status(400).json({ error: 'Tenant não identificado' }); return; }

  try {
    const { name, licenseNumber, licenseType, medicalClass, medicalExpiry, cpf, email, phone, username, password } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Nome do piloto é obrigatório' });
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

    const pilotId = crypto.randomUUID();
    const userId = crypto.randomUUID();

    await sql(
      `INSERT INTO users (id, username, password_hash, name, email, role, tenant_id)
       VALUES ($1, $2, $3, $4, $5, 'pilot', $6)`,
      [userId, username, hashPassword(password), name, email || null, tenantId]
    );

    const result = await sql(
      `INSERT INTO pilots (
         id, tenant_id, user_id, name, license_number, license_type,
         medical_class, medical_expiry, cpf, email, phone
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [pilotId, tenantId, userId, name, licenseNumber || null, licenseType || null, medicalClass || null, medicalExpiry || null, cpf || null, email || null, phone || null]
    );

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Admin pilots error:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

router.delete('/pilots', async (req: Request, res: Response) => {
  const auth = parseToken(req);
  if (!auth) { res.status(401).json({ error: 'Não autorizado' }); return; }
  if (!['admin', 'master'].includes(auth.role)) { res.status(403).json({ error: 'Permissão negada' }); return; }

  const tenantId = String(req.query.tenantId || auth.tenantId || '');
  if (!tenantId) { res.status(400).json({ error: 'Tenant não identificado' }); return; }

  try {
    const pilotId = String(req.query.pilotId || req.query.id || '');

    const pilot = await sql('SELECT * FROM pilots WHERE id = $1 AND tenant_id = $2', [pilotId, tenantId]);
    if (pilot.length === 0) {
      res.status(404).json({ error: 'Piloto não encontrado' });
      return;
    }

    if (pilot[0].user_id) {
      await sql('DELETE FROM users WHERE id = $1', [pilot[0].user_id]);
    }
    await sql('DELETE FROM pilots WHERE id = $1', [pilotId]);

    res.json({ ok: true });
  } catch (error) {
    console.error('Admin pilots error:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

router.get('/aircrafts', async (req: Request, res: Response) => {
  const auth = parseToken(req);
  if (!auth) { res.status(401).json({ error: 'Não autorizado' }); return; }
  if (!['admin', 'master'].includes(auth.role)) { res.status(403).json({ error: 'Permissão negada' }); return; }

  const tenantId = String(req.query.tenantId || auth.tenantId || '');
  if (!tenantId) { res.status(400).json({ error: 'Tenant não identificado' }); return; }

  try {
    const result = await sql(
      `SELECT * FROM aircrafts WHERE tenant_id = $1 ORDER BY registration ASC`,
      [tenantId]
    );
    res.json(result);
  } catch (error) {
    console.error('Admin aircrafts error:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

router.post('/aircrafts', async (req: Request, res: Response) => {
  const auth = parseToken(req);
  if (!auth) { res.status(401).json({ error: 'Não autorizado' }); return; }
  if (!['admin', 'master'].includes(auth.role)) { res.status(403).json({ error: 'Permissão negada' }); return; }

  const tenantId = String(req.query.tenantId || auth.tenantId || '');
  if (!tenantId) { res.status(400).json({ error: 'Tenant não identificado' }); return; }

  try {
    const { registration, type, model, manufacturer, category, year } = req.body;

    if (!registration || !type) {
      res.status(400).json({ error: 'Matrícula e tipo são obrigatórios' });
      return;
    }

    const id = crypto.randomUUID();
    const result = await sql(
      `INSERT INTO aircrafts (id, tenant_id, registration, type, model, manufacturer, category, year)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, tenantId, registration.toUpperCase(), type, model || null, manufacturer || null, category || null, year || null]
    );

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Admin aircrafts error:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

router.delete('/aircrafts', async (req: Request, res: Response) => {
  const auth = parseToken(req);
  if (!auth) { res.status(401).json({ error: 'Não autorizado' }); return; }
  if (!['admin', 'master'].includes(auth.role)) { res.status(403).json({ error: 'Permissão negada' }); return; }

  const tenantId = String(req.query.tenantId || auth.tenantId || '');
  if (!tenantId) { res.status(400).json({ error: 'Tenant não identificado' }); return; }

  try {
    const aircraftId = String(req.query.aircraftId || req.query.id || '');
    const result = await sql(
      'DELETE FROM aircrafts WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [aircraftId, tenantId]
    );
    if (result.length === 0) {
      res.status(404).json({ error: 'Aeronave não encontrada' });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Admin aircrafts error:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

export default router;