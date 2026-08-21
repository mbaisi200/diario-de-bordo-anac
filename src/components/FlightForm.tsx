import { useState } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import type { FlightRecord, FlightType, CreateFlightDTO } from '../types';
import { flightUtils } from '../api/flights';
import SearchableInput from './SearchableInput';
import { searchAirports, searchAircraftTypes, searchRegistrations } from '../api/reference';

interface FlightFormProps {
  initialData?: FlightRecord;
  onSubmit: (data: CreateFlightDTO) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const flightTypeOptions: { value: FlightType; label: string }[] = [
  { value: 'dual', label: 'Duplo Comando (Dual)' },
  { value: 'solo', label: 'Solo' },
  { value: 'pic', label: 'Comando (PIC)' },
  { value: 'sic', label: 'Segundo em Comando (SIC)' },
  { value: 'cross_country', label: 'Entre(cidades)' },
  { value: 'instruction', label: 'Instrução em Voo' },
  { value: 'check', label: 'Checagem' },
  { value: 'ipc', label: 'Instrument Proficiency Check' },
  { value: 'bfr', label: 'Biennial Flight Review' },
  { value: 'ferry', label: 'Ferry Flight' },
  { value: 'other', label: 'Outro' },
];

export default function FlightForm({ initialData, onSubmit, onCancel, isLoading }: FlightFormProps) {
  const [formData, setFormData] = useState<CreateFlightDTO>(() => {
    if (initialData) {
      return {
        userId: initialData.userId,
        tenantId: initialData.tenantId,
        flightNumber: initialData.flightNumber,
        flightRules: initialData.flightRules || 'VFR',
        date: initialData.date,
        departureTime: initialData.departureTime,
        arrivalTime: initialData.arrivalTime,
        aircraftType: initialData.aircraftType,
        registration: initialData.registration,
        departureAirport: initialData.departureAirport,
        arrivalAirport: initialData.arrivalAirport,
        alternatedAirport: initialData.alternatedAirport,
        flightTypes: initialData.flightTypes,
        flightTime: initialData.flightTime,
        totalDistance: initialData.totalDistance,
        fuelType: initialData.fuelType,
        fuelQuantityDeparture: initialData.fuelQuantityDeparture,
        fuelQuantityArrival: initialData.fuelQuantityArrival,
        passengersCount: initialData.passengersCount,
        pilotInCommand: initialData.pilotInCommand,
        pilotInCommandLicense: initialData.pilotInCommandLicense,
        copilot: initialData.copilot,
        copilotLicense: initialData.copilotLicense,
        instructor: initialData.instructor,
        landings: initialData.landings,
        metarDeparture: initialData.metarDeparture,
        metarArrival: initialData.metarArrival,
        notams: initialData.notams,
        obstacles: initialData.obstacles,
        remarks: initialData.remarks,
        status: initialData.status,
      };
    }
    return {
      userId: 'default',
      flightRules: 'VFR',
      date: new Date().toISOString().split('T')[0],
      departureTime: '',
      arrivalTime: '',
      aircraftType: '',
      registration: '',
      departureAirport: '',
      arrivalAirport: '',
      flightTypes: [],
      flightTime: { day: 0, night: 0, instrument: 0, crossCountry: 0 },
      pilotInCommand: '',
      copilot: '',
      instructor: '',
      landings: { day: 0, night: 0 },
      passengersCount: 0,
      remarks: '',
      status: 'completed' as const,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = 'Data é obrigatória';
    if (!formData.departureTime) newErrors.departureTime = 'Hora de decolagem é obrigatória';
    if (!formData.arrivalTime) newErrors.arrivalTime = 'Hora de pouso é obrigatória';
    if (!formData.aircraftType) newErrors.aircraftType = 'Tipo de aeronave é obrigatório';
    if (!formData.registration) newErrors.registration = 'Matrícula é obrigatória';
    else if (!flightUtils.validateRegistration(formData.registration)) {
      newErrors.registration = 'Formato inválido (ex: PT-ABC)';
    }
    if (!formData.departureAirport) newErrors.departureAirport = 'Aeródromo de origem é obrigatório';
    else if (!flightUtils.validateICAO(formData.departureAirport)) {
      newErrors.departureAirport = 'Código ICAO inválido (ex: SBGR)';
    }
    if (!formData.arrivalAirport) newErrors.arrivalAirport = 'Aeródromo de destino é obrigatório';
    else if (!flightUtils.validateICAO(formData.arrivalAirport)) {
      newErrors.arrivalAirport = 'Código ICAO inválido (ex: SBGL)';
    }
    if (formData.flightTypes.length === 0) {
      newErrors.flightTypes = 'Selecione pelo menos um tipo de voo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const toggleFlightType = (type: FlightType) => {
    setFormData(prev => ({
      ...prev,
      flightTypes: prev.flightTypes.includes(type)
        ? prev.flightTypes.filter(t => t !== type)
        : [...prev.flightTypes, type],
    }));
  };

  const updateFlightTime = (field: keyof FlightRecord['flightTime'], value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      flightTime: { ...prev.flightTime, [field]: numValue },
    }));
  };

  const updateLandings = (field: keyof FlightRecord['landings'], value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      landings: { ...prev.landings, [field]: numValue },
    }));
  };

  const totalFlightTime = formData.flightTime.day + formData.flightTime.night;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {initialData ? 'Editar Voo' : 'Registrar Novo Voo'}
        </h2>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary">
            <X className="w-5 h-5 inline mr-2" />
            Cancelar
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary">
            <Save className="w-5 h-5 inline mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar Voo'}
          </button>
        </div>
      </div>

      {/* Date and Time Section */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-aviation-accent">📅 Data e Horário</h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium mb-2">Data do Voo *</label>
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full"
            />
            {errors.date && <p className="text-red-400 text-sm mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Decolagem (UTC) *</label>
            <input
              type="time"
              value={formData.departureTime}
              onChange={e => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
              className="w-full"
            />
            {errors.departureTime && <p className="text-red-400 text-sm mt-1">{errors.departureTime}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Pouso (UTC) *</label>
            <input
              type="time"
              value={formData.arrivalTime}
              onChange={e => setFormData(prev => ({ ...prev, arrivalTime: e.target.value }))}
              className="w-full"
            />
            {errors.arrivalTime && <p className="text-red-400 text-sm mt-1">{errors.arrivalTime}</p>}
          </div>
        </div>
      </div>

      {/* Aircraft Section */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-aviation-accent">✈️ Aeronave</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Aeronave *</label>
            <SearchableInput
              value={formData.aircraftType}
              onChange={value => setFormData(prev => ({ ...prev, aircraftType: value }))}
              searchFn={searchAircraftTypes}
              getLabel={option => option.model}
              getSubLabel={option => [option.manufacturer, option.icao].filter(Boolean).join(' · ')}
              placeholder="Busque por modelo, fabricante ou código ICAO"
            />
            {errors.aircraftType && <p className="text-red-400 text-sm mt-1">{errors.aircraftType}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Matrícula (PT-XXX) *</label>
            <SearchableInput
              value={formData.registration}
              onChange={value => setFormData(prev => ({ ...prev, registration: value.toUpperCase() }))}
              searchFn={searchRegistrations}
              getLabel={option => option.registration}
              getSubLabel={option => [option.aircraftType, option.manufacturer].filter(Boolean).join(' · ')}
              placeholder="Busque por matrícula (ex: PT-ABC)"
              minQuery={2}
            />
            {errors.registration && <p className="text-red-400 text-sm mt-1">{errors.registration}</p>}
          </div>
        </div>
      </div>

      {/* Flight Rules + Number (ANAC) */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-aviation-accent">📋 Regras de Voo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Regras de Voo *</label>
            <select
              value={formData.flightRules}
              onChange={e => setFormData(prev => ({ ...prev, flightRules: e.target.value as any }))}
              className="w-full"
            >
              <option value="VFR">VFR - Regras de Voo por Visualização</option>
              <option value="IFR">IFR - Regras de Voo por Instrumentos</option>
              <option value="YVFR">YVFR - VFR com pedido IFR</option>
              <option value="ZIFR">ZIFR - IFR sem pedido</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nº do Voo</label>
            <input
              type="text"
              value={formData.flightNumber || ''}
              onChange={e => setFormData(prev => ({ ...prev, flightNumber: e.target.value }))}
              placeholder="Ex: NCT2468"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Aerodromes Section */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-aviation-accent">🛬 Aeródromos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Origem (ICAO) *</label>
            <SearchableInput
              value={formData.departureAirport}
              onChange={value => setFormData(prev => ({ ...prev, departureAirport: value.toUpperCase() }))}
              searchFn={searchAirports}
              getLabel={option => option.icao}
              getSubLabel={option => [option.name, option.city].filter(Boolean).join(' · ')}
              placeholder="Busque por ICAO, nome ou cidade"
              minQuery={1}
            />
            {errors.departureAirport && <p className="text-red-400 text-sm mt-1">{errors.departureAirport}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Destino (ICAO) *</label>
            <SearchableInput
              value={formData.arrivalAirport}
              onChange={value => setFormData(prev => ({ ...prev, arrivalAirport: value.toUpperCase() }))}
              searchFn={searchAirports}
              getLabel={option => option.icao}
              getSubLabel={option => [option.name, option.city].filter(Boolean).join(' · ')}
              placeholder="Busque por ICAO, nome ou cidade"
              minQuery={1}
            />
            {errors.arrivalAirport && <p className="text-red-400 text-sm mt-1">{errors.arrivalAirport}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">Aeródromo Alternado (ICAO)</label>
            <SearchableInput
              value={formData.alternatedAirport || ''}
              onChange={value => setFormData(prev => ({ ...prev, alternatedAirport: value.toUpperCase() }))}
              searchFn={searchAirports}
              getLabel={option => option.icao}
              getSubLabel={option => [option.name, option.city].filter(Boolean).join(' · ')}
              placeholder="ICAO alternado (se aplicável)"
              minQuery={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Distância Total (NM)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={formData.totalDistance || ''}
              onChange={e => setFormData(prev => ({ ...prev, totalDistance: parseFloat(e.target.value) || undefined }))}
              placeholder="Nautical Miles"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Flight Type Section */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-aviation-accent">🎯 Tipo de Voo *</h3>
        <div className="flex flex-wrap gap-2">
          {flightTypeOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleFlightType(option.value)}
              className={`px-4 py-2.5 rounded-xl border-2 transition-all duration-200 font-medium text-sm ${
                formData.flightTypes.includes(option.value)
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.flightTypes && <p className="text-red-400 text-sm mt-2">{errors.flightTypes}</p>}
      </div>

      {/* Flight Time Section */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-aviation-accent">⏱️ Tempo de Voo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Dia (horas)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.flightTime.day || ''}
              onChange={e => updateFlightTime('day', e.target.value)}
              placeholder="0.0"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Noite (horas)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.flightTime.night || ''}
              onChange={e => updateFlightTime('night', e.target.value)}
              placeholder="0.0"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Instrumentos (horas)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.flightTime.instrument || ''}
              onChange={e => updateFlightTime('instrument', e.target.value)}
              placeholder="0.0"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Entre(cidades) (horas)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.flightTime.crossCountry || ''}
              onChange={e => updateFlightTime('crossCountry', e.target.value)}
              placeholder="0.0"
              className="w-full"
            />
          </div>
        </div>
        
        {/* Total Display */}
        <div className="mt-4 p-3 bg-slate-100 rounded-xl flex items-center justify-between">
          <span className="text-slate-500">Tempo Total:</span>
          <span className="text-2xl font-bold text-blue-600 font-mono">
            {flightUtils.formatHours(totalFlightTime)}
          </span>
        </div>
      </div>

      {/* Landings Section */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-aviation-accent">🛬 Pousos</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pousos Dia</label>
            <input
              type="number"
              min="0"
              value={formData.landings.day || ''}
              onChange={e => updateLandings('day', e.target.value)}
              placeholder="0"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Pousos Noite</label>
            <input
              type="number"
              min="0"
              value={formData.landings.night || ''}
              onChange={e => updateLandings('night', e.target.value)}
              placeholder="0"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Fuel and Distance (ANAC) */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-aviation-accent">⛽ Combustível e Passageiros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Combustível</label>
            <select
              value={formData.fuelType || ''}
              onChange={e => setFormData(prev => ({ ...prev, fuelType: e.target.value || undefined }))}
              className="w-full"
            >
              <option value="">Selecione...</option>
              <option value="100LL">100LL (Avgas)</option>
              <option value="Jet-A1">Jet-A1</option>
              <option value="Jet-A">Jet-A</option>
              <option value="Diesel">Diesel (Jet)</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Qtd. Comb. Decolagem (L/kg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.fuelQuantityDeparture || ''}
              onChange={e => setFormData(prev => ({ ...prev, fuelQuantityDeparture: parseFloat(e.target.value) || undefined }))}
              placeholder="Quantidade"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Qtd. Comb. Pouso (L/kg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.fuelQuantityArrival || ''}
              onChange={e => setFormData(prev => ({ ...prev, fuelQuantityArrival: parseFloat(e.target.value) || undefined }))}
              placeholder="Quantidade"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nº de Passageiros</label>
            <input
              type="number"
              min="0"
              value={formData.passengersCount || ''}
              onChange={e => setFormData(prev => ({ ...prev, passengersCount: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Crew Section (ANAC) */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-aviation-accent">👨‍✈️ Tripulação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Piloto em Comando (PIC) *</label>
              <input
                type="text"
                value={formData.pilotInCommand}
                onChange={e => setFormData(prev => ({ ...prev, pilotInCommand: e.target.value }))}
                placeholder="Nome do PIC"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Licença ANAC - PIC</label>
              <input
                type="text"
                value={formData.pilotInCommandLicense || ''}
                onChange={e => setFormData(prev => ({ ...prev, pilotInCommandLicense: e.target.value }))}
                placeholder="Nº licença"
                className="w-full"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Segundo em Comando (SIC)</label>
              <input
                type="text"
                value={formData.copilot}
                onChange={e => setFormData(prev => ({ ...prev, copilot: e.target.value }))}
                placeholder="Nome do SIC"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Licença ANAC - SIC</label>
              <input
                type="text"
                value={formData.copilotLicense || ''}
                onChange={e => setFormData(prev => ({ ...prev, copilotLicense: e.target.value }))}
                placeholder="Nº licença"
                className="w-full"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Instrutor</label>
            <input
              type="text"
              value={formData.instructor}
              onChange={e => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
              placeholder="Nome do Instrutor (se aplicável)"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* METAR / NOTAMs (ANAC) */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-aviation-accent">🌦️ Condições e NOTAMs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-2">METAR Origem</label>
            <input
              type="text"
              value={formData.metarDeparture || ''}
              onChange={e => setFormData(prev => ({ ...prev, metarDeparture: e.target.value }))}
              placeholder="Ex: SBGR 151400Z 18008KT 9999 FEW040 28/18 Q1015"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">METAR Destino</label>
            <input
              type="text"
              value={formData.metarArrival || ''}
              onChange={e => setFormData(prev => ({ ...prev, metarArrival: e.target.value }))}
              placeholder="Ex: SBGL 151400Z 20010KT 9999 SCT030 30/20 Q1013"
              className="w-full"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">NOTAMs Relevantes</label>
            <textarea
              value={formData.notams || ''}
              onChange={e => setFormData(prev => ({ ...prev, notams: e.target.value }))}
              placeholder="NOTAMs que afetam este voo (se houver)"
              rows={2}
              className="w-full resize-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Obstáculos Notáveis</label>
            <input
              type="text"
              value={formData.obstacles || ''}
              onChange={e => setFormData(prev => ({ ...prev, obstacles: e.target.value }))}
              placeholder="Obstáculos notáveis na rota (se houver)"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Remarks Section */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-aviation-accent">📝 Observações</h3>
        <textarea
          value={formData.remarks}
          onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
          placeholder="Adicione observações sobre o voo, condições meteorológicas, etc."
          rows={4}
          className="w-full resize-none"
        />
      </div>

      {/* Validation Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="card bg-red-900/30 border-red-500">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Por favor, corrija os erros antes de salvar</span>
          </div>
        </div>
      )}
    </form>
  );
}
