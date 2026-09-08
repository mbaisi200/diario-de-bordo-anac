import crypto from 'crypto';
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

    // Migrar tabela flights: adicionar colunas ANAC se não existirem
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS tenant_id UUID`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS flight_number VARCHAR(20)`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS flight_rules VARCHAR(5) DEFAULT 'VFR'`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS alternated_airport VARCHAR(4)`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS total_distance NUMERIC`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50)`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS fuel_quantity_departure NUMERIC`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS fuel_quantity_arrival NUMERIC`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS passengers_count INTEGER DEFAULT 0`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS pilot_in_command_license VARCHAR(50)`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS copilot_license VARCHAR(50)`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS metar_departure VARCHAR(200)`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS metar_arrival VARCHAR(200)`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS notams TEXT`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS obstacles TEXT`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS integrity_hash VARCHAR(64)`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS signed BOOLEAN DEFAULT FALSE`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE`);

    // ── Migration IAC: colunas obrigatórias faltantes ──
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS flight_nature VARCHAR(5)`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS volume_id UUID`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS sequential_number INTEGER`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS aircraft_serial_number VARCHAR(100)`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS registration_category VARCHAR(100)`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS cargo_weight NUMERIC`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS cycles_partial INTEGER DEFAULT 0`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS cycles_total INTEGER DEFAULT 0`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS mechanic_release_code VARCHAR(50)`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS mechanic_release_signature VARCHAR(255)`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE`);
    await sql(`ALTER TABLE flights ADD COLUMN IF NOT EXISTS crew JSONB DEFAULT '[]'`);

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

    // Migrar tabela pilots: adicionar colunas do multitenant se não existirem
    await sql(`ALTER TABLE pilots ADD COLUMN IF NOT EXISTS tenant_id UUID`);
    await sql(`ALTER TABLE pilots ADD COLUMN IF NOT EXISTS user_id UUID`);
    await sql(`ALTER TABLE pilots ADD COLUMN IF NOT EXISTS cpf VARCHAR(20)`);
    await sql(`ALTER TABLE pilots ADD COLUMN IF NOT EXISTS phone VARCHAR(30)`);
    await sql(`ALTER TABLE pilots ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE`);
    await sql(`ALTER TABLE pilots ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    await sql(`ALTER TABLE pilots ALTER COLUMN license_number DROP NOT NULL`);
    await sql(`ALTER TABLE pilots ALTER COLUMN license_type DROP NOT NULL`);

    // Criar tabela de usuários para autenticação
    await sql(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(20) NOT NULL DEFAULT 'pilot',
        tenant_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE
      )
    `);

    // Migrar tabela existente: adicionar colunas se não existirem
    await sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'pilot'`);
    await sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID`);

    // Criar usuário padrão (neto/123456) como MASTER
    const existingUser = await sql(`SELECT id FROM users WHERE username = 'neto'`);
    if (existingUser.length === 0) {
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256').update('123456').digest('hex');
      await sql(`
        INSERT INTO users (id, username, password_hash, name, role) 
        VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'neto', $1, 'Neto', 'master')
      `, [hash]);
      console.log('✅ Usuário padrão criado: neto/123456 (master)');
    } else {
      // Garantir que neto é sempre master
      await sql(`UPDATE users SET role = 'master' WHERE username = 'neto'`);
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
        user_agent TEXT,
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

    // Criar tabela de correções (imutabilidade pós-assinatura - Res. 458/2017)
    await sql(`
      CREATE TABLE IF NOT EXISTS flight_corrections (
        id UUID PRIMARY KEY,
        flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        field_name VARCHAR(100) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        reason TEXT NOT NULL,
        corrected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await sql(`CREATE INDEX IF NOT EXISTS idx_corrections_flight_id ON flight_corrections(flight_id)`);

    // ── Tabela de volumes do diário de bordo (Portaria 3.220/SPO) ──
    await sql(`
      CREATE TABLE IF NOT EXISTS logbook_volumes (
        id UUID PRIMARY KEY,
        tenant_id UUID,
        volume_number VARCHAR(50) NOT NULL,
        aircraft_registration VARCHAR(10) NOT NULL,
        aircraft_manufacturer VARCHAR(100),
        aircraft_model VARCHAR(100),
        aircraft_serial_number VARCHAR(100),
        registration_category VARCHAR(100),
        total_hours_at_opening DECIMAL(10,2) DEFAULT 0,
        total_cycles_at_opening INTEGER DEFAULT 0,
        total_landings_at_opening INTEGER DEFAULT 0,
        year_of_manufacture VARCHAR(10),
        owner VARCHAR(255),
        operator VARCHAR(255),
        opening_date DATE NOT NULL,
        closing_date DATE,
        status VARCHAR(20) DEFAULT 'open',
        signed_by VARCHAR(255),
        signed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await sql(`CREATE INDEX IF NOT EXISTS idx_volumes_tenant ON logbook_volumes(tenant_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_volumes_registration ON logbook_volumes(aircraft_registration)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_volumes_status ON logbook_volumes(status)`);

    // ── Tabela de tripulantes detalhados (Portaria 14.096/SPO/2024) ──
    await sql(`
      CREATE TABLE IF NOT EXISTS crew_members (
        id UUID PRIMARY KEY,
        flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        anac_code VARCHAR(20),
        license_number VARCHAR(50),
        role VARCHAR(10) NOT NULL,
        presentation_time VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await sql(`CREATE INDEX IF NOT EXISTS idx_crew_flight_id ON crew_members(flight_id)`);

    // ── Tabela de manutenção - Parte II (IAC 3151, Cap. 5) ──
    await sql(`
      CREATE TABLE IF NOT EXISTS aircraft_maintenance (
        id UUID PRIMARY KEY,
        flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
        tenant_id UUID,
        date DATE NOT NULL,
        ata_chapter VARCHAR(20),
        discrepancy TEXT,
        corrective_action TEXT,
        last_maintenance_type VARCHAR(255),
        next_maintenance_type VARCHAR(255),
        hours_to_next_maintenance DECIMAL(10,2),
        released_by_code VARCHAR(50),
        released_by_signature VARCHAR(255),
        released_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await sql(`CREATE INDEX IF NOT EXISTS idx_maintenance_flight_id ON aircraft_maintenance(flight_id)`);

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
  tenant_id: string | null;
  volume_id: string | null;
  sequential_number: number | null;
  flight_number: string | null;
  flight_rules: string;
  flight_nature: string | null;
  date: string;
  departure_time: string;
  arrival_time: string;
  aircraft_type: string;
  registration: string;
  aircraft_serial_number: string | null;
  registration_category: string | null;
  departure_airport: string;
  arrival_airport: string;
  alternated_airport: string | null;
  flight_types: string | any[];
  flight_time_day: number;
  flight_time_night: number;
  flight_time_instrument: number;
  flight_time_cross_country: number;
  cycles_partial: number;
  cycles_total: number;
  total_distance: number | null;
  fuel_type: string | null;
  fuel_quantity_departure: number | null;
  fuel_quantity_arrival: number | null;
  passengers_count: number | null;
  cargo_weight: number | null;
  pilot_in_command: string;
  pilot_in_command_license: string | null;
  copilot: string;
  copilot_license: string | null;
  instructor: string;
  crew: any[];
  landings_day: number;
  landings_night: number;
  metar_departure: string | null;
  metar_arrival: string | null;
  notams: string | null;
  obstacles: string | null;
  remarks: string;
  status: string;
  integrity_hash: string | null;
  signed: boolean;
  signed_at: string | null;
  locked: boolean;
  mechanic_release_code: string | null;
  mechanic_release_signature: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFlightInput {
  userId: string;
  tenantId?: string;
  volumeId?: string;
  flightNumber?: string;
  flightRules?: string;
  flightNature?: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  aircraftType: string;
  registration: string;
  aircraftSerialNumber?: string;
  registrationCategory?: string;
  departureAirport: string;
  arrivalAirport: string;
  alternatedAirport?: string;
  flightTypes: string[];
  flightTime: {
    day: number;
    night: number;
    instrument: number;
    crossCountry: number;
  };
  cycles?: { partial: number; total: number };
  totalDistance?: number;
  fuelType?: string;
  fuelQuantityDeparture?: number;
  fuelQuantityArrival?: number;
  passengersCount?: number;
  cargoWeight?: number;
  pilotInCommand: string;
  pilotInCommandLicense?: string;
  copilot: string;
  copilotLicense?: string;
  instructor: string;
  crew?: any[];
  landings: {
    day: number;
    night: number;
  };
  metarDeparture?: string;
  metarArrival?: string;
  notams?: string;
  obstacles?: string;
  remarks: string;
  status: string;
  mechanicReleaseCode?: string;
  mechanicReleaseSignature?: string;
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
   * Gerar hash de integridade SHA-256 para um voo (Resolução 458/2017)
   */
  generateIntegrityHash(data: CreateFlightInput, id: string): string {
    const payload = JSON.stringify({
      id, userId: data.userId, date: data.date,
      departureTime: data.departureTime, arrivalTime: data.arrivalTime,
      aircraftType: data.aircraftType, registration: data.registration,
      departureAirport: data.departureAirport, arrivalAirport: data.arrivalAirport,
      flightTypes: data.flightTypes, flightTime: data.flightTime,
      flightNature: data.flightNature,
      pilotInCommand: data.pilotInCommand, copilot: data.copilot,
      landings: data.landings, remarks: data.remarks,
      cycles: data.cycles, cargoWeight: data.cargoWeight,
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
  },

  /**
   * Create a new flight
   */
  async create(data: CreateFlightInput, id: string): Promise<FlightRow> {
    const integrityHash = this.generateIntegrityHash(data, id);
    const result = await query<FlightRow>(`
      INSERT INTO flights (
        id, user_id, tenant_id, volume_id, flight_number, flight_rules, flight_nature,
        date, departure_time, arrival_time,
        aircraft_type, registration, aircraft_serial_number, registration_category,
        departure_airport, arrival_airport,
        alternated_airport, flight_types,
        flight_time_day, flight_time_night, flight_time_instrument, flight_time_cross_country,
        cycles_partial, cycles_total,
        total_distance, fuel_type, fuel_quantity_departure, fuel_quantity_arrival,
        passengers_count, cargo_weight,
        pilot_in_command, pilot_in_command_license, copilot, copilot_license, instructor,
        crew,
        landings_day, landings_night,
        metar_departure, metar_arrival, notams, obstacles,
        remarks, status, integrity_hash,
        mechanic_release_code, mechanic_release_signature
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, $45, $46
      )
      RETURNING *
    `, [
      id,
      data.userId,
      data.tenantId || null,
      data.volumeId || null,
      data.flightNumber || null,
      data.flightRules || 'VFR',
      data.flightNature || null,
      data.date,
      data.departureTime,
      data.arrivalTime,
      data.aircraftType,
      data.registration.toUpperCase(),
      data.aircraftSerialNumber || null,
      data.registrationCategory || null,
      data.departureAirport.toUpperCase(),
      data.arrivalAirport.toUpperCase(),
      data.alternatedAirport?.toUpperCase() || null,
      JSON.stringify(data.flightTypes),
      data.flightTime.day,
      data.flightTime.night,
      data.flightTime.instrument,
      data.flightTime.crossCountry,
      data.cycles?.partial || 0,
      data.cycles?.total || 0,
      data.totalDistance || null,
      data.fuelType || null,
      data.fuelQuantityDeparture || null,
      data.fuelQuantityArrival || null,
      data.passengersCount || 0,
      data.cargoWeight || null,
      data.pilotInCommand,
      data.pilotInCommandLicense || null,
      data.copilot,
      data.copilotLicense || null,
      data.instructor,
      JSON.stringify(data.crew || []),
      data.landings.day,
      data.landings.night,
      data.metarDeparture || null,
      data.metarArrival || null,
      data.notams || null,
      data.obstacles || null,
      data.remarks,
      data.status || 'completed',
      integrityHash,
      data.mechanicReleaseCode || null,
      data.mechanicReleaseSignature || null,
    ]);

    return result[0];
  },

  /**
   * Update an existing flight
   */
  async update(id: string, data: Partial<CreateFlightInput>, userId?: string): Promise<FlightRow | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    // Imutabilidade: voos assinados/travados não podem ser alterados
    if (existing.locked) {
      return null;
    }

    // Registrar correções se o voo já foi assinado
    if (existing.signed) {
      const corrections = [
        { field: 'date', old: existing.date, new: data.date },
        { field: 'departure_time', old: existing.departure_time, new: data.departureTime },
        { field: 'arrival_time', old: existing.arrival_time, new: data.arrivalTime },
        { field: 'aircraft_type', old: existing.aircraft_type, new: data.aircraftType },
        { field: 'registration', old: existing.registration, new: data.registration },
        { field: 'departure_airport', old: existing.departure_airport, new: data.departureAirport },
        { field: 'arrival_airport', old: existing.arrival_airport, new: data.arrivalAirport },
        { field: 'pilot_in_command', old: existing.pilot_in_command, new: data.pilotInCommand },
        { field: 'copilot', old: existing.copilot, new: data.copilot },
        { field: 'remarks', old: existing.remarks, new: data.remarks },
      ];

      for (const c of corrections) {
        const oldVal = String(c.old || '');
        const newVal = String(c.new || oldVal);
        if (oldVal !== newVal && userId) {
          await query(`
            INSERT INTO flight_corrections (id, flight_id, user_id, field_name, old_value, new_value, reason)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [crypto.randomUUID(), id, userId, c.field, oldVal, newVal, 'Atualização pós-assinatura']);
        }
      }
    }

    // Regenerar hash de integridade (Res. 458/2017)
    const mergedData: CreateFlightInput = {
      userId: existing.user_id,
      tenantId: data.tenantId ?? existing.tenant_id ?? undefined,
      volumeId: data.volumeId ?? existing.volume_id ?? undefined,
      flightNumber: data.flightNumber ?? existing.flight_number ?? undefined,
      flightRules: data.flightRules ?? existing.flight_rules,
      flightNature: data.flightNature ?? existing.flight_nature ?? undefined,
      date: data.date ?? existing.date,
      departureTime: data.departureTime ?? existing.departure_time,
      arrivalTime: data.arrivalTime ?? existing.arrival_time,
      aircraftType: data.aircraftType ?? existing.aircraft_type,
      registration: data.registration ?? existing.registration,
      departureAirport: data.departureAirport ?? existing.departure_airport,
      arrivalAirport: data.arrivalAirport ?? existing.arrival_airport,
      flightTypes: data.flightTypes ?? (typeof existing.flight_types === 'string' ? JSON.parse(existing.flight_types) : existing.flight_types),
      flightTime: data.flightTime ?? { day: existing.flight_time_day, night: existing.flight_time_night, instrument: existing.flight_time_instrument, crossCountry: existing.flight_time_cross_country },
      cycles: data.cycles ?? { partial: existing.cycles_partial, total: existing.cycles_total },
      pilotInCommand: data.pilotInCommand ?? existing.pilot_in_command,
      copilot: data.copilot ?? existing.copilot,
      instructor: data.instructor ?? existing.instructor,
      landings: data.landings ?? { day: existing.landings_day, night: existing.landings_night },
      remarks: data.remarks ?? existing.remarks,
      cargoWeight: data.cargoWeight ?? existing.cargo_weight ?? undefined,
      status: data.status ?? existing.status,
    };
    const newHash = this.generateIntegrityHash(mergedData, id);

    const result = await query<FlightRow>(`
      UPDATE flights SET
        volume_id = $1, flight_number = $2, flight_rules = $3, flight_nature = $4,
        date = $5, departure_time = $6, arrival_time = $7,
        aircraft_type = $8, registration = $9, aircraft_serial_number = $10, registration_category = $11,
        departure_airport = $12, arrival_airport = $13, alternated_airport = $14,
        flight_types = $15,
        flight_time_day = $16, flight_time_night = $17, flight_time_instrument = $18, flight_time_cross_country = $19,
        cycles_partial = $20, cycles_total = $21,
        total_distance = $22, fuel_type = $23, fuel_quantity_departure = $24, fuel_quantity_arrival = $25,
        passengers_count = $26, cargo_weight = $27,
        pilot_in_command = $28, pilot_in_command_license = $29, copilot = $30, copilot_license = $31, instructor = $32,
        crew = $33,
        landings_day = $34, landings_night = $35,
        metar_departure = $36, metar_arrival = $37, notams = $38, obstacles = $39,
        remarks = $40, status = $41,
        integrity_hash = $42, mechanic_release_code = $43, mechanic_release_signature = $44,
        updated_at = NOW()
      WHERE id = $45
      RETURNING *
    `, [
      data.volumeId ?? existing.volume_id,
      data.flightNumber ?? existing.flight_number,
      data.flightRules ?? existing.flight_rules,
      data.flightNature ?? existing.flight_nature,
      data.date ?? existing.date,
      data.departureTime ?? existing.departure_time,
      data.arrivalTime ?? existing.arrival_time,
      data.aircraftType ?? existing.aircraft_type,
      data.registration?.toUpperCase() ?? existing.registration,
      data.aircraftSerialNumber ?? existing.aircraft_serial_number,
      data.registrationCategory ?? existing.registration_category,
      data.departureAirport?.toUpperCase() ?? existing.departure_airport,
      data.arrivalAirport?.toUpperCase() ?? existing.arrival_airport,
      data.alternatedAirport?.toUpperCase() ?? existing.alternated_airport,
      JSON.stringify(data.flightTypes ?? (typeof existing.flight_types === 'string' ? JSON.parse(existing.flight_types) : existing.flight_types)),
      data.flightTime?.day ?? existing.flight_time_day,
      data.flightTime?.night ?? existing.flight_time_night,
      data.flightTime?.instrument ?? existing.flight_time_instrument,
      data.flightTime?.crossCountry ?? existing.flight_time_cross_country,
      data.cycles?.partial ?? existing.cycles_partial,
      data.cycles?.total ?? existing.cycles_total,
      data.totalDistance ?? existing.total_distance,
      data.fuelType ?? existing.fuel_type,
      data.fuelQuantityDeparture ?? existing.fuel_quantity_departure,
      data.fuelQuantityArrival ?? existing.fuel_quantity_arrival,
      data.passengersCount ?? existing.passengers_count,
      data.cargoWeight ?? existing.cargo_weight,
      data.pilotInCommand ?? existing.pilot_in_command,
      data.pilotInCommandLicense ?? existing.pilot_in_command_license,
      data.copilot ?? existing.copilot,
      data.copilotLicense ?? existing.copilot_license,
      data.instructor ?? existing.instructor,
      JSON.stringify(data.crew ?? existing.crew ?? []),
      data.landings?.day ?? existing.landings_day,
      data.landings?.night ?? existing.landings_night,
      data.metarDeparture ?? existing.metar_departure,
      data.metarArrival ?? existing.metar_arrival,
      data.notams ?? existing.notams,
      data.obstacles ?? existing.obstacles,
      data.remarks ?? existing.remarks,
      data.status ?? existing.status,
      newHash,
      data.mechanicReleaseCode ?? existing.mechanic_release_code,
      data.mechanicReleaseSignature ?? existing.mechanic_release_signature,
      id
    ]);

    return result[0] || null;
  },

  /**
   * Delete a flight
   */
  async delete(id: string): Promise<boolean> {
    // Verificar se o voo está travado/assinado (Res. 458/2017)
    const existing = await this.getById(id);
    if (existing?.locked) {
      return false;
    }
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

  /**
   * Assinar voo eletronicamente (trava o registro - Res. 458/2017)
   */
  async signFlight(id: string, userId: string, signatureData: string): Promise<FlightRow | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    // Salvar assinatura
    await query(`
      INSERT INTO digital_signatures (id, flight_id, user_id, signature_type, signature_data, signed_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [crypto.randomUUID(), id, userId, 'pilot_command', signatureData]);

    // Travar e assinar o voo
    const result = await query<FlightRow>(`
      UPDATE flights SET signed = TRUE, locked = TRUE, signed_at = NOW(), updated_at = NOW()
      WHERE id = $1 RETURNING *
    `, [id]);

    // Log de auditoria
    await query(`
      INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, new_values)
      VALUES ($1, $2, 'SIGN', 'flight', $3, $4)
    `, [crypto.randomUUID(), userId, id, JSON.stringify({ signed: true, locked: true })]);

    return result[0] || null;
  },

  // ── Volumes do Diário de Bordo (Portaria 3.220/SPO) ──

  async getAllVolumes(userId: string = 'default'): Promise<any[]> {
    return await query(
      'SELECT * FROM logbook_volumes WHERE (tenant_id IS NULL OR tenant_id = $1) ORDER BY created_at DESC',
      [userId]
    );
  },

  async getVolumeById(id: string): Promise<any | null> {
    const result = await query('SELECT * FROM logbook_volumes WHERE id = $1', [id]);
    return result[0] || null;
  },

  async getOpenVolumeByRegistration(registration: string): Promise<any | null> {
    const result = await query(
      "SELECT * FROM logbook_volumes WHERE aircraft_registration = $1 AND status = 'open' ORDER BY created_at DESC LIMIT 1",
      [registration]
    );
    return result[0] || null;
  },

  async createVolume(data: any, id: string): Promise<any> {
    const result = await query(`
      INSERT INTO logbook_volumes (
        id, tenant_id, volume_number, aircraft_registration,
        aircraft_manufacturer, aircraft_model, aircraft_serial_number,
        registration_category, total_hours_at_opening, total_cycles_at_opening,
        total_landings_at_opening, year_of_manufacture, owner, operator,
        opening_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      id, data.tenantId || null, data.volumeNumber, data.aircraftRegistration,
      data.aircraftManufacturer || null, data.aircraftModel || null, data.aircraftSerialNumber || null,
      data.registrationCategory || null, data.totalHoursAtOpening || 0, data.totalCyclesAtOpening || 0,
      data.totalLandingsAtOpening || 0, data.yearOfManufacture || null, data.owner || null, data.operator || null,
      data.openingDate, 'open',
    ]);
    return result[0];
  },

  async closeVolume(id: string, signedBy: string): Promise<any | null> {
    const result = await query(`
      UPDATE logbook_volumes
      SET status = 'closed', closing_date = CURRENT_DATE, signed_by = $2, signed_at = NOW(), updated_at = NOW()
      WHERE id = $1 RETURNING *
    `, [id, signedBy]);
    return result[0] || null;
  },

  async getNextSequentialNumber(volumeId: string): Promise<number> {
    const result = await query(
      'SELECT COALESCE(MAX(sequential_number), 0) + 1 AS next_num FROM flights WHERE volume_id = $1',
      [volumeId]
    );
    return result[0]?.next_num || 1;
  },

  // ── Manutenção - Parte II (IAC 3151) ──

  async getMaintenanceByFlightId(flightId: string): Promise<any[]> {
    return await query('SELECT * FROM aircraft_maintenance WHERE flight_id = $1', [flightId]);
  },

  async createMaintenance(data: any, id: string): Promise<any> {
    const result = await query(`
      INSERT INTO aircraft_maintenance (
        id, flight_id, tenant_id, date, ata_chapter, discrepancy,
        corrective_action, last_maintenance_type, next_maintenance_type,
        hours_to_next_maintenance, released_by_code, released_by_signature, released_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      id, data.flightId, data.tenantId || null, data.date, data.ataChapter || null,
      data.discrepancy || null, data.correctiveAction || null, data.lastMaintenanceType || null,
      data.nextMaintenanceType || null, data.hoursToNextMaintenance || null,
      data.releasedByCode || null, data.releasedBySignature || null, data.releasedAt || null,
    ]);
    return result[0];
  },
};

export default { sql, query, execute };
