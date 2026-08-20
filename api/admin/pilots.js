import crypto from 'crypto';
import { query } from '../lib/db.js';
import { hashPassword, requireAuth, setCors } from '../lib/auth.js';

export default async function handler(req, res) {
  if (!setCors(res)) return;

  const auth = requireAuth(req, res, ['admin', 'master']);
  if (!auth) return;

  const tenantId = req.query.tenantId || auth.tenantId;
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant não identificado' });
  }

  try {
    await query(`
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

    if (req.method === 'GET') {
      const result = await query(
        `SELECT p.*, u.username
         FROM pilots p
         LEFT JOIN users u ON u.id = p.user_id
         WHERE p.tenant_id = $1
         ORDER BY p.name ASC`,
        [tenantId]
      );
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const {
        name, licenseNumber, licenseType, medicalClass, medicalExpiry,
        cpf, email, phone, username, password,
      } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Nome do piloto é obrigatório' });
      }
      if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha de acesso são obrigatórios' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
      }

      const usernameExists = await query('SELECT id FROM users WHERE username = $1', [username]);
      if (usernameExists.length > 0) {
        return res.status(409).json({ error: 'Este usuário já está em uso' });
      }

      const pilotId = crypto.randomUUID();
      const userId = crypto.randomUUID();

      await query(
        `INSERT INTO users (id, username, password_hash, name, email, role, tenant_id)
         VALUES ($1, $2, $3, $4, $5, 'pilot', $6)`,
        [userId, username, hashPassword(password), name, email || null, tenantId]
      );

      const result = await query(
        `INSERT INTO pilots (
           id, tenant_id, user_id, name, license_number, license_type,
           medical_class, medical_expiry, cpf, email, phone
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          pilotId, tenantId, userId, name, licenseNumber || null,
          licenseType || null, medicalClass || null, medicalExpiry || null,
          cpf || null, email || null, phone || null,
        ]
      );

      return res.status(201).json(result[0]);
    }

    if (req.method === 'PUT') {
      const pilotId = req.query.pilotId || req.query.id;

      const existing = await query('SELECT * FROM pilots WHERE id = $1 AND tenant_id = $2', [pilotId, tenantId]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Piloto não encontrado' });
      }

      const {
        name, licenseNumber, licenseType, medicalClass, medicalExpiry,
        cpf, email, phone, active,
      } = req.body;

      const result = await query(
        `UPDATE pilots SET
           name = $2, license_number = $3, license_type = $4,
           medical_class = $5, medical_expiry = $6, cpf = $7,
           email = $8, phone = $9, active = $10, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          pilotId,
          name ?? existing[0].name,
          licenseNumber ?? existing[0].license_number,
          licenseType ?? existing[0].license_type,
          medicalClass ?? existing[0].medical_class,
          medicalExpiry ?? existing[0].medical_expiry,
          cpf ?? existing[0].cpf,
          email ?? existing[0].email,
          phone ?? existing[0].phone,
          active ?? existing[0].active,
        ]
      );

      return res.status(200).json(result[0]);
    }

    if (req.method === 'DELETE') {
      const pilotId = req.query.pilotId || req.query.id;

      const pilot = await query('SELECT * FROM pilots WHERE id = $1 AND tenant_id = $2', [pilotId, tenantId]);
      if (pilot.length === 0) {
        return res.status(404).json({ error: 'Piloto não encontrado' });
      }

      if (pilot[0].user_id) {
        await query('DELETE FROM users WHERE id = $1', [pilot[0].user_id]);
      }
      await query('DELETE FROM pilots WHERE id = $1', [pilotId]);

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin pilots error:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição' });
  }
}