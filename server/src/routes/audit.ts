import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { sql } from '../lib/db.js';

const router = Router();

/**
 * Registrar ação de auditoria
 */
export async function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValues?: any,
  newValues?: any,
  ipAddress?: string
) {
  await sql(`
    INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    crypto.randomUUID(),
    userId,
    action,
    entityType,
    entityId,
    oldValues ? JSON.stringify(oldValues) : null,
    newValues ? JSON.stringify(newValues) : null,
    ipAddress || null,
  ]);
}

/**
 * GET /api/audit/:entityType/:entityId
 * Buscar log de auditoria de uma entidade
 */
router.get('/:entityType/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const result = await sql(`
      SELECT * FROM audit_log 
      WHERE entity_type = $1 AND entity_id = $2 
      ORDER BY created_at DESC
    `, [entityType, entityId]);
    res.json(result);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Erro ao buscar log de auditoria' });
  }
});

/**
 * POST /api/audit
 * Criar registro de auditoria
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, action, entityType, entityId, oldValues, newValues } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    
    await logAudit(userId, action, entityType, entityId, oldValues, newValues, ipAddress);
    
    res.status(201).json({ message: 'Registro de auditoria criado' });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ error: 'Erro ao criar registro de auditoria' });
  }
});

/**
 * POST /api/signatures
 * Assinar um voo digitalmente
 */
router.post('/signatures', async (req: Request, res: Response) => {
  try {
    const { flightId, userId, signatureType, signatureData } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    if (!flightId || !userId || !signatureType || !signatureData) {
      res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
      return;
    }

    const id = crypto.randomUUID();
    const result = await sql(`
      INSERT INTO digital_signatures (id, flight_id, user_id, signature_type, signature_data, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [id, flightId, userId, signatureType, signatureData, ipAddress, userAgent]);

    // Log de auditoria
    await logAudit(userId, 'SIGN', 'flight', flightId, null, { signatureType }, ipAddress);

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating signature:', error);
    res.status(500).json({ error: 'Erro ao assinar voo' });
  }
});

/**
 * GET /api/signatures/:flightId
 * Buscar assinaturas de um voo
 */
router.get('/signatures/:flightId', async (req: Request, res: Response) => {
  try {
    const { flightId } = req.params;
    const result = await sql(`
      SELECT ds.*, u.name as user_name
      FROM digital_signatures ds
      LEFT JOIN users u ON ds.user_id = u.id
      WHERE ds.flight_id = $1
      ORDER BY ds.signed_at DESC
    `, [flightId]);
    res.json(result);
  } catch (error) {
    console.error('Error fetching signatures:', error);
    res.status(500).json({ error: 'Erro ao buscar assinaturas' });
  }
});

/**
 * POST /api/approvals
 * Aprovar um voo (carimbo da escola)
 */
router.post('/approvals', async (req: Request, res: Response) => {
  try {
    const { flightId, approvedBy, approvalRole, notes } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;

    if (!flightId || !approvedBy || !approvalRole) {
      res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
      return;
    }

    const id = crypto.randomUUID();
    const result = await sql(`
      INSERT INTO approvals (id, flight_id, approved_by, approval_role, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, flightId, approvedBy, approvalRole, notes || '']);

    // Log de auditoria
    await logAudit(approvedBy, 'APPROVE', 'flight', flightId, null, { approvalRole }, ipAddress);

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating approval:', error);
    res.status(500).json({ error: 'Erro ao aprovar voo' });
  }
});

/**
 * GET /api/approvals/:flightId
 * Buscar aprovações de um voo
 */
router.get('/approvals/:flightId', async (req: Request, res: Response) => {
  try {
    const { flightId } = req.params;
    const result = await sql(`
      SELECT * FROM approvals WHERE flight_id = $1 ORDER BY approved_at DESC
    `, [flightId]);
    res.json(result);
  } catch (error) {
    console.error('Error fetching approvals:', error);
    res.status(500).json({ error: 'Erro ao buscar aprovações' });
  }
});

/**
 * POST /api/signatures/verify
 * Verificar assinatura digital
 */
router.post('/signatures/verify', async (req: Request, res: Response) => {
  try {
    const { signatureId, signatureData } = req.body;

    const result = await sql(
      'SELECT * FROM digital_signatures WHERE id = $1',
      [signatureId]
    );

    if (result.length === 0) {
      res.status(404).json({ error: 'Assinatura não encontrada' });
      return;
    }

    const sig = result[0];
    const isValid = sig.signature_data === signatureData;

    res.json({
      valid: isValid,
      signedAt: sig.signed_at,
      signedBy: sig.user_id,
      signatureType: sig.signature_type,
    });
  } catch (error) {
    console.error('Error verifying signature:', error);
    res.status(500).json({ error: 'Erro ao verificar assinatura' });
  }
});

export default router;
