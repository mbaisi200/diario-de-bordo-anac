import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { sql } from '../lib/db.js';

const router = Router();

/**
 * GET /api/pilot/profile
 * Buscar perfil do piloto
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const result = await sql(
      'SELECT * FROM pilot_profiles WHERE user_id = $1',
      [userId]
    );
    res.json(result[0] || null);
  } catch (error) {
    console.error('Error fetching pilot profile:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil do piloto' });
  }
});

/**
 * POST /api/pilot/profile
 * Criar ou atualizar perfil do piloto
 */
router.post('/profile', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      fullName,
      licenseNumber,
      licenseType,
      medicalClass,
      medicalExpiry,
      rg,
      cpf,
      email,
      phone,
      address,
      birthDate,
      nationality,
      totalFlightHours,
    } = req.body;

    // Verificar se já existe perfil
    const existing = await sql(
      'SELECT id FROM pilot_profiles WHERE user_id = $1',
      [userId || 'default']
    );

    if (existing.length > 0) {
      // Atualizar
      const result = await sql(`
        UPDATE pilot_profiles SET
          full_name = $1,
          license_number = $2,
          license_type = $3,
          medical_class = $4,
          medical_expiry = $5,
          rg = $6,
          cpf = $7,
          email = $8,
          phone = $9,
          address = $10,
          birth_date = $11,
          nationality = $12,
          total_flight_hours = $13,
          updated_at = NOW()
        WHERE user_id = $14
        RETURNING *
      `, [
        fullName, licenseNumber, licenseType, medicalClass, medicalExpiry,
        rg, cpf, email, phone, address, birthDate, nationality,
        totalFlightHours, userId || 'default'
      ]);
      res.json(result[0]);
    } else {
      // Criar novo
      const id = crypto.randomUUID();
      const result = await sql(`
        INSERT INTO pilot_profiles (
          id, user_id, full_name, license_number, license_type,
          medical_class, medical_expiry, rg, cpf, email, phone,
          address, birth_date, nationality, total_flight_hours
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `, [
        id, userId || 'default', fullName, licenseNumber, licenseType,
        medicalClass, medicalExpiry, rg, cpf, email, phone,
        address, birthDate, nationality, totalFlightHours
      ]);
      res.status(201).json(result[0]);
    }
  } catch (error) {
    console.error('Error saving pilot profile:', error);
    res.status(500).json({ error: 'Erro ao salvar perfil do piloto' });
  }
});

export default router;
