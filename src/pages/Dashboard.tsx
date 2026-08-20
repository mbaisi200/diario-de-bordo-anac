import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plane, 
  Clock, 
  MapPin, 
  TrendingUp, 
  PlusCircle,
  AlertTriangle,
  Calendar,
  BarChart3,
  Zap
} from 'lucide-react';
import type { FlightRecord, FlightStats } from '../types';
import { flightUtils } from '../api/flights';
import FlightCard from '../components/FlightCard';
import { useTheme } from '../contexts/ThemeContext';

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
];

export default function Dashboard() {
  const [flights] = useState<FlightRecord[]>(mockFlights);
  const [stats, setStats] = useState<FlightStats | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    // Calculate stats from mock data
    const totalHours = flights.reduce(
      (acc, flight) => ({
        day: acc.day + flight.flightTime.day,
        night: acc.night + flight.flightTime.night,
        instrument: acc.instrument + flight.flightTime.instrument,
        crossCountry: acc.crossCountry + flight.flightTime.crossCountry,
        pic: acc.pic + (flight.flightTypes.includes('pic') ? flight.flightTime.day + flight.flightTime.night : 0),
        sic: acc.sic + (flight.flightTypes.includes('sic') ? flight.flightTime.day + flight.flightTime.night : 0),
        dual: acc.dual + (flight.flightTypes.includes('dual') ? flight.flightTime.day + flight.flightTime.night : 0),
        solo: acc.solo + (flight.flightTypes.includes('solo') ? flight.flightTime.day + flight.flightTime.night : 0),
      }),
      { day: 0, night: 0, instrument: 0, crossCountry: 0, pic: 0, sic: 0, dual: 0, solo: 0 }
    );

    const totalLandings = flights.reduce(
      (acc, flight) => ({
        day: acc.day + flight.landings.day,
        night: acc.night + flight.landings.night,
      }),
      { day: 0, night: 0 }
    );

    setStats({
      totalFlights: flights.length,
      totalHours,
      totalLandings,
      recentFlights: flights.slice(0, 3),
      monthlyHours: [],
    });
  }, [flights]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Visão geral do seu diário de bordo</p>
        </div>
        <Link to="/new-flight" className="btn-primary inline-flex items-center justify-center">
          <PlusCircle className="w-5 h-5 mr-2" />
          Registrar Novo Voo
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20">
              <Plane className="w-5 h-5 text-blue-400" />
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total de Voos</span>
          </div>
          <p className="text-3xl font-bold gradient-text">{stats?.totalFlights || 0}</p>
        </div>
        <div className="stat-card group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Horas Totais</span>
          </div>
          <p className="text-3xl font-bold gradient-text font-mono">
            {stats ? flightUtils.formatHours(stats.totalHours.day + stats.totalHours.night) : '00:00'}
          </p>
        </div>
        <div className="stat-card group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Horas PIC</span>
          </div>
          <p className="text-3xl font-bold gradient-text font-mono">
            {stats ? flightUtils.formatHours(stats.totalHours.pic) : '00:00'}
          </p>
        </div>
        <div className="stat-card group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20">
              <MapPin className="w-5 h-5 text-purple-400" />
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Pousos</span>
          </div>
          <p className="text-3xl font-bold">
            {(stats?.totalLandings.day || 0) + (stats?.totalLandings.night || 0)}
          </p>
        </div>
      </div>

      {/* Detailed Hours */}
      <div className="card animate-slide-up">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          Horas por Categoria
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <p className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Dia</p>
            <p className="text-2xl font-bold font-mono gradient-text">
              {stats ? flightUtils.formatHours(stats.totalHours.day) : '00:00'}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <p className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Noite</p>
            <p className="text-2xl font-bold font-mono gradient-text">
              {stats ? flightUtils.formatHours(stats.totalHours.night) : '00:00'}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <p className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Instrumentos</p>
            <p className="text-2xl font-bold font-mono gradient-text">
              {stats ? flightUtils.formatHours(stats.totalHours.instrument) : '00:00'}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <p className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Entre(cidades)</p>
            <p className="text-2xl font-bold font-mono gradient-text">
              {stats ? flightUtils.formatHours(stats.totalHours.crossCountry) : '00:00'}
            </p>
          </div>
        </div>
      </div>

      {/* Medical Certificate Alert */}
      <div className={`card ${isDark ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'}`}>
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-xl bg-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-400">Certificado Médico</h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Lembre-se de manter seu certificado médico válido. Valide suas horas de voo conforme as exigências da ANAC.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Flights */}
      <div className="animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            Voos Recentes
          </h2>
          <Link to="/flights" className="text-blue-400 hover:text-aviation-300 text-sm font-medium transition-colors">
            Ver todos →
          </Link>
        </div>
        <div className="space-y-4">
          {stats?.recentFlights.map(flight => (
            <FlightCard key={flight.id} flight={flight} />
          ))}
        </div>
      </div>
    </div>
  );
}
