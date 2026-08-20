import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import FlightForm from '../components/FlightForm';
import type { FlightRecord, CreateFlightDTO } from '../types';

// Mock data for editing
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
  remarks: 'Voo de ida ao RJ. Boas condições meteorológicas.',
  status: 'completed',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T16:30:00Z',
};

export default function NewFlight() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  
  const [existingFlight, setExistingFlight] = useState<FlightRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      // In a real app, this would fetch from API
      // For demo, we use mock data
      setExistingFlight(mockFlight);
    }
  }, [isEditing, id]);

  const handleSubmit = async (data: CreateFlightDTO) => {
    setIsLoading(true);
    
    try {
      // In a real app, this would call the API
      // await flightApi.createFlight(data);
      // or await flightApi.updateFlight(id!, data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Dados do voo:', data);
      alert(isEditing ? 'Voo atualizado com sucesso!' : 'Voo registrado com sucesso!');
      navigate('/flights');
    } catch (error) {
      console.error('Erro ao salvar voo:', error);
      alert('Erro ao salvar voo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/flights"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar para lista
      </Link>

      {/* Form */}
      <FlightForm
        initialData={existingFlight || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}
