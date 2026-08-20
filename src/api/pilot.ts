/**
 * Serviço de API para perfil do piloto
 */

const API_BASE = '/api';

export interface PilotProfile {
  id: string;
  user_id: string;
  full_name: string;
  license_number: string;
  license_type: string;
  medical_class: string;
  medical_expiry: string;
  rg: string;
  cpf: string;
  email: string;
  phone: string;
  address: string;
  birth_date: string;
  nationality: string;
  total_flight_hours: number;
  created_at: string;
  updated_at: string;
}

export type CreatePilotProfileDTO = Omit<PilotProfile, 'id' | 'created_at' | 'updated_at'>;

export const pilotApi = {
  /**
   * Buscar perfil do piloto
   */
  async getProfile(userId: string = 'default'): Promise<PilotProfile | null> {
    const response = await fetch(`${API_BASE}/pilot/profile?userId=${userId}`);
    if (!response.ok) throw new Error('Erro ao buscar perfil');
    const data = await response.json();
    return data || null;
  },

  /**
   * Criar ou atualizar perfil do piloto
   */
  async saveProfile(data: CreatePilotProfileDTO): Promise<PilotProfile> {
    const response = await fetch(`${API_BASE}/pilot/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao salvar perfil');
    return response.json();
  },
};
