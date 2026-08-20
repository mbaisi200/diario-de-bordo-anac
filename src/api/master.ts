const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface AdminTenant {
  id: string;
  user_id: string;
  company_name: string;
  cnpj_cpf: string;
  email: string;
  phones: string[];
  address: {
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  active: boolean;
  username?: string;
  created_at: string;
}

export type CreateAdminDTO = {
  companyName: string;
  cnpjCpf: string;
  email: string;
  phones: string[];
  address: AdminTenant['address'];
  username: string;
  password: string;
};

export const masterApi = {
  async listAdmins(token: string): Promise<AdminTenant[]> {
    const response = await fetch(`${API_BASE}/master/admins`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Erro ao buscar admins');
    return response.json();
  },

  async createAdmin(token: string, data: CreateAdminDTO): Promise<AdminTenant> {
    const response = await fetch(`${API_BASE}/master/admins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Erro ao cadastrar admin');
    return body;
  },

  async updateAdmin(token: string, adminId: string, data: Partial<CreateAdminDTO>): Promise<AdminTenant> {
    const response = await fetch(`${API_BASE}/master/admins?adminId=${adminId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Erro ao atualizar admin');
    return body;
  },

  async deleteAdmin(token: string, adminId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/master/admins?adminId=${adminId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const body = await response.json();
      throw new Error(body.error || 'Erro ao excluir admin');
    }
  },
};