import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Download, Upload, FileText } from 'lucide-react';
import type { FlightRecord } from '../types';
import FlightList from '../components/FlightList';
import { pilotApi, PilotProfile } from '../api/pilot';
import { generateFlightReport, downloadPdf } from '../utils/pdfReport';

// Mock data for demo
const mockFlights: FlightRecord[] = [
  {
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
  },
  {
    id: '2',
    userId: 'default',
    date: '2024-01-10',
    departureTime: '08:00',
    arrivalTime: '10:00',
    aircraftType: 'Piper PA-28 Cherokee',
    registration: 'PT-DEF',
    departureAirport: 'SBSP',
    arrivalAirport: 'SBKP',
    flightTypes: ['dual', 'instruction'],
    flightTime: { day: 2.0, night: 0, instrument: 0, crossCountry: 0 },
    pilotInCommand: 'João Silva',
    copilot: '',
    instructor: 'Carlos Santos',
    landings: { day: 4, night: 0 },
    remarks: 'Prática de circuito de tráfego e pousos.',
    status: 'completed',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '3',
    userId: 'default',
    date: '2024-01-05',
    departureTime: '19:00',
    arrivalTime: '21:00',
    aircraftType: 'Cessna 172 Skyhawk',
    registration: 'PT-ABC',
    departureAirport: 'SBGR',
    arrivalAirport: 'SBCF',
    flightTypes: ['pic', 'night'],
    flightTime: { day: 0, night: 2.0, instrument: 1.5, crossCountry: 2.0 },
    pilotInCommand: 'João Silva',
    copilot: '',
    instructor: '',
    landings: { day: 0, night: 2 },
    remarks: 'Voo noturno para Campinas. IFR parcial.',
    status: 'completed',
    createdAt: '2024-01-05T19:00:00Z',
    updatedAt: '2024-01-05T21:00:00Z',
  },
  {
    id: '4',
    userId: 'default',
    date: '2024-01-02',
    departureTime: '10:00',
    arrivalTime: '11:30',
    aircraftType: 'Cessna 172 Skyhawk',
    registration: 'PT-ABC',
    departureAirport: 'SBGR',
    arrivalAirport: 'SBRP',
    flightTypes: ['solo'],
    flightTime: { day: 1.5, night: 0, instrument: 0, crossCountry: 0 },
    pilotInCommand: 'João Silva',
    copilot: '',
    instructor: '',
    landings: { day: 3, night: 0 },
    remarks: 'Primeiro voo solo. Circuito de tráfego em Ribeirão Preto.',
    status: 'completed',
    createdAt: '2024-01-02T10:00:00Z',
    updatedAt: '2024-01-02T11:30:00Z',
  },
];

export default function FlightListPage() {
  const [flights, setFlights] = useState<FlightRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pilotProfile, setPilotProfile] = useState<PilotProfile | null>(null);

  useEffect(() => {
    // In a real app, this would fetch from API
    // const data = await flightApi.getFlights();
    // setFlights(data);
    
    // For demo, use mock data
    setTimeout(() => {
      setFlights(mockFlights);
      setIsLoading(false);
    }, 500);

    // Fetch pilot profile
    pilotApi.getProfile().then(profile => setPilotProfile(profile));
  }, []);

  const handleExport = async () => {
    try {
      // In a real app, this would call the API
      // const blob = await flightApi.exportData();
      // const url = URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `diario-de-bordo-${new Date().toISOString().split('T')[0]}.json`;
      // a.click();
      
      // For demo, just alert
      alert('Dados exportados com sucesso!');
    } catch (error) {
      alert('Erro ao exportar dados');
    }
  };

  const handleImport = () => {
    // This would open a file picker in a real app
    alert('Funcionalidade de importação será implementada');
  };

  const handleExportPdf = () => {
    const doc = generateFlightReport(flights, pilotProfile, 'Relatório de Voos');
    downloadPdf(doc, `diario-de-bordo-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meus Voos</h1>
          <p className="text-gray-400">
            {flights.length} voo(s) registrado(s)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="btn-secondary inline-flex items-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Exportar JSON
          </button>
          <button
            onClick={handleExportPdf}
            className="btn-secondary inline-flex items-center border-green-500 text-green-400 hover:bg-green-900/30"
          >
            <FileText className="w-5 h-5 mr-2" />
            Exportar PDF
          </button>
          <button
            onClick={handleImport}
            className="btn-secondary inline-flex items-center"
          >
            <Upload className="w-5 h-5 mr-2" />
            Importar
          </button>
          <Link
            to="/new-flight"
            className="btn-primary inline-flex items-center"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Novo Voo
          </Link>
        </div>
      </div>

      {/* Flight List */}
      <FlightList flights={flights} isLoading={isLoading} />
    </div>
  );
}
