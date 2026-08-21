// ============================================================
// DIÁRIO DE BORDO DIGITAL - TIPOS ANAC/ICAO
// Conforme Portaria nº 3.220/SPO/SAR e Resolução nº 458/2017
// ============================================================

/**
 * Tipos de voo conforme regulamentação ANAC
 * Baseado no ICAO Doc 9868 e Resolução ANAC nº 478
 */
export type FlightType = 
  | 'dual'          // Voo instruído (duplo comando)
  | 'solo'          // Voo solo
  | 'pic'           // Pilotando em comando (PIC)
  | 'sic'           // Segundo em comando (SIC)
  | 'cross_country' // Voo entre(cidades) - cross country
  | 'instruction'   // Instrução em voo
  | 'check'         // Checagem/check ride
  | 'ipc'           // Instrument Proficiency Check
  | 'bfr'           // Biennial Flight Review
  | 'ferry'         // Ferry flight
  | 'night'         // Voo noturno
  | 'other';        // Outro

/**
 * Regras de voo (ANAC obrigatório)
 */
export type FlightRules = 'IFR' | 'VFR' | 'YVFR' | 'ZIFR';

/**
 * Tipo de operação (dia/noite)
 */
export type FlightTimeType = 'day' | 'night';

/**
 * Unidade de tempo
 */
export type TimeUnit = 'hours' | 'minutes';

/**
 * Status do voo
 */
export type FlightStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Registro de um voo individual
 * Conforme campos obrigatórios ANAC (Portaria 3.220/SPO/SAR)
 * e exigências de integridade (Resolução 458/2017)
 */
export interface FlightRecord {
  id: string;
  tenantId?: string;
  userId: string;
  
  // ── Dados de Identificação do Voo (ANAC obrigatório) ──
  flightNumber?: string;              // Número do voo
  flightRules?: FlightRules;           // Regras de voo (IFR/VFR)
  
  // ── Data e hora (ANAC obrigatório) ──
  date: string;                       // YYYY-MM-DD
  departureTime: string;              // HH:MM (UTC)
  arrivalTime: string;                // HH:MM (UTC)
  
  // ── Aeronave (ANAC obrigatório) ──
  aircraftType: string;               // Tipo/certificação (ex: Cessna 172)
  registration: string;               // Matrícula (ex: PT-ABC)
  
  // ── Aeródromos (ANAC obrigatório) ──
  departureAirport: string;           // ICAO origem (ex: SBGR)
  arrivalAirport: string;             // ICAO destino (ex: SBGL)
  alternatedAirport?: string;         // ICAO alternado
  
  // ── Tipos de voo (podem ser múltiplos) ──
  flightTypes: FlightType[];
  
  // ── Tempo de voo (ANAC obrigatório) ──
  flightTime: {
    day: number;                      // Tempo dia (horas decimais)
    night: number;                    // Tempo noite (horas decimais)
    instrument: number;               // Tempo por instrumentos
    crossCountry: number;             // Tempo entre(cidades)
  };
  
  // ── Distância (ANAC) ──
  totalDistance?: number;              // Distância total (NM)
  
  // ── Combustível (ANAC) ──
  fuelType?: string;                  // Tipo de combustível (ex: 100LL, Jet-A1)
  fuelQuantityDeparture?: number;     // Qtd combustível na decolagem (litros/kg)
  fuelQuantityArrival?: number;       // Qtd combustível no pouso (litros/kg)
  
  // ── Passageiros ──
  passengersCount?: number;           // Nº de passageiros
  
  // ── Tripulação (ANAC obrigatório) ──
  pilotInCommand: string;             // Nome do PIC
  pilotInCommandLicense?: string;     // Nº licença ANAC do PIC
  copilot: string;                    // Nome do SIC
  copilotLicense?: string;            // Nº licença ANAC do SIC
  instructor: string;                 // Nome do instrutor
  
  // ── Pousos (ANAC obrigatório) ──
  landings: {
    day: number;                      // Pousos de dia
    night: number;                    // Pousos de noite
  };
  
  // ── Condições meteorológicas (ANAC) ──
  metarDeparture?: string;            // METAR na decolagem
  metarArrival?: string;              // METAR no pouso
  
  // ── NOTAMs e obstáculos (ANAC) ──
  notams?: string;                    // NOTAMs relevantes ao voo
  obstacles?: string;                 // Obstáculos notáveis
  
  // ── Observações (ANAC) ──
  remarks: string;
  
  // ── Status ──
  status: FlightStatus;
  
  // ── Integridade e auditoria (Resolução 458/2017) ──
  integrityHash?: string;             // SHA-256 hash do registro
  signed?: boolean;                   // Se o registro foi assinado digitalmente
  locked?: boolean;                   // Imutável após assinatura
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Estatísticas de voo do piloto
 */
export interface FlightStats {
  totalFlights: number;
  totalHours: {
    day: number;
    night: number;
    instrument: number;
    crossCountry: number;
    pic: number;
    sic: number;
    dual: number;
    solo: number;
  };
  totalLandings: {
    day: number;
    night: number;
  };
  recentFlights: FlightRecord[];
  monthlyHours: { month: string; hours: number }[];
}

/**
 * Dados do usuário/piloto
 */
export interface Pilot {
  id: string;
  name: string;
  licenseNumber: string;              // Número da licença ANAC
  licenseType: string;                // Tipo de licença (PPL, CPL, ATPL)
  medicalClass: string;               // Classe do certificado médico
  medicalExpiry: string;              // Data de validade do médico
  email: string;
  createdAt: string;
}

/**
 * Dados para criar um novo voo
 */
export type CreateFlightDTO = Omit<FlightRecord, 'id' | 'createdAt' | 'updatedAt' | 'integrityHash' | 'signed' | 'locked'>;

/**
 * Dados para atualizar um voo
 */
export type UpdateFlightDTO = Partial<CreateFlightDTO>;

/**
 * Log de correção (quando um voo assinado é alterado)
 */
export interface CorrectionEntry {
  id: string;
  flightId: string;
  userId: string;
  field: string;
  oldValue: string;
  newValue: string;
  reason: string;
  correctedAt: string;
}

/**
 * Configurações do aplicativo
 */
export interface AppConfig {
  pilotInfo: Pilot;
  lastSync: string | null;
  theme: 'dark' | 'light';
  language: 'pt-BR' | 'en-US';
}
