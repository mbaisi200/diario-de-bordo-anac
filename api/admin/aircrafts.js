import crypto from 'crypto';
import { query } from '../lib/db.js';
import { requireAuth, setCors } from '../lib/auth.js';

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

    await query(`ALTER TABLE aircrafts ADD COLUMN IF NOT EXISTS tenant_id UUID`);
    await query(`ALTER TABLE aircrafts ADD COLUMN IF NOT EXISTS model VARCHAR(255)`);
    await query(`ALTER TABLE aircrafts ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255)`);
    await query(`ALTER TABLE aircrafts ADD COLUMN IF NOT EXISTS category VARCHAR(50)`);
    await query(`ALTER TABLE aircrafts ADD COLUMN IF NOT EXISTS year INTEGER`);
    await query(`ALTER TABLE aircrafts ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE`);
    await query(`ALTER TABLE aircrafts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);

    if (req.method === 'GET') {
      const result = await query(
        `SELECT * FROM aircrafts
         WHERE tenant_id = $1
         ORDER BY registration ASC`,
        [tenantId]
      );
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const { registration, type, model, manufacturer, category, year } = req.body;

      if (!registration || !type) {
        return res.status(400).json({ error: 'Matrícula e tipo são obrigatórios' });
      }

      const id = crypto.randomUUID();
      const result = await query(
        `INSERT INTO aircrafts (id, tenant_id, registration, type, model, manufacturer, category, year)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          id, tenantId, registration.toUpperCase(), type,
          model || null, manufacturer || null, category || null, year || null,
        ]
      );

      return res.status(201).json(result[0]);
    }

    if (req.method === 'PUT') {
      const aircraftId = req.query.aircraftId || req.query.id;

      const existing = await query('SELECT * FROM aircrafts WHERE id = $1 AND tenant_id = $2', [aircraftId, tenantId]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Aeronave não encontrada' });
      }

      const { registration, type, model, manufacturer, category, year, active } = req.body;

      const result = await query(
        `UPDATE aircrafts SET
           registration = $2, type = $3, model = $4,
           manufacturer = $5, category = $6, year = $7,
           active = $8, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          aircraftId,
          (registration ?? existing[0].registration).toUpperCase(),
          type ?? existing[0].type,
          model ?? existing[0].model,
          manufacturer ?? existing[0].manufacturer,
          category ?? existing[0].category,
          year ?? existing[0].year,
          active ?? existing[0].active,
        ]
      );

      return res.status(200).json(result[0]);
    }

    if (req.method === 'DELETE') {
      const aircraftId = req.query.aircraftId || req.query.id;
      const result = await query('DELETE FROM aircrafts WHERE id = $1 AND tenant_id = $2 RETURNING id', [aircraftId, tenantId]);
      if (result.length === 0) {
        return res.status(404).json({ error: 'Aeronave não encontrada' });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin aircrafts error:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição' });
  }
}