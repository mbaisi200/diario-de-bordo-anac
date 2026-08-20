// ============================================================
// DIÁRIO DE BORDO DIGITAL - TIPOS ANAC/ICAO
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
 * Conforme campos obrigatórios ANAC (similar ao logbook físico)
 */
export interface FlightRecord {
  id: string;
  userId: string;
  
  // Data e hora
  date: string;                    // YYYY-MM-DD
  departureTime: string;           // HH:MM (UTC)
  arrivalTime: string;             // HH:MM (UTC)
  
  // Aeronave
  aircraftType: string;            // Ex: Cessna 172, Piper PA-28
  registration: string;            // Matrícula da aeronave (ex: PT-ABC)
  
  // Aeródromos
  departureAirport: string;        // Código ICAO (ex: SBGR)
  arrivalAirport: string;          // Código ICAO (ex: SBGL)
  
  // Tipos de voo (podem ser múltiplos)
  flightTypes: FlightType[];
  
  // Tempo de voo (em horas e minutos)
  flightTime: {
    day: number;                   // Tempo em horas (dia)
    night: number;                 // Tempo em horas (noite)
    instrument: number;            // Tempo por instrumentos
    crossCountry: number;          // Tempo entre(cidades)
  };
  
  // Pilotagem
  pilotInCommand: string;          // Nome do PIC (se aplicável)
  copilot: string;                 // Nome do SIC (se aplicável)
  instructor: string;              // Nome do instrutor (se aplicável)
  
  // Pousos
  landings: {
    day: number;                   // Pousos de dia
    night: number;                 // Pousos de noite
  };
  
  // Observações
  remarks: string;
  
  // Status
  status: FlightStatus;
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
  licenseNumber: string;           // Número da licença ANAC
  licenseType: string;             // Tipo de licença (PPL, CPL, ATPL)
  medicalClass: string;            // Classe do certificado médico
  medicalExpiry: string;           // Data de validade do médico
  email: string;
  createdAt: string;
}

/**
 * Dados para criar um novo voo
 */
export type CreateFlightDTO = Omit<FlightRecord, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Dados para atualizar um voo
 */
export type UpdateFlightDTO = Partial<CreateFlightDTO>;

/**
 * Configurações do aplicativo
 */
export interface AppConfig {
  pilotInfo: Pilot;
  lastSync: string | null;
  theme: 'dark' | 'light';
  language: 'pt-BR' | 'en-US';
}
