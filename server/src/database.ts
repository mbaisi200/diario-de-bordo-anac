import { sql, query, execute } from './lib/db.js';

/**
 * Inicializa o banco de dados PostgreSQL no Neon
 * Conforme regulamentação ANAC para diário de bordo
 */
export async function initializeDatabase() {
  try {
    // Criar tabela de voos (cada statement separado para Neon)
    await sql(`
      CREATE TABLE IF NOT EXISTS flights (
        id UUID PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL DEFAULT 'default',
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

    // Criar índices separadamente
    await sql(`CREATE INDEX IF NOT EXISTS idx_flights_user_id ON flights(user_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_flights_date ON flights(date DESC)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_flights_registration ON flights(registration)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_flights_status ON flights(status)`);

    // Criar tabela de pilotos
    await sql(`
      CREATE TABLE IF NOT EXISTS pilots (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        license_number VARCHAR(50) UNIQUE NOT NULL,
        license_type VARCHAR(50) NOT NULL,
        medical_class VARCHAR(10),
        medical_expiry DATE,
        email VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Criar tabela de usuários para autenticação
    await sql(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE
      )
    `);

    // Criar usuário padrão (neto/123456)
    // Hash bcrypt para '123456': $2b$10$YQ8g2K5Z5Z5Z5Z5Z5Z5Z5e
    const existingUser = await sql(`SELECT id FROM users WHERE username = 'neto'`);
    if (existingUser.length === 0) {
      // Hash simple para demo (em produção usar bcrypt)
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256').update('123456').digest('hex');
      await sql(`
        INSERT INTO users (id, username, password_hash, name) 
        VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'neto', $1, 'Neto')
      `, [hash]);
      console.log('✅ Usuário padrão criado: neto/123456');
    }

    // Criar tabela de assinaturas digitais
    await sql(`
      CREATE TABLE IF NOT EXISTS digital_signatures (
        id UUID PRIMARY KEY,
        flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        signature_type VARCHAR(50) NOT NULL,
        signature_data TEXT NOT NULL,
        signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ip_address VARCHAR(45),
        user_agent TEXT
      )
    `);
    await sql(`CREATE INDEX IF NOT EXISTS idx_signatures_flight_id ON digital_signatures(flight_id)`);

    // Criar tabela de log de auditoria
    await sql(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id UUID PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await sql(`CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_log(user_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at DESC)`);

    // Criar tabela de aprovações (carimbo da escola)
    await sql(`
      CREATE TABLE IF NOT EXISTS approvals (
        id UUID PRIMARY KEY,
        flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
        approved_by VARCHAR(255) NOT NULL,
        approval_role VARCHAR(50) NOT NULL,
        approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        notes TEXT DEFAULT ''
      )
    `);
    await sql(`CREATE INDEX IF NOT EXISTS idx_approvals_flight_id ON approvals(flight_id)`);

    // Criar tabela de perfil do piloto
    await sql(`
      CREATE TABLE IF NOT EXISTS pilot_profiles (
        id UUID PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        license_number VARCHAR(50),
        license_type VARCHAR(50),
        medical_class VARCHAR(10),
        medical_expiry DATE,
        rg VARCHAR(20),
        cpf VARCHAR(14),
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        birth_date DATE,
        nationality VARCHAR(100) DEFAULT 'Brasileira',
        total_flight_hours DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await sql(`CREATE INDEX IF NOT EXISTS idx_pilot_user_id ON pilot_profiles(user_id)`);

    console.log('✅ Banco de dados Neon PostgreSQL inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

/**
 * Types for database operations
 */
export interface FlightRow {
  id: string;
  user_id: string;
  date: string;
  departure_time: string;
  arrival_time: string;
  aircraft_type: string;
  registration: string;
  departure_airport: string;
  arrival_airport: string;
  flight_types: string | any[];
  flight_time_day: number;
  flight_time_night: number;
  flight_time_instrument: number;
  flight_time_cross_country: number;
  pilot_in_command: string;
  copilot: string;
  instructor: string;
  landings_day: number;
  landings_night: number;
  remarks: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFlightInput {
  userId: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  aircraftType: string;
  registration: string;
  departureAirport: string;
  arrivalAirport: string;
  flightTypes: string[];
  flightTime: {
    day: number;
    night: number;
    instrument: number;
    crossCountry: number;
  };
  pilotInCommand: string;
  copilot: string;
  instructor: string;
  landings: {
    day: number;
    night: number;
  };
  remarks: string;
  status: string;
}

/**
 * Flight repository for PostgreSQL operations
 */
export const flightRepository = {
  /**
   * Get all flights for a user
   */
  async getAll(userId: string = 'default'): Promise<FlightRow[]> {
    const result = await query<FlightRow>(
      'SELECT * FROM flights WHERE user_id = $1 ORDER BY date DESC, departure_time DESC',
      [userId]
    );
    return result;
  },

  /**
   * Get a single flight by ID
   */
  async getById(id: string): Promise<FlightRow | null> {
    const result = await query<FlightRow>(
      'SELECT * FROM flights WHERE id = $1',
      [id]
    );
    return result[0] || null;
  },

  /**
   * Create a new flight
   */
  async create(data: CreateFlightInput, id: string): Promise<FlightRow> {
    const result = await query<FlightRow>(`
      INSERT INTO flights (
        id, user_id, date, departure_time, arrival_time,
        aircraft_type, registration, departure_airport, arrival_airport,
        flight_types, flight_time_day, flight_time_night,
        flight_time_instrument, flight_time_cross_country,
        pilot_in_command, copilot, instructor,
        landings_day, landings_night, remarks, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `, [
      id,
      data.userId,
      data.date,
      data.departureTime,
      data.arrivalTime,
      data.aircraftType,
      data.registration.toUpperCase(),
      data.departureAirport.toUpperCase(),
      data.arrivalAirport.toUpperCase(),
      JSON.stringify(data.flightTypes),
      data.flightTime.day,
      data.flightTime.night,
      data.flightTime.instrument,
      data.flightTime.crossCountry,
      data.pilotInCommand,
      data.copilot,
      data.instructor,
      data.landings.day,
      data.landings.night,
      data.remarks,
      data.status || 'completed'
    ]);

    return result[0];
  },

  /**
   * Update an existing flight
   */
  async update(id: string, data: Partial<CreateFlightInput>): Promise<FlightRow | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const result = await query<FlightRow>(`
      UPDATE flights SET
        date = $1,
        departure_time = $2,
        arrival_time = $3,
        aircraft_type = $4,
        registration = $5,
        departure_airport = $6,
        arrival_airport = $7,
        flight_types = $8,
        flight_time_day = $9,
        flight_time_night = $10,
        flight_time_instrument = $11,
        flight_time_cross_country = $12,
        pilot_in_command = $13,
        copilot = $14,
        instructor = $15,
        landings_day = $16,
        landings_night = $17,
        remarks = $18,
        status = $19,
        updated_at = NOW()
      WHERE id = $20
      RETURNING *
    `, [
      data.date ?? existing.date,
      data.departureTime ?? existing.departure_time,
      data.arrivalTime ?? existing.arrival_time,
      data.aircraftType ?? existing.aircraft_type,
      data.registration?.toUpperCase() ?? existing.registration,
      data.departureAirport?.toUpperCase() ?? existing.departure_airport,
      data.arrivalAirport?.toUpperCase() ?? existing.arrival_airport,
      JSON.stringify(data.flightTypes ?? (typeof existing.flight_types === 'string' ? JSON.parse(existing.flight_types) : existing.flight_types)),
      data.flightTime?.day ?? existing.flight_time_day,
      data.flightTime?.night ?? existing.flight_time_night,
      data.flightTime?.instrument ?? existing.flight_time_instrument,
      data.flightTime?.crossCountry ?? existing.flight_time_cross_country,
      data.pilotInCommand ?? existing.pilot_in_command,
      data.copilot ?? existing.copilot,
      data.instructor ?? existing.instructor,
      data.landings?.day ?? existing.landings_day,
      data.landings?.night ?? existing.landings_night,
      data.remarks ?? existing.remarks,
      data.status ?? existing.status,
      id
    ]);

    return result[0] || null;
  },

  /**
   * Delete a flight
   */
  async delete(id: string): Promise<boolean> {
    const result = await execute(
      'DELETE FROM flights WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  },

  /**
   * Get flight statistics
   */
  async getStats(userId: string = 'default') {
    const flights = await this.getAll(userId);
    
    const totalFlights = flights.length;
    const totalHours = {
      day: flights.reduce((sum, f) => sum + (Number(f.flight_time_day) || 0), 0),
      night: flights.reduce((sum, f) => sum + (Number(f.flight_time_night) || 0), 0),
      instrument: flights.reduce((sum, f) => sum + (Number(f.flight_time_instrument) || 0), 0),
      crossCountry: flights.reduce((sum, f) => sum + (Number(f.flight_time_cross_country) || 0), 0),
      pic: 0,
      sic: 0,
      dual: 0,
      solo: 0,
    };

    flights.forEach(flight => {
      const types = typeof flight.flight_types === 'string' 
        ? JSON.parse(flight.flight_types) 
        : flight.flight_types;
      const total = (Number(flight.flight_time_day) || 0) + (Number(flight.flight_time_night) || 0);
      
      if (types.includes('pic')) totalHours.pic += total;
      if (types.includes('sic')) totalHours.sic += total;
      if (types.includes('dual')) totalHours.dual += total;
      if (types.includes('solo')) totalHours.solo += total;
    });

    const totalLandings = {
      day: flights.reduce((sum, f) => sum + (Number(f.landings_day) || 0), 0),
      night: flights.reduce((sum, f) => sum + (Number(f.landings_night) || 0), 0),
    };

    return {
      totalFlights,
      totalHours,
      totalLandings,
      recentFlights: flights.slice(0, 5),
    };
  },

  /**
   * Export all flights for a user
   */
  async exportData(userId: string = 'default'): Promise<{ flights: any[] }> {
    const flights = await this.getAll(userId);
    return {
      flights: flights.map(f => ({
        ...f,
        flight_types: typeof f.flight_types === 'string' 
          ? JSON.parse(f.flight_types) 
          : f.flight_types,
      })),
    };
  },

  /**
   * Import flights from JSON
   */
  async importData(data: { flights: any[] }): Promise<number> {
    let imported = 0;

    for (const flight of data.flights) {
      await query(`
        INSERT INTO flights (
          id, user_id, date, departure_time, arrival_time,
          aircraft_type, registration, departure_airport, arrival_airport,
          flight_types, flight_time_day, flight_time_night,
          flight_time_instrument, flight_time_cross_country,
          pilot_in_command, copilot, instructor,
          landings_day, landings_night, remarks, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (id) DO UPDATE SET
          date = EXCLUDED.date,
          departure_time = EXCLUDED.departure_time,
          arrival_time = EXCLUDED.arrival_time,
          aircraft_type = EXCLUDED.aircraft_type,
          registration = EXCLUDED.registration,
          departure_airport = EXCLUDED.departure_airport,
          arrival_airport = EXCLUDED.arrival_airport,
          flight_types = EXCLUDED.flight_types,
          flight_time_day = EXCLUDED.flight_time_day,
          flight_time_night = EXCLUDED.flight_time_night,
          flight_time_instrument = EXCLUDED.flight_time_instrument,
          flight_time_cross_country = EXCLUDED.flight_time_cross_country,
          pilot_in_command = EXCLUDED.pilot_in_command,
          copilot = EXCLUDED.copilot,
          instructor = EXCLUDED.instructor,
          landings_day = EXCLUDED.landings_day,
          landings_night = EXCLUDED.landings_night,
          remarks = EXCLUDED.remarks,
          status = EXCLUDED.status,
          updated_at = NOW()
      `, [
        flight.id,
        flight.user_id || flight.userId || 'default',
        flight.date,
        flight.departure_time || flight.departureTime,
        flight.arrival_time || flight.arrivalTime,
        flight.aircraft_type || flight.aircraftType,
        flight.registration,
        flight.departure_airport || flight.departureAirport,
        flight.arrival_airport || flight.arrivalAirport,
        JSON.stringify(flight.flight_types || flight.flightTypes || []),
        flight.flight_time_day || flight.flightTime?.day || 0,
        flight.flight_time_night || flight.flightTime?.night || 0,
        flight.flight_time_instrument || flight.flightTime?.instrument || 0,
        flight.flight_time_cross_country || flight.flightTime?.crossCountry || 0,
        flight.pilot_in_command || flight.pilotInCommand || '',
        flight.copilot || '',
        flight.instructor || '',
        flight.landings_day || flight.landings?.day || 0,
        flight.landings_night || flight.landings?.night || 0,
        flight.remarks || '',
        flight.status || 'completed'
      ]);
      imported++;
    }

    return imported;
  },
};

export default { sql, query, execute };
