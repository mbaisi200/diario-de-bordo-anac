import { useEffect, useState } from 'react';
import { History, Edit, Trash2, Plus, Check, Pen } from 'lucide-react';

interface AuditEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: any;
  new_values: any;
  ip_address: string;
  created_at: string;
  user_name?: string;
}

interface AuditLogProps {
  entityType: string;
  entityId: string;
}

const actionLabels: Record<string, { label: string; icon: any; color: string }> = {
  CREATE: { label: 'Criado', icon: Plus, color: 'text-green-400' },
  UPDATE: { label: 'Atualizado', icon: Edit, color: 'text-blue-400' },
  DELETE: { label: 'Excluído', icon: Trash2, color: 'text-red-400' },
  SIGN: { label: 'Assinado', icon: Pen, color: 'text-purple-400' },
  APPROVE: { label: 'Aprovado', icon: Check, color: 'text-green-400' },
};

export default function AuditLog({ entityType, entityId }: AuditLogProps) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [entityType, entityId]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/audit/${entityType}/${entityId}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatChanges = (oldValues: any, newValues: any) => {
    if (!oldValues && !newValues) return null;

    const changes: string[] = [];

    if (newValues) {
      Object.entries(newValues).forEach(([key, value]) => {
        if (oldValues && oldValues[key] !== undefined) {
          changes.push(`${key}: ${oldValues[key]} → ${value}`);
        } else {
          changes.push(`${key}: ${value}`);
        }
      });
    }

    return changes.length > 0 ? changes : null;
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-aviation-light rounded w-1/4"></div>
          <div className="h-4 bg-aviation-light rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 text-aviation-accent">
        <History className="w-5 h-5 inline mr-2" />
        Histórico de Alterações
      </h3>

      {logs.length === 0 ? (
        <p className="text-gray-400 text-center py-4">Nenhum registro de alteração</p>
      ) : (
        <div className="space-y-3">
          {logs.map(log => {
            const actionInfo = actionLabels[log.action] || { label: log.action, icon: Edit, color: 'text-gray-400' };
            const Icon = actionInfo.icon;
            const changes = formatChanges(log.old_values, log.new_values);

            return (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 bg-aviation-dark rounded-lg"
              >
                <div className={`mt-0.5 ${actionInfo.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${actionInfo.color}`}>
                      {actionInfo.label}
                    </span>
                    <span className="text-gray-400 text-sm">
                      por {log.user_name || log.user_id}
                    </span>
                  </div>
                  {changes && (
                    <div className="mt-1 text-sm text-gray-400">
                      {changes.map((change, i) => (
                        <div key={i}>{change}</div>
                      ))}
                    </div>
                  )}
                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                    {log.ip_address && ` • IP: ${log.ip_address}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
