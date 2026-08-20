const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface Pilot {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  license_number: string;
  license_type: string;
  medical_class: string;
  medical_expiry: string;
  cpf: string;
  email: string;
  phone: string;
  active: boolean;
  username?: string;
  created_at: string;
}

export interface Aircraft {
  id: string;
  tenant_id: string;
  registration: string;
  type: string;
  model: string;
  manufacturer: string;
  category: string;
  year: number;
  active: boolean;
  created_at: string;
}

export const adminApi = {
  async listPilots(token: string, tenantId: string): Promise<Pilot[]> {
    const response = await fetch(`${API_BASE}/admin/pilots?tenantId=${tenantId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Erro ao buscar pilotos');
    return response.json();
  },

  async createPilot(
    token: string,
    tenantId: string,
    data: {
      name: string;
      licenseNumber?: string;
      licenseType?: string;
      medicalClass?: string;
      medicalExpiry?: string;
      cpf?: string;
      email?: string;
      phone?: string;
      username: string;
      password: string;
    }
  ): Promise<Pilot> {
    const response = await fetch(`${API_BASE}/admin/pilots?tenantId=${tenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Erro ao cadastrar piloto');
    return body;
  },

  async deletePilot(token: string, tenantId: string, pilotId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/admin/pilots?tenantId=${tenantId}&pilotId=${pilotId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const body = await response.json();
      throw new Error(body.error || 'Erro ao excluir piloto');
    }
  },

  async listAircrafts(token: string, tenantId: string): Promise<Aircraft[]> {
    const response = await fetch(`${API_BASE}/admin/aircrafts?tenantId=${tenantId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Erro ao buscar aeronaves');
    return response.json();
  },

  async createAircraft(
    token: string,
    tenantId: string,
    data: {
      registration: string;
      type: string;
      model?: string;
      manufacturer?: string;
      category?: string;
      year?: number;
    }
  ): Promise<Aircraft> {
    const response = await fetch(`${API_BASE}/admin/aircrafts?tenantId=${tenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Erro ao cadastrar aeronave');
    return body;
  },

  async deleteAircraft(token: string, tenantId: string, aircraftId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/admin/aircrafts?tenantId=${tenantId}&aircraftId=${aircraftId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const body = await response.json();
      throw new Error(body.error || 'Erro ao excluir aeronave');
    }
  },
};