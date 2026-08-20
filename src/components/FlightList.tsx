import { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import type { FlightRecord } from '../types';
import FlightCard from './FlightCard';

interface FlightListProps {
  flights: FlightRecord[];
  isLoading?: boolean;
}

type SortField = 'date' | 'registration' | 'flightTime';
type SortDirection = 'asc' | 'desc';

export default function FlightList({ flights, isLoading }: FlightListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredAndSortedFlights = useMemo(() => {
    let result = [...flights];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        flight =>
          flight.registration.toLowerCase().includes(term) ||
          flight.aircraftType.toLowerCase().includes(term) ||
          flight.departureAirport.toLowerCase().includes(term) ||
          flight.arrivalAirport.toLowerCase().includes(term)
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(flight => flight.flightTypes.includes(filterType as any));
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'registration':
          comparison = a.registration.localeCompare(b.registration);
          break;
        case 'flightTime':
          comparison =
            (a.flightTime.day + a.flightTime.night) -
            (b.flightTime.day + b.flightTime.night);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [flights, searchTerm, sortField, sortDirection, filterType]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="h-6 bg-aviation-light rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-aviation-light rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-aviation-light rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por matrícula, aeronave ou aeródromo..."
              className="w-full pl-10"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="pl-10 pr-4"
            >
              <option value="all">Todos os tipos</option>
              <option value="dual">Duplo Comando</option>
              <option value="solo">Solo</option>
              <option value="pic">PIC</option>
              <option value="sic">SIC</option>
              <option value="cross_country">Entre(cidades)</option>
              <option value="instruction">Instrução</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <select
              value={sortField}
              onChange={e => setSortField(e.target.value as SortField)}
              className="min-w-[120px]"
            >
              <option value="date">Data</option>
              <option value="registration">Matrícula</option>
              <option value="flightTime">Tempo</option>
            </select>
            <button
              onClick={() => setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))}
              className="p-3 bg-aviation-dark rounded-lg hover:bg-aviation-light transition-colors"
            >
              {sortDirection === 'asc' ? (
                <SortAsc className="w-5 h-5" />
              ) : (
                <SortDesc className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        {filteredAndSortedFlights.length} voo(s) encontrado(s)
      </div>

      {/* Flight Cards */}
      {filteredAndSortedFlights.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg">
            {flights.length === 0
              ? 'Nenhum voo registrado ainda'
              : 'Nenhum voo encontrado com os filtros aplicados'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedFlights.map(flight => (
            <FlightCard key={flight.id} flight={flight} />
          ))}
        </div>
      )}
    </div>
  );
}
