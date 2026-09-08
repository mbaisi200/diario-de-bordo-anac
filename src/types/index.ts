// ============================================================
// DIÁRIO DE BORDO DIGITAL - TIPOS ANAC/ICAO
// Conforme Portaria nº 3.220/SPO/SAR, Resolução nº 458/2017
// e Resolução ANAC nº 773/2025
// ============================================================

/**
 * Natureza do voo conforme IAC 3151 / Portaria 2.050/SPO/SAR
 * (Art. 4º, § 2º, inciso VIII da Resolução 457/2017)
 */
export type FlightNature =
  | 'PV'  // Voo de caráter privado
  | 'FR'  // Voo de fretamento
  | 'TN'  // Voo de treinamento
  | 'TR'  // Voo de traslado da aeronave
  | 'CQ'  // Voo de exame prático (vôo cheque ou recheque)
  | 'LR'  // Voo de linha regular
  | 'SA'  // Voo de serviço aéreo especializado
  | 'EX'  // Voo de experiência
  | 'AE'  // Autorização especial de voo
  | 'LX'  // Voo de linha não regular
  | 'LS'  // Voo de linha suplementar
  | 'IN'; // Voo de instrução para INSPAC

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
 * Função do tripulante conforme Portaria 14.096/SPO/2024
 * (Art. 17, inciso II da Portaria 3.220/SPO/SAR)
 */
export type CrewFunction =
  | 'PIC'   // Piloto em Comando (Pilot in Command)
  | 'SIC'   // Segundo em Comando (Second in Command)
  | 'FI'    // Flight Instructor (Instrutor de voo)
  | 'FE'    // Flight Engineer (Engenheiro de voo)
  | 'N1'    // Tripulante de cabine (1º)
  | 'N2'    // Tripulante de cabine (2º)
  | 'OBS'   // Observador
  | 'REL';  // Relief (Descanso)

/**
 * Dados do volume do diário de bordo
 * Conforme Art. 4º e 5º da Portaria 3.220/SPO/SAR
 */
export interface LogbookVolume {
  id: string;
  tenantId?: string;
  volumeNumber: string;               // Formato: NN/CC-MMM/AAAA (ex: 001/PTABC/26)
  aircraftRegistration: string;       // Matrícula da aeronave
  aircraftManufacturer: string;       // Fabricante
  aircraftModel: string;              // Modelo
  aircraftSerialNumber: string;       // Número de série
  registrationCategory: string;       // Categoria de registro
  totalHoursAtOpening: number;        // Horas totais na abertura
  totalCyclesAtOpening: number;       // Ciclos totais na abertura
  totalLandingsAtOpening: number;     // Pousos totais na abertura
  yearOfManufacture: string;          // Ano de fabricação
  owner: string;                      // Proprietário (RAB)
  operator: string;                   // Operador (RAB)
  openingDate: string;                // Data de abertura
  closingDate?: string;               // Data de encerramento
  status: 'open' | 'closed';
  signedBy?: string;                  // Quem assinou (operador/designado)
  signedAt?: string;                  // Data/hora da assinatura
  createdAt: string;
  updatedAt: string;
}

/**
 * Situação técnica da aeronave (Parte II do diário)
 * Conforme Capítulo V da Portaria 3.220/SPO/SAR
 */
export interface AircraftMaintenanceRecord {
  id: string;
  flightId: string;
  tenantId?: string;
  date: string;                       // Data do registro (dd/mm/aa)
  ataChapter?: string;                // Capítulo ATA 100
  discrepancy?: string;               // Discrepância técnica verificada
  correctiveAction?: string;          // Ação corretiva tomada
  lastMaintenanceType?: string;       // Tipo da última intervenção de manutenção
  nextMaintenanceType?: string;       // Tipo da próxima intervenção
  hoursToNextMaintenance?: number;    // Horas para próxima intervenção
  releasedByCode?: string;            // Código ANAC de quem liberou
  releasedBySignature?: string;       // Rubrica de quem liberou
  releasedAt?: string;                // Data/hora da liberação
  createdAt: string;
}

/**
 * Registro de um voo individual
 * Conforme campos obrigatórios ANAC (Portaria 3.220/SPO/SAR)
 * e exigências de integridade (Resolução 458/2017)
 */
export interface FlightRecord {
  id: string;
  tenantId?: string;
  userId: string;
  volumeId?: string;                  // ID do volume do diário

  // ── Dados de Identificação do Voo (ANAC obrigatório) ──
  sequentialNumber?: number;          // Número sequencial cronológico do voo
  flightNumber?: string;              // Número do voo
  flightRules?: FlightRules;          // Regras de voo (IFR/VFR)
  flightNature?: FlightNature;        // Natureza do voo (PV, FR, TN, etc.)

  // ── Data e hora (ANAC obrigatório) ──
  date: string;                       // YYYY-MM-DD
  departureTime: string;              // HH:MM (UTC)
  arrivalTime: string;                // HH:MM (UTC)

  // ── Aeronave (ANAC obrigatório) ──
  aircraftType: string;               // Tipo/certificação (ex: Cessna 172)
  registration: string;               // Matrícula (ex: PT-ABC)
  aircraftSerialNumber?: string;      // Número de série
  registrationCategory?: string;      // Categoria de registro

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

  // ── Ciclos e pousos (ANAC obrigatório) ──
  cycles?: {
    partial: number;                  // Ciclos parciais (neste voo)
    total: number;                    // Ciclos totais acumulados
  };

  // ── Distância (ANAC) ──
  totalDistance?: number;              // Distância total (NM)

  // ── Combustível (ANAC obrigatório) ──
  fuelType?: string;                  // Tipo de combustível (ex: 100LL, Jet-A1)
  fuelQuantityDeparture?: number;     // Qtd combustível na decolagem (litros/kg)
  fuelQuantityArrival?: number;       // Qtd combustível no pouso (litros/kg)

  // ── Passageiros e carga ──
  passengersCount?: number;           // Nº de passageiros
  cargoWeight?: number;               // Peso da carga transportada (kg)

  // ── Tripulação (ANAC obrigatório) ──
  crew?: CrewMember[];

  // Legado - manter para compatibilidade
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
  signedAt?: string;                  // Data/hora da assinatura
  locked?: boolean;                   // Imutável após assinatura
  mechanicReleaseCode?: string;       // Código ANAC do mecânico que liberou
  mechanicReleaseSignature?: string;  // Rubrica do mecânico

  createdAt: string;
  updatedAt: string;
}

/**
 * Membro da tripulação conforme Portaria 14.096/SPO/2024
 */
export interface CrewMember {
  name: string;                       // Nome do tripulante
  anacCode?: string;                  // Código ANAC (ex: 4530)
  licenseNumber?: string;             // Nº da licença
  role: CrewFunction;                 // Função a bordo
  presentationTime?: string;          // Hora de apresentação (UTC)
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
export type CreateFlightDTO = Omit<FlightRecord, 'id' | 'createdAt' | 'updatedAt' | 'integrityHash' | 'signed' | 'signedAt' | 'locked'>;

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

/**
 * Labels das naturezas de voo (Art. 4º, § 2º, inciso VIII)
 */
export const FLIGHT_NATURE_LABELS: Record<FlightNature, string> = {
  PV: 'Privado',
  FR: 'Fretamento',
  TN: 'Treinamento',
  TR: 'Traslado',
  CQ: 'Exame Prático (Cheque)',
  LR: 'Linha Regular',
  SA: 'Serviço Aéreo Especializado',
  EX: 'Experiência',
  AE: 'Autorização Especial',
  LX: 'Linha Não Regular',
  LS: 'Linha Suplementar',
  IN: 'Instrução INSPAC',
};

/**
 * Labels das funções de tripulante (Portaria 14.096/SPO/2024)
 */
export const CREW_FUNCTION_LABELS: Record<CrewFunction, string> = {
  PIC: 'Piloto em Comando',
  SIC: 'Segundo em Comando',
  FI: 'Instrutor de Voo',
  FE: 'Engenheiro de Voo',
  N1: 'Tripulante de Cabine 1º',
  N2: 'Tripulante de Cabine 2º',
  OBS: 'Observador',
  REL: 'Descanso (Relief)',
};
