import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plane, 
  Clock, 
  MapPin, 
  Calendar,
  User,
  Pen,
  Stamp
} from 'lucide-react';
import type { FlightRecord } from '../types';
import { flightUtils } from '../api/flights';
import { useAuth } from '../contexts/AuthContext';
import SignaturePad from '../components/SignaturePad';
import AuditLog from '../components/AuditLog';
import ApprovalStamp from '../components/ApprovalStamp';

// Mock data for demo
const mockFlight: FlightRecord = {
  id: '1',
  userId: 'default',
  date: '2024-01-15',
  departureTime: '14:00',
  arrivalTime: '16:30',
  aircraftType: 'Cessna 172 Skyhawk',
  registration: 'PT-ABC',
  departureAirport: 'SBGR',
  arrivalAirport: 'SBGL',
  flightTypes: ['pic', 'cross_country'],
  flightTime: { day: 2.5, night: 0, instrument: 0, crossCountry: 2.5 },
  pilotInCommand: 'João Silva',
  copilot: '',
  instructor: '',
  landings: { day: 2, night: 0 },
  remarks: 'Voo de ida ao RJ. Boas condições meteorológicas. Tráfego intenso no TMA do Galeão. Pouso na RWY 10.',
  status: 'completed',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T16:30:00Z',
};

const flightTypeLabels: Record<string, string> = {
  dual: 'Duplo Comando',
  solo: 'Solo',
  pic: 'Piloto em Comando',
  sic: 'Segundo em Comando',
  cross_country: 'Entre(cidades)',
  instruction: 'Instrução em Voo',
  check: 'Checagem',
  ipc: 'Instrument Proficiency Check',
  bfr: 'Biennial Flight Review',
  ferry: 'Ferry Flight',
  other: 'Outro',
};

export default function FlightDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [flight, setFlight] = useState<FlightRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [showApprovalStamp, setShowApprovalStamp] = useState(false);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);

  useEffect(() => {
    // In a real app, this would fetch from API
    // const data = await flightApi.getFlight(id!);
    // setFlight(data);
    
    // For demo, use mock data
    setTimeout(() => {
      setFlight(mockFlight);
      setIsLoading(false);
    }, 300);
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este voo?')) {
      try {
        // In a real app, this would call the API
        // await flightApi.deleteFlight(id!);
        alert('Voo excluído com sucesso!');
        navigate('/flights');
      } catch (error) {
        alert('Erro ao excluir voo');
      }
    }
  };

  const handleSign = async (signatureData: string) => {
    if (!user || !flight) return;
    
    try {
      const response = await fetch('/api/audit/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightId: flight.id,
          userId: user.id,
          signatureType: 'pilot',
          signatureData,
        }),
      });

      if (!response.ok) throw new Error('Erro ao assinar');
      
      alert('Voo assinado com sucesso!');
      setShowSignaturePad(false);
      setSignatures(prev => [...prev, { user_name: user.name, signature_type: 'pilot', signed_at: new Date().toISOString() }]);
    } catch (error) {
      alert('Erro ao assinar voo');
    }
  };

  const handleApprove = async () => {
    if (!flight) return;
    
    try {
      const response = await fetch(`/api/audit/approvals/${flight.id}`);
      if (response.ok) {
        const data = await response.json();
        setApprovals(data);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
    }
    setShowApprovalStamp(false);
    alert('Voo aprovado com sucesso!');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card animate-pulse">
          <div className="h-8 bg-aviation-light rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-aviation-light rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-aviation-light rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">Voo não encontrado</p>
        <Link to="/flights" className="text-aviation-accent hover:underline mt-4 inline-block">
          Voltar para lista
        </Link>
      </div>
    );
  }

  const totalFlightTime = flightUtils.calculateTotalFlightTime(flight.flightTime);
  const totalLandings = flightUtils.calculateTotalLandings(flight.landings);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/flights"
            className="p-2 rounded-lg hover:bg-aviation-light transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {flight.registration} - {flight.aircraftType}
            </h1>
            <p className="text-gray-400">{flightUtils.formatDate(flight.date)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/edit-flight/${flight.id}`}
            className="btn-secondary inline-flex items-center"
          >
            <Edit className="w-5 h-5 mr-2" />
            Editar
          </Link>
          <button
            onClick={() => setShowSignaturePad(true)}
            className="btn-secondary inline-flex items-center border-purple-500 text-purple-400 hover:bg-purple-900/30"
          >
            <Pen className="w-5 h-5 mr-2" />
            Assinar
          </button>
          <button
            onClick={() => setShowApprovalStamp(true)}
            className="btn-secondary inline-flex items-center border-green-500 text-green-400 hover:bg-green-900/30"
          >
            <Stamp className="w-5 h-5 mr-2" />
            Aprovar
          </button>
          <button
            onClick={handleDelete}
            className="btn-danger inline-flex items-center"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Excluir
          </button>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/edit-flight/${flight.id}`}
            className="btn-secondary inline-flex items-center"
          >
            <Edit className="w-5 h-5 mr-2" />
            Editar
          </Link>
          <button
            onClick={handleDelete}
            className="btn-danger inline-flex items-center"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Excluir
          </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="card">
        {/* Route Display */}
        <div className="flex items-center justify-center gap-6 py-8 bg-aviation-dark rounded-xl mb-6">
          <div className="text-center">
            <p className="text-4xl font-bold font-mono text-aviation-accent">
              {flight.departureAirport}
            </p>
            <p className="text-sm text-gray-400 mt-2">ORIGEM</p>
          </div>
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="h-0.5 flex-1 bg-aviation-light"></div>
            <Plane className="w-8 h-8 text-aviation-accent mx-4 rotate-90" />
            <div className="h-0.5 flex-1 bg-aviation-light"></div>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold font-mono text-aviation-accent">
              {flight.arrivalAirport}
            </p>
            <p className="text-sm text-gray-400 mt-2">DESTINO</p>
          </div>
        </div>

        {/* Time Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-aviation-dark rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Data</span>
            </div>
            <p className="text-lg font-semibold">{flightUtils.formatDate(flight.date)}</p>
          </div>
          <div className="p-4 bg-aviation-dark rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Decolagem</span>
            </div>
            <p className="text-lg font-semibold">{flightUtils.formatTime(flight.departureTime)}</p>
          </div>
          <div className="p-4 bg-aviation-dark rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Pouso</span>
            </div>
            <p className="text-lg font-semibold">{flightUtils.formatTime(flight.arrivalTime)}</p>
          </div>
          <div className="p-4 bg-aviation-accent/20 rounded-lg border border-aviation-accent">
            <div className="flex items-center gap-2 text-aviation-accent mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Tempo Total</span>
            </div>
            <p className="text-3xl font-bold font-mono">{flightUtils.formatHours(totalFlightTime)}</p>
          </div>
        </div>

        {/* Flight Types */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Tipos de Voo</h3>
          <div className="flex flex-wrap gap-2">
            {flight.flightTypes.map(type => (
              <span
                key={type}
                className="px-4 py-2 bg-aviation-accent/20 text-aviation-accent rounded-lg font-medium"
              >
                {flightTypeLabels[type] || type}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Flight Time Details */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">⏱️ Detalhes do Tempo de Voo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-aviation-dark rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Dia</p>
            <p className="text-2xl font-bold font-mono text-aviation-accent">
              {flightUtils.formatHours(flight.flightTime.day)}
            </p>
          </div>
          <div className="p-4 bg-aviation-dark rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Noite</p>
            <p className="text-2xl font-bold font-mono text-aviation-accent">
              {flightUtils.formatHours(flight.flightTime.night)}
            </p>
          </div>
          <div className="p-4 bg-aviation-dark rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Instrumentos</p>
            <p className="text-2xl font-bold font-mono text-aviation-accent">
              {flightUtils.formatHours(flight.flightTime.instrument)}
            </p>
          </div>
          <div className="p-4 bg-aviation-dark rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Entre(cidades)</p>
            <p className="text-2xl font-bold font-mono text-aviation-accent">
              {flightUtils.formatHours(flight.flightTime.crossCountry)}
            </p>
          </div>
        </div>
      </div>

      {/* Landings */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">🛬 Pousos</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-aviation-dark rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Dia</p>
            <p className="text-3xl font-bold">{flight.landings.day}</p>
          </div>
          <div className="p-4 bg-aviation-dark rounded-lg text-center">
            <p className="text-gray-400 text-sm mb-1">Noite</p>
            <p className="text-3xl font-bold">{flight.landings.night}</p>
          </div>
          <div className="p-4 bg-aviation-accent/20 rounded-lg text-center border border-aviation-accent">
            <p className="text-aviation-accent text-sm mb-1 font-medium">Total</p>
            <p className="text-3xl font-bold text-aviation-accent">{totalLandings}</p>
          </div>
        </div>
      </div>

      {/* Crew */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">👨‍✈️ Tripulação</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-aviation-dark rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <User className="w-4 h-4" />
              <span className="text-sm">Piloto em Comando (PIC)</span>
            </div>
            <p className="text-lg font-semibold">{flight.pilotInCommand || '-'}</p>
          </div>
          <div className="p-4 bg-aviation-dark rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <User className="w-4 h-4" />
              <span className="text-sm">Segundo em Comando (SIC)</span>
            </div>
            <p className="text-lg font-semibold">{flight.copilot || '-'}</p>
          </div>
          <div className="p-4 bg-aviation-dark rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <User className="w-4 h-4" />
              <span className="text-sm">Instrutor</span>
            </div>
            <p className="text-lg font-semibold">{flight.instructor || '-'}</p>
          </div>
        </div>
      </div>

      {/* Remarks */}
      {flight.remarks && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">📝 Observações</h3>
          <div className="p-4 bg-aviation-dark rounded-lg">
            <p className="text-gray-300 whitespace-pre-wrap">{flight.remarks}</p>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Status</p>
            <p className="text-lg font-semibold capitalize">{flight.status}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Criado em</p>
            <p className="text-lg font-semibold">
              {new Date(flight.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* Signatures */}
      {signatures.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-purple-400">
            <Pen className="w-5 h-5 inline mr-2" />
            Assinaturas Digitais
          </h3>
          <div className="space-y-3">
            {signatures.map((sig, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-aviation-dark rounded-lg">
                <Pen className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="font-medium">{sig.user_name}</p>
                  <p className="text-sm text-gray-400">
                    {sig.signature_type} • {new Date(sig.signed_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approvals */}
      {approvals.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-green-400">
            <Stamp className="w-5 h-5 inline mr-2" />
            Aprovações
          </h3>
          <div className="space-y-3">
            {approvals.map((approval, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-aviation-dark rounded-lg border border-green-500/30">
                <Stamp className="w-5 h-5 text-green-400" />
                <div>
                  <p className="font-medium">{approval.approved_by}</p>
                  <p className="text-sm text-gray-400">
                    {approval.approval_role} • {new Date(approval.approved_at).toLocaleString('pt-BR')}
                  </p>
                  {approval.notes && <p className="text-sm text-gray-300 mt-1">{approval.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <SignaturePad
              onSign={handleSign}
              onCancel={() => setShowSignaturePad(false)}
            />
          </div>
        </div>
      )}

      {/* Approval Stamp Modal */}
      {showApprovalStamp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <ApprovalStamp
              flightId={flight.id}
              onApprove={handleApprove}
              onCancel={() => setShowApprovalStamp(false)}
            />
          </div>
        </div>
      )}

      {/* Audit Log */}
      <AuditLog entityType="flight" entityId={flight.id} />

      {/* Disclaimer */}
      <div className="card bg-yellow-900/30 border-yellow-500">
        <p className="text-yellow-500 text-sm">
          ⚠️ Este registro é uma cópia de segurança. O diário de bordo oficial deve seguir o formato homologado pela ANAC (Resolução nº 478).
        </p>
      </div>
    </div>
  );
}
