import { useState } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import type { FlightRecord, FlightType, CreateFlightDTO } from '../types';
import { flightUtils } from '../api/flights';

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
        date: initialData.date,
        departureTime: initialData.departureTime,
        arrivalTime: initialData.arrivalTime,
        aircraftType: initialData.aircraftType,
        registration: initialData.registration,
        departureAirport: initialData.departureAirport,
        arrivalAirport: initialData.arrivalAirport,
        flightTypes: initialData.flightTypes,
        flightTime: initialData.flightTime,
        pilotInCommand: initialData.pilotInCommand,
        copilot: initialData.copilot,
        instructor: initialData.instructor,
        landings: initialData.landings,
        remarks: initialData.remarks,
        status: initialData.status,
      };
    }
    return {
      userId: 'default',
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <input
              type="text"
              value={formData.aircraftType}
              onChange={e => setFormData(prev => ({ ...prev, aircraftType: e.target.value }))}
              placeholder="Ex: Cessna 172, Piper PA-28"
              className="w-full"
            />
            {errors.aircraftType && <p className="text-red-400 text-sm mt-1">{errors.aircraftType}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Matrícula (PT-XXX) *</label>
            <input
              type="text"
              value={formData.registration}
              onChange={e => setFormData(prev => ({ ...prev, registration: e.target.value.toUpperCase() }))}
              placeholder="Ex: PT-ABC"
              className="w-full"
              maxLength={6}
            />
            {errors.registration && <p className="text-red-400 text-sm mt-1">{errors.registration}</p>}
          </div>
        </div>
      </div>

      {/* Aerodromes Section */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-aviation-accent">🛬 Aeródromos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Origem (ICAO) *</label>
            <input
              type="text"
              value={formData.departureAirport}
              onChange={e => setFormData(prev => ({ ...prev, departureAirport: e.target.value.toUpperCase() }))}
              placeholder="Ex: SBGR"
              className="w-full"
              maxLength={4}
            />
            {errors.departureAirport && <p className="text-red-400 text-sm mt-1">{errors.departureAirport}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Destino (ICAO) *</label>
            <input
              type="text"
              value={formData.arrivalAirport}
              onChange={e => setFormData(prev => ({ ...prev, arrivalAirport: e.target.value.toUpperCase() }))}
              placeholder="Ex: SBGL"
              className="w-full"
              maxLength={4}
            />
            {errors.arrivalAirport && <p className="text-red-400 text-sm mt-1">{errors.arrivalAirport}</p>}
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

      {/* Crew Section */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-aviation-accent">👨‍✈️ Tripulação</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Piloto em Comando (PIC)</label>
            <input
              type="text"
              value={formData.pilotInCommand}
              onChange={e => setFormData(prev => ({ ...prev, pilotInCommand: e.target.value }))}
              placeholder="Nome do PIC"
              className="w-full"
            />
          </div>
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
            <label className="block text-sm font-medium mb-2">Instrutor</label>
            <input
              type="text"
              value={formData.instructor}
              onChange={e => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
              placeholder="Nome do Instrutor"
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
