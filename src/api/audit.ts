/**
 * Serviço de API para auditoria, assinaturas e aprovações
 */

const API_BASE = '/api';

export const auditApi = {
  /**
   * Buscar log de auditoria de uma entidade
   */
  async getAuditLog(entityType: string, entityId: string) {
    const response = await fetch(`${API_BASE}/audit/${entityType}/${entityId}`);
    if (!response.ok) throw new Error('Erro ao buscar log de auditoria');
    return response.json();
  },

  /**
   * Criar registro de auditoria
   */
  async createAuditEntry(data: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValues?: any;
    newValues?: any;
  }) {
    const response = await fetch(`${API_BASE}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao criar registro de auditoria');
    return response.json();
  },

  /**
   * Assinar um voo digitalmente
   */
  async signFlight(data: {
    flightId: string;
    userId: string;
    signatureType: string;
    signatureData: string;
  }) {
    const response = await fetch(`${API_BASE}/audit/signatures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao assinar voo');
    return response.json();
  },

  /**
   * Buscar assinaturas de um voo
   */
  async getSignatures(flightId: string) {
    const response = await fetch(`${API_BASE}/audit/signatures/${flightId}`);
    if (!response.ok) throw new Error('Erro ao buscar assinaturas');
    return response.json();
  },

  /**
   * Verificar assinatura digital
   */
  async verifySignature(signatureId: string, signatureData: string) {
    const response = await fetch(`${API_BASE}/audit/signatures/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signatureId, signatureData }),
    });
    if (!response.ok) throw new Error('Erro ao verificar assinatura');
    return response.json();
  },

  /**
   * Aprovar um voo (carimbo da escola)
   */
  async approveFlight(data: {
    flightId: string;
    approvedBy: string;
    approvalRole: string;
    notes?: string;
  }) {
    const response = await fetch(`${API_BASE}/audit/approvals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao aprovar voo');
    return response.json();
  },

  /**
   * Buscar aprovações de um voo
   */
  async getApprovals(flightId: string) {
    const response = await fetch(`${API_BASE}/audit/approvals/${flightId}`);
    if (!response.ok) throw new Error('Erro ao buscar aprovações');
    return response.json();
  },
};
