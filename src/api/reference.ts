const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface AirportOption {
  icao: string;
  name: string;
  city: string;
  region: string;
}

export interface AircraftTypeOption {
  icao?: string | null;
  model: string;
  manufacturer: string;
}

export interface RegistrationOption {
  registration: string;
  aircraftType: string;
  model: string;
  manufacturer: string;
}

/**
 * Busca aeródromos brasileiros (dados OurAirports) por ICAO, nome ou cidade
 */
export async function searchAirports(q: string): Promise<AirportOption[]> {
  const response = await fetch(`${API_BASE}/airports?q=${encodeURIComponent(q)}`);
  if (!response.ok) throw new Error('Erro ao buscar aeródromos');
  const json = await response.json();
  return json.data || [];
}

/**
 * Busca tipos de aeronave (dados RAB/ANAC) por modelo, fabricante ou código ICAO
 */
export async function searchAircraftTypes(q: string): Promise<AircraftTypeOption[]> {
  const response = await fetch(`${API_BASE}/aircraft-types?q=${encodeURIComponent(q)}`);
  if (!response.ok) throw new Error('Erro ao buscar tipos de aeronave');
  const json = await response.json();
  return json.data || [];
}

/**
 * Busca matrículas de aeronaves (cadastradas + histórico de voos) por prefixo
 */
export async function searchRegistrations(q: string): Promise<RegistrationOption[]> {
  const response = await fetch(`${API_BASE}/registrations?q=${encodeURIComponent(q)}`);
  if (!response.ok) throw new Error('Erro ao buscar matrículas');
  const json = await response.json();
  return json.data || [];
}