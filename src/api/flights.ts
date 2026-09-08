import type { FlightRecord, FlightStats, CreateFlightDTO, UpdateFlightDTO } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Serviço de API para o Diário de Bordo
 * Comunica com o backend via REST API
 */
export const flightApi = {
  /**
   * Buscar todos os voos do usuário
   */
  async getFlights(userId: string = 'default'): Promise<FlightRecord[]> {
    const response = await fetch(`${API_BASE}/flights?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar voos');
    }
    return response.json();
  },

  /**
   * Buscar um voo específico por ID
   */
  async getFlight(id: string): Promise<FlightRecord> {
    const response = await fetch(`${API_BASE}/flights/${id}`);
    if (!response.ok) {
      throw new Error('Voo não encontrado');
    }
    return response.json();
  },

  /**
   * Criar um novo registro de voo
   */
  async createFlight(data: CreateFlightDTO): Promise<FlightRecord> {
    const response = await fetch(`${API_BASE}/flights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Erro ao criar voo');
    }
    return response.json();
  },

  /**
   * Atualizar um voo existente
   */
  async updateFlight(id: string, data: UpdateFlightDTO): Promise<FlightRecord> {
    const response = await fetch(`${API_BASE}/flights/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Erro ao atualizar voo');
    }
    return response.json();
  },

  /**
   * Deletar um voo
   */
  async deleteFlight(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/flights/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Erro ao deletar voo');
    }
  },

  /**
   * Buscar estatísticas de voo
   */
  async getStats(userId: string = 'default'): Promise<FlightStats> {
    const response = await fetch(`${API_BASE}/flights/stats?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar estatísticas');
    }
    return response.json();
  },

  /**
   * Exportar dados como JSON
   */
  async exportData(userId: string = 'default'): Promise<Blob> {
    const response = await fetch(`${API_BASE}/flights/export?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Erro ao exportar dados');
    }
    return response.blob();
  },

  /**
   * Importar dados de JSON
   */
  async importData(data: { flights: FlightRecord[] }): Promise<{ imported: number }> {
    const response = await fetch(`${API_BASE}/flights/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Erro ao importar dados');
    }
    return response.json();
  },

  /**
   * Assinar voo eletronicamente (trava registro - Res. 458/2017)
   */
  async signFlight(id: string, userId: string, signatureData?: string): Promise<FlightRecord> {
    const response = await fetch(`${API_BASE}/flights/${id}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, signatureData }),
    });
    if (!response.ok) {
      throw new Error('Erro ao assinar voo');
    }
    return response.json();
  },

  // ── Volumes do Diário de Bordo (Portaria 3.220/SPO) ──

  async getVolumes(userId: string = 'default'): Promise<any[]> {
    const response = await fetch(`${API_BASE}/flights/volumes?userId=${userId}`);
    if (!response.ok) throw new Error('Erro ao buscar volumes');
    return response.json();
  },

  async createVolume(data: any): Promise<any> {
    const response = await fetch(`${API_BASE}/flights/volumes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao criar volume');
    return response.json();
  },

  async closeVolume(id: string, signedBy: string): Promise<any> {
    const response = await fetch(`${API_BASE}/flights/volumes/${id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signedBy }),
    });
    if (!response.ok) throw new Error('Erro ao fechar volume');
    return response.json();
  },

  // ── Manutenção - Parte II (IAC 3151) ──

  async getMaintenance(flightId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE}/flights/${flightId}/maintenance`);
    if (!response.ok) throw new Error('Erro ao buscar manutenção');
    return response.json();
  },

  async createMaintenance(flightId: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE}/flights/${flightId}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao criar manutenção');
    return response.json();
  },
};

/**
 * Funções utilitárias para cálculos de voo
 */
export const flightUtils = {
  /**
   * Calcular tempo total de voo (em horas decimais)
   */
  calculateFlightDuration(departure: string, arrival: string): number {
    const [depH, depM] = departure.split(':').map(Number);
    const [arrH, arrM] = arrival.split(':').map(Number);
    
    let hours = arrH - depH;
    let minutes = arrM - depM;
    
    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }
    
    if (hours < 0) {
      hours += 24;
    }
    
    return hours + minutes / 60;
  },

  /**
   * Formatar horas de voo para exibição (HH:MM)
   */
  formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  },

  /**
   * Formatar data para exibição brasileira
   */
  formatDate(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
  },

  /**
   * Formatar hora UTC para exibição
   */
  formatTime(time: string): string {
    return `${time} UTC`;
  },

  /**
   * Validar código ICAO
   */
  validateICAO(code: string): boolean {
    return /^[A-Z]{4}$/.test(code);
  },

  /**
   * Validar matrícula de aeronave brasileira
   */
  validateRegistration(reg: string): boolean {
    return /^PT-[A-Z]{3}$/i.test(reg);
  },

  /**
   * Calcular tempo total de voo a partir dos campos
   */
  calculateTotalFlightTime(flightTime: FlightRecord['flightTime']): number {
    return flightTime.day + flightTime.night;
  },

  /**
   * Calcular total de pousos
   */
  calculateTotalLandings(landings: FlightRecord['landings']): number {
    return landings.day + landings.night;
  },
};
