import { useState } from 'react';
import { Stamp, Check, X } from 'lucide-react';

interface ApprovalStampProps {
  flightId: string;
  onApprove: () => void;
  onCancel: () => void;
}

const approvalRoles = [
  { value: 'instructor', label: 'Instrutor de Voo' },
  { value: 'examiner', label: 'Examinador' },
  { value: 'school', label: 'Escola de Voo' },
  { value: 'dispatcher', label: 'Despachante' },
];

export default function ApprovalStamp({ flightId, onApprove, onCancel }: ApprovalStampProps) {
  const [approvedBy, setApprovedBy] = useState('');
  const [approvalRole, setApprovalRole] = useState('instructor');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    if (!approvedBy.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/audit/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightId,
          approvedBy: approvedBy.trim(),
          approvalRole,
          notes: notes.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao aprovar voo');
      }

      onApprove();
    } catch (error) {
      console.error('Error approving flight:', error);
      alert('Erro ao aprovar voo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 text-green-400">
        <Stamp className="w-5 h-5 inline mr-2" />
        Carimbo de Aprovação
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nome de quem aprova *</label>
          <input
            type="text"
            value={approvedBy}
            onChange={e => setApprovedBy(e.target.value)}
            placeholder="Nome completo"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Função *</label>
          <select
            value={approvalRole}
            onChange={e => setApprovalRole(e.target.value)}
            className="w-full"
          >
            {approvalRoles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Observações</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Observações sobre a aprovação"
            rows={3}
            className="w-full resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary flex-1">
            <X className="w-4 h-4 inline mr-2" />
            Cancelar
          </button>
          <button
            onClick={handleApprove}
            disabled={!approvedBy.trim() || isLoading}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            <Check className="w-4 h-4 inline mr-2" />
            {isLoading ? 'Aprovando...' : 'Aprovar'}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        ⓘ A aprovação gera registro de auditoria com timestamp e IP
      </p>
    </div>
  );
}
