import crypto from 'crypto';
import { query } from '../lib/db.js';
import { verifyToken } from '../lib/auth.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Ensure flights table exists
    await query(`
      CREATE TABLE IF NOT EXISTS flights (
        id UUID PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL DEFAULT 'default',
        tenant_id UUID,
        date DATE NOT NULL,
        departure_time VARCHAR(5) NOT NULL,
        arrival_time VARCHAR(5) NOT NULL,
        aircraft_type VARCHAR(255) NOT NULL,
        registration VARCHAR(10) NOT NULL,
        departure_airport VARCHAR(4) NOT NULL,
        arrival_airport VARCHAR(4) NOT NULL,
        flight_types JSONB NOT NULL DEFAULT '[]',
        flight_time_day DECIMAL(5,2) DEFAULT 0,
        flight_time_night DECIMAL(5,2) DEFAULT 0,
        flight_time_instrument DECIMAL(5,2) DEFAULT 0,
        flight_time_cross_country DECIMAL(5,2) DEFAULT 0,
        pilot_in_command VARCHAR(255) DEFAULT '',
        copilot VARCHAR(255) DEFAULT '',
        instructor VARCHAR(255) DEFAULT '',
        landings_day INTEGER DEFAULT 0,
        landings_night INTEGER DEFAULT 0,
        remarks TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    const authHeader = req.headers['authorization'] || '';
    const authToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const authUser = authToken ? verifyToken(authToken) : null;

    const tenantId = authUser?.tenantId || req.query.tenantId || null;
    const userId = authUser?.userId || req.query.userId || 'default';

    const where = tenantId
      ? 'WHERE user_id = $1 AND tenant_id = $2'
      : 'WHERE user_id = $1';
    const params = tenantId ? [userId, tenantId] : [userId];

    if (req.method === 'GET') {
      const result = await query(
        `SELECT * FROM flights ${where} ORDER BY date DESC, departure_time DESC`,
        params
      );
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const data = req.body;
      const id = crypto.randomUUID();

      const result = await query(`
        INSERT INTO flights (
          id, user_id, tenant_id, date, departure_time, arrival_time,
          aircraft_type, registration, departure_airport, arrival_airport,
          flight_types, flight_time_day, flight_time_night,
          flight_time_instrument, flight_time_cross_country,
          pilot_in_command, copilot, instructor,
          landings_day, landings_night, remarks, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING *
      `, [
        id, data.userId || userId, tenantId, data.date, data.departureTime, data.arrivalTime,
        data.aircraftType, data.registration?.toUpperCase(), data.departureAirport?.toUpperCase(),
        data.arrivalAirport?.toUpperCase(), JSON.stringify(data.flightTypes || []),
        data.flightTime?.day || 0, data.flightTime?.night || 0,
        data.flightTime?.instrument || 0, data.flightTime?.crossCountry || 0,
        data.pilotInCommand || '', data.copilot || '', data.instructor || '',
        data.landings?.day || 0, data.landings?.night || 0,
        data.remarks || '', data.status || 'completed'
      ]);

      return res.status(201).json(result[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Flights error:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição' });
  }
}
