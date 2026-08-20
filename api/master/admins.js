import crypto from 'crypto';
import { query } from '../lib/db.js';
import { hashPassword, requireAuth, setCors } from '../lib/auth.js';

export default async function handler(req, res) {
  if (!setCors(res)) return;

  const auth = requireAuth(req, res, ['master']);
  if (!auth) return;

  try {
    await query(`
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

    if (req.method === 'GET') {
      const result = await query(`
        SELECT a.*, u.username
        FROM admins a
        LEFT JOIN users u ON u.id = a.user_id
        ORDER BY a.created_at DESC
      `);
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const {
        companyName, cnpjCpf, email, phones, address,
        username, password,
      } = req.body;

      if (!companyName || !cnpjCpf || !email) {
        return res.status(400).json({ error: 'Razão social, CNPJ/CPF e email são obrigatórios' });
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

      const cnpjExists = await query('SELECT id FROM admins WHERE cnpj_cpf = $1', [cnpjCpf]);
      if (cnpjExists.length > 0) {
        return res.status(409).json({ error: 'Este CNPJ/CPF já está cadastrado' });
      }

      const adminId = crypto.randomUUID();
      const userId = crypto.randomUUID();

      await query(
        `INSERT INTO users (id, username, password_hash, name, email, role, tenant_id)
         VALUES ($1, $2, $3, $4, $5, 'admin', $6)`,
        [userId, username, hashPassword(password), companyName, email, adminId]
      );

      const result = await query(
        `INSERT INTO admins (id, user_id, company_name, cnpj_cpf, email, phones, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          adminId, userId, companyName, cnpjCpf, email,
          JSON.stringify(phones || []),
          JSON.stringify(address || {}),
        ]
      );

      return res.status(201).json(result[0]);
    }

    if (req.method === 'PUT') {
      const id = req.query.id || (req.url.split('?')[0].split('/').pop());
      const adminId = req.query.adminId || id;

      const { companyName, cnpjCpf, email, phones, address, active } = req.body;

      const existing = await query('SELECT id FROM admins WHERE id = $1', [adminId]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Admin não encontrado' });
      }

      const result = await query(
        `UPDATE admins SET
           company_name = $2, cnpj_cpf = $3, email = $4,
           phones = $5, address = $6, active = $7, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          adminId,
          companyName ?? existing[0].company_name,
          cnpjCpf ?? existing[0].cnpj_cpf,
          email ?? existing[0].email,
          JSON.stringify(phones || []),
          JSON.stringify(address || {}),
          active ?? true,
        ]
      );

      return res.status(200).json(result[0]);
    }

    if (req.method === 'DELETE') {
      const adminId = req.query.adminId || req.query.id;

      const admin = await query('SELECT * FROM admins WHERE id = $1', [adminId]);
      if (admin.length === 0) {
        return res.status(404).json({ error: 'Admin não encontrado' });
      }

      if (admin[0].user_id) {
        await query('DELETE FROM users WHERE id = $1', [admin[0].user_id]);
      }
      await query('DELETE FROM admins WHERE id = $1', [adminId]);

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Master admins error:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição' });
  }
}