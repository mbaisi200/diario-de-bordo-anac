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
 * Estrutura baseada no modelo físico JOMARCA (rlvoo.jpeg)
 */
export interface FlightRecord {
  id: string;
  tenantId?: string;
  userId: string;
  volumeId?: string;                  // ID do volume do diário
  volumeNumber?: string;              // Número do diário (ex: 09/PR-JMN/2025)

  // ── Dados de Identificação do Voo (ANAC obrigatório) ──
  sequentialNumber?: number;          // Número sequencial cronológico do voo (etapa)
  flightNumber?: string;              // Número do voo
  flightRules?: FlightRules;          // Regras de voo (IFR/VFR)
  flightNature?: FlightNature;        // Natureza do voo (PV, FR, TN, etc.)

  // ── Data e hora (ANAC obrigatório) ──
  date: string;                       // YYYY-MM-DD
  partidaTime?: string;               // Hora partida (off-block) - HH:MM (UTC)
  departureTime: string;              // Hora decolagem (takeoff) - HH:MM (UTC)
  arrivalTime: string;                // Hora pouso (landing) - HH:MM (UTC)
  corteTime?: string;                 // Hora corte (shutdown) - HH:MM (UTC)

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
    div?: number;                     // DIV - Dia Instrumento Visual
    not?: number;                     // NOT - Noturno
    vfr?: number;                     // VFR - Regras de Voo por Visualização
  };

  // ── Ciclos e pousos (ANAC obrigatório) ──
  cycles?: {
    partial: number;                  // Ciclos parciais (neste voo)
    total: number;                    // Ciclos totais acumulados
    pousoPartial?: number;            // Pousos parciais (neste voo)
    pousoTotal?: number;              // Pousos totais acumulados
    ng1?: number;                     // NG 1 (Gas Generator) - ciclos parciais
    ntl1?: number;                    // NTL 1 (Power Turbine) - ciclos parciais
    ng1Total?: number;                // NG 1 total acumulado
    ntl1Total?: number;               // NTL 1 total acumulado
  };

  // ── Distância (ANAC) ──
  totalDistance?: number;              // Distância total (NM)

  // ── Combustível (ANAC obrigatório) ──
  fuelType?: string;                  // Tipo de combustível (ex: 100LL, Jet-A1)
  fuelQuantityDeparture?: number;     // Qtd combustível na decolagem (litros/kg)
  fuelQuantityArrival?: number;       // Qtd combustível no pouso (litros/kg)
  fuelTotal?: number;                 // Combustível total (kg)

  // ── Passageiros e carga ──
  passengersCount?: number;           // Nº de passageiros (POB)
  cargoWeight?: number;               // Peso da carga transportada (kg)
  flightNatureCode?: string;          // NAT - Código natureza (PV, FR, etc.)

  // ── Tripulação (ANAC obrigatório) ──
  crew?: CrewMember[];

  // Legado - manter para compatibilidade
  pilotInCommand: string;             // Nome do PIC
  pilotInCommandLicense?: string;     // Nº licença ANAC do PIC
  pilotInCommandFunction?: string;    // Função do PIC
  copilot: string;                    // Nome do SIC
  copilotLicense?: string;            // Nº licença ANAC do SIC
  instructor: string;                 // Nome do instrutor

  // ── Rubrica PIC ──
  picSignature?: string;              // Assinatura/rubrica do PIC

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

  // ── Horas Acumuladas ──
  cumulativeHours?: {
    horasCelula: number;              // Horas totais da célula
    horasMotor: number;               // Horas totais do motor
    cicloNg: number;                  // Ciclo NG acumulado
    cicloNtl: number;                 // Ciclo NTL acumulado
    pousoCelula: number;              // Pousos totais da célula
  };

  // ── Inspeção de VOR (RBAC 91.171) ──
  vorInspection?: {
    vor1Rddme?: string;               // VOR #1 - RD/DME
    vor1Difference?: number;          // Diferença de marcação VOR #1
    vor2Rddme?: string;               // VOR #2 - RD/DME
    vor2Difference?: number;          // Diferença de marcação VOR #2
    maxAllowedDifference: number;     // Máximo permitido (4 graus)
  };

  // ── Banco de Dados - GPS/FMS ──
  databaseUpdate?: {
    updated: boolean;                 // Atualizado? SIM/NÃO
    lastUpdate?: string;              // Data da última atualização
    expiration?: string;              // Vencimento
  };

  // ── Parte II - Situação Técnica da Aeronave ──
  maintenanceRecord?: {
    lastMaintenanceType?: string;     // Tipo da última intervenção de manutenção
    nextMaintenanceType?: string;     // Tipo da próxima intervenção
    hoursToNextMaintenance?: number;  // Horas de célula para próxima intervenção
    releasedByCode?: string;          // Código ANAC do responsável
    releasedBySignature?: string;     // Rubrica/assinatura do responsável
  };

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
