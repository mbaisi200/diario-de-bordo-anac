import { Link } from 'react-router-dom';
import { Plane, Clock, MapPin, Calendar } from 'lucide-react';
import type { FlightRecord } from '../types';
import { flightUtils } from '../api/flights';
import { useTheme } from '../contexts/ThemeContext';

interface FlightCardProps {
  flight: FlightRecord;
}

const flightTypeLabels: Record<string, string> = {
  dual: 'Dual',
  solo: 'Solo',
  pic: 'PIC',
  sic: 'SIC',
  cross_country: 'X-Country',
  instruction: 'Instrução',
  check: 'Check',
  ipc: 'IPC',
  bfr: 'BFR',
  ferry: 'Ferry',
  other: 'Outro',
};

export default function FlightCard({ flight }: FlightCardProps) {
  const totalFlightTime = flightUtils.calculateTotalFlightTime(flight.flightTime);
  const totalLandings = flightUtils.calculateTotalLandings(flight.landings);
  const { isDark } = useTheme();

  return (
    <Link
      to={`/flights/${flight.id}`}
      className="card hover-lift cursor-pointer block group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="relative p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
              <Plane className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg gradient-text">{flight.registration}</h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{flight.aircraftType}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{flightUtils.formatDate(flight.date)}</span>
          </div>
        </div>
      </div>

      {/* Route */}
      <div className={`flex items-center justify-center gap-4 mb-4 py-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
        <div className="text-center">
          <p className="text-2xl font-bold font-mono gradient-text">{flight.departureAirport}</p>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Origem</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className={`h-0.5 flex-1 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
          <Plane className={`w-5 h-5 mx-3 rotate-90 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <div className={`h-0.5 flex-1 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold font-mono gradient-text">{flight.arrivalAirport}</p>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Destino</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className={`flex items-center justify-center gap-1 mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Clock className="w-4 h-4" />
            <span className="text-xs">Tempo</span>
          </div>
          <p className="text-xl font-bold font-mono gradient-text">{flightUtils.formatHours(totalFlightTime)}</p>
        </div>
        <div>
          <div className={`flex items-center justify-center gap-1 mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <MapPin className="w-4 h-4" />
            <span className="text-xs">Pousos</span>
          </div>
          <p className="text-xl font-bold font-mono gradient-text">{totalLandings}</p>
        </div>
        <div>
          <div className={`flex items-center justify-center gap-1 mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="text-xs">Tipo</span>
          </div>
          <div className="flex flex-wrap justify-center gap-1">
            {flight.flightTypes.slice(0, 2).map(type => (
              <span
                key={type}
                className="badge"
              >
                {flightTypeLabels[type] || type}
              </span>
            ))}
            {flight.flightTypes.length > 2 && (
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                +{flight.flightTypes.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Time Details */}
      <div className={`mt-4 pt-4 border-t flex justify-between text-sm ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
        <span>
          {flightUtils.formatTime(flight.departureTime)} → {flightUtils.formatTime(flight.arrivalTime)}
        </span>
        <span>
          Dia: {flightUtils.formatHours(flight.flightTime.day)} | 
          Noite: {flightUtils.formatHours(flight.flightTime.night)}
        </span>
      </div>
    </Link>
  );
}
