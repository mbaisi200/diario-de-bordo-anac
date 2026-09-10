import { useState } from 'react';
import { Save, X, AlertCircle, Plus, Trash2, Plane, Clock, MapPin, Users, FileText, Wrench } from 'lucide-react';
import type { FlightRecord, FlightType, FlightNature, CrewFunction, CrewMember, CreateFlightDTO } from '../types';
import { CREW_FUNCTION_LABELS } from '../types';
import { flightUtils } from '../api/flights';
import SearchableInput from './SearchableInput';
import { searchAirports, searchAircraftTypes, searchRegistrations, type RegistrationOption } from '../api/reference';
import { useTheme } from '../contexts/ThemeContext';

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

const flightNatureOptions: { value: FlightNature; label: string; desc: string }[] = [
  { value: 'PV', label: 'PV', desc: 'Privado' },
  { value: 'FR', label: 'FR', desc: 'Fretamento' },
  { value: 'TN', label: 'TN', desc: 'Treinamento' },
  { value: 'TR', label: 'TR', desc: 'Traslado' },
  { value: 'CQ', label: 'CQ', desc: 'Exame Prático' },
  { value: 'LR', label: 'LR', desc: 'Linha Regular' },
  { value: 'SA', label: 'SA', desc: 'Serviço Aéreo Esp.' },
  { value: 'EX', label: 'EX', desc: 'Experiência' },
  { value: 'AE', label: 'AE', desc: 'Aut. Especial' },
  { value: 'LX', label: 'LX', desc: 'Linha Não Regular' },
  { value: 'LS', label: 'LS', desc: 'Linha Suplementar' },
  { value: 'IN', label: 'IN', desc: 'Instrução INSPAC' },
];

export default function FlightForm({ initialData, onSubmit, onCancel, isLoading }: FlightFormProps) {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState<CreateFlightDTO>(() => {
    if (initialData) {
      return {
        userId: initialData.userId,
        tenantId: initialData.tenantId,
        volumeId: initialData.volumeId,
        sequentialNumber: initialData.sequentialNumber,
        flightNumber: initialData.flightNumber,
        flightRules: initialData.flightRules || 'VFR',
        flightNature: initialData.flightNature,
        date: initialData.date,
        partidaTime: initialData.partidaTime || '',
        departureTime: initialData.departureTime,
        arrivalTime: initialData.arrivalTime,
        corteTime: initialData.corteTime || '',
        aircraftType: initialData.aircraftType,
        registration: initialData.registration,
        aircraftSerialNumber: initialData.aircraftSerialNumber,
        registrationCategory: initialData.registrationCategory,
        departureAirport: initialData.departureAirport,
        arrivalAirport: initialData.arrivalAirport,
        alternatedAirport: initialData.alternatedAirport,
        flightTypes: initialData.flightTypes,
        flightTime: initialData.flightTime,
        cycles: initialData.cycles,
        totalDistance: initialData.totalDistance,
        fuelType: initialData.fuelType,
        fuelQuantityDeparture: initialData.fuelQuantityDeparture,
        fuelQuantityArrival: initialData.fuelQuantityArrival,
        fuelTotal: initialData.fuelTotal,
        passengersCount: initialData.passengersCount,
        cargoWeight: initialData.cargoWeight,
        flightNatureCode: initialData.flightNatureCode,
        crew: initialData.crew || [],
        pilotInCommand: initialData.pilotInCommand,
        pilotInCommandLicense: initialData.pilotInCommandLicense,
        pilotInCommandFunction: initialData.pilotInCommandFunction,
        copilot: initialData.copilot,
        copilotLicense: initialData.copilotLicense,
        instructor: initialData.instructor,
        picSignature: initialData.picSignature,
        landings: initialData.landings,
        metarDeparture: initialData.metarDeparture,
        metarArrival: initialData.metarArrival,
        notams: initialData.notams,
        obstacles: initialData.obstacles,
        remarks: initialData.remarks,
        cumulativeHours: initialData.cumulativeHours,
        vorInspection: initialData.vorInspection,
        databaseUpdate: initialData.databaseUpdate,
        maintenanceRecord: initialData.maintenanceRecord,
        status: initialData.status,
        mechanicReleaseCode: initialData.mechanicReleaseCode,
        mechanicReleaseSignature: initialData.mechanicReleaseSignature,
      };
    }
    return {
      userId: 'default',
      flightRules: 'VFR',
      flightNature: 'PV' as FlightNature,
      date: new Date().toISOString().split('T')[0],
      partidaTime: '',
      departureTime: '',
      arrivalTime: '',
      corteTime: '',
      aircraftType: '',
      registration: '',
      departureAirport: '',
      arrivalAirport: '',
      flightTypes: [],
      flightTime: { day: 0, night: 0, instrument: 0, crossCountry: 0, div: 0, not: 0, vfr: 0 },
      cycles: { partial: 0, total: 0, pousoPartial: 0, pousoTotal: 0, ng1: 0, ntl1: 0, ng1Total: 0, ntl1Total: 0 },
      pilotInCommand: '',
      copilot: '',
      instructor: '',
      crew: [],
      landings: { day: 0, night: 0 },
      passengersCount: 0,
      remarks: '',
      cumulativeHours: { horasCelula: 0, horasMotor: 0, cicloNg: 0, cicloNtl: 0, pousoCelula: 0 },
      vorInspection: { maxAllowedDifference: 4 },
      databaseUpdate: { updated: false },
      maintenanceRecord: {},
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

  const handleRegistrationSelect = (option: RegistrationOption) => {
    setFormData(prev => ({
      ...prev,
      registration: option.registration,
      aircraftType: option.model || option.aircraftType || prev.aircraftType,
      aircraftSerialNumber: option.serialNumber || prev.aircraftSerialNumber,
      registrationCategory: option.category || prev.registrationCategory,
    }));
  };

  const updateFlightTime = (field: keyof NonNullable<FlightRecord['flightTime']>, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      flightTime: { ...prev.flightTime, [field]: numValue },
    }));
  };

  const updateCycles = (field: keyof NonNullable<FlightRecord['cycles']>, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      cycles: { ...prev.cycles!, [field]: numValue },
    }));
  };

  const updateLandings = (field: keyof FlightRecord['landings'], value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      landings: { ...prev.landings, [field]: numValue },
    }));
  };

  const updateCumulativeHours = (field: keyof NonNullable<FlightRecord['cumulativeHours']>, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      cumulativeHours: { ...prev.cumulativeHours!, [field]: numValue },
    }));
  };

  const updateVorInspection = (field: keyof NonNullable<FlightRecord['vorInspection']>, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      vorInspection: { ...prev.vorInspection!, [field]: value },
    }));
  };

  const updateMaintenanceRecord = (field: keyof NonNullable<FlightRecord['maintenanceRecord']>, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      maintenanceRecord: { ...prev.maintenanceRecord!, [field]: value },
    }));
  };

  const addCrewMember = () => {
    setFormData(prev => ({
      ...prev,
      crew: [...(prev.crew || []), { name: '', role: 'PIC' as CrewFunction, anacCode: '', licenseNumber: '' }],
    }));
  };

  const updateCrewMember = (index: number, field: keyof CrewMember, value: string) => {
    setFormData(prev => ({
      ...prev,
      crew: (prev.crew || []).map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));
  };

  const removeCrewMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      crew: (prev.crew || []).filter((_, i) => i !== index),
    }));
  };

  const totalFlightTime = (formData.flightTime.day || 0) + (formData.flightTime.night || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ═══════════════════════════════════════════════════════════════════════════════
          CABEÇALHO - Diário de Bordo Nº / Aeronave
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-aviation-accent" />
          <h3 className="text-lg font-semibold text-aviation-accent">CABEÇALHO - Diário de Bordo</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium mb-2">Diário de Bordo Nº</label>
            <input
              type="text"
              value={formData.volumeNumber || ''}
              onChange={e => setFormData(prev => ({ ...prev, volumeNumber: e.target.value }))}
              placeholder="Ex: 09/PR-JMN/2025"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Marcas (Matrícula) *</label>
            <SearchableInput
              value={formData.registration}
              onChange={value => setFormData(prev => ({ ...prev, registration: value.toUpperCase() }))}
              onSelect={handleRegistrationSelect}
              searchFn={searchRegistrations}
              getLabel={option => option.registration}
              getSubLabel={option => [option.aircraftType, option.manufacturer].filter(Boolean).join(' · ')}
              placeholder="Ex: PR-JMN"
              minQuery={2}
            />
            {errors.registration && <p className="text-red-400 text-sm mt-1">{errors.registration}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Modelo</label>
            <SearchableInput
              value={formData.aircraftType}
              onChange={value => setFormData(prev => ({ ...prev, aircraftType: value }))}
              searchFn={searchAircraftTypes}
              getLabel={option => option.model}
              getSubLabel={option => [option.manufacturer, option.icao].filter(Boolean).join(' · ')}
              placeholder="Busque por modelo"
            />
            {errors.aircraftType && <p className="text-red-400 text-sm mt-1">{errors.aircraftType}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nº de Série</label>
            <input
              type="text"
              value={formData.aircraftSerialNumber || ''}
              onChange={e => setFormData(prev => ({ ...prev, aircraftSerialNumber: e.target.value }))}
              placeholder="Número de série"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Fabricante</label>
            <input
              type="text"
              value={formData.registrationCategory || ''}
              onChange={e => setFormData(prev => ({ ...prev, registrationCategory: e.target.value }))}
              placeholder="Ex: EUROCOPTER"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cat. Reg.</label>
            <select
              value={formData.registrationCategory || ''}
              onChange={e => setFormData(prev => ({ ...prev, registrationCategory: e.target.value }))}
              className="w-full"
            >
              <option value="">Selecione...</option>
              <option value="TPP">TPP</option>
              <option value="Standart">Standart</option>
              <option value="Experimental">Experimental</option>
              <option value="Restrita">Restrita</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nº Sequencial (Etapa)</label>
            <input
              type="number"
              min="1"
              value={formData.sequentialNumber || ''}
              onChange={e => setFormData(prev => ({ ...prev, sequentialNumber: parseInt(e.target.value) || undefined }))}
              placeholder="1, 2, 3..."
              className="w-full"
            />
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

      {/* ═══════════════════════════════════════════════════════════════════════════════
          TRIPULAÇÃO
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-aviation-accent" />
          <h3 className="text-lg font-semibold text-aviation-accent">TRIPULAÇÃO</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            <label className="block text-sm font-medium mb-2">Código ANAC - PIC</label>
            <input
              type="text"
              value={formData.pilotInCommandLicense || ''}
              onChange={e => setFormData(prev => ({ ...prev, pilotInCommandLicense: e.target.value }))}
              placeholder="Ex: 71432"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Função PIC</label>
            <select
              value={formData.pilotInCommandFunction || ''}
              onChange={e => setFormData(prev => ({ ...prev, pilotInCommandFunction: e.target.value }))}
              className="w-full"
            >
              <option value="">Selecione...</option>
              <option value="PIC">Piloto em Comando</option>
              <option value="SIC">Segundo em Comando</option>
              <option value="FI">Instrutor de Voo</option>
            </select>
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
            <label className="block text-sm font-medium mb-2">Código ANAC - SIC</label>
            <input
              type="text"
              value={formData.copilotLicense || ''}
              onChange={e => setFormData(prev => ({ ...prev, copilotLicense: e.target.value }))}
              placeholder="Ex: 71432"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Instrutor</label>
            <input
              type="text"
              value={formData.instructor}
              onChange={e => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
              placeholder="Nome do Instrutor (se aplicável)"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Base Contratual</label>
            <input
              type="text"
              value={formData.departureAirport}
              onChange={e => setFormData(prev => ({ ...prev, departureAirport: e.target.value.toUpperCase() }))}
              placeholder="Ex: SBMT"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Data (dd/mm/aa)</label>
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full"
            />
            {errors.date && <p className="text-red-400 text-sm mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Hora (Z) *</label>
            <input
              type="time"
              value={formData.departureTime}
              onChange={e => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
              className="w-full"
            />
            {errors.departureTime && <p className="text-red-400 text-sm mt-1">{errors.departureTime}</p>}
          </div>
        </div>

        {/* Detalhes da Tripulação (Portaria 14.096/SPO/2024) */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500">Tripulantes detalhados (Portaria 14.096/SPO/2024)</p>
            <button type="button" onClick={addCrewMember} className="btn-secondary text-sm">
              <Plus className="w-4 h-4 inline mr-1" />
              Adicionar Tripulante
            </button>
          </div>
          {formData.crew && formData.crew.length > 0 && (
            <div className="space-y-2">
              {formData.crew.map((member, index) => (
                <div key={index} className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Nome *</label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={e => updateCrewMember(index, 'name', e.target.value)}
                        placeholder="Nome completo"
                        className="w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Função *</label>
                      <select
                        value={member.role}
                        onChange={e => updateCrewMember(index, 'role', e.target.value)}
                        className="w-full text-sm"
                      >
                        {Object.entries(CREW_FUNCTION_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Código ANAC</label>
                      <input
                        type="text"
                        value={member.anacCode || ''}
                        onChange={e => updateCrewMember(index, 'anacCode', e.target.value)}
                        placeholder="Ex: 4530"
                        className="w-full text-sm"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1">Licença</label>
                        <input
                          type="text"
                          value={member.licenseNumber || ''}
                          onChange={e => updateCrewMember(index, 'licenseNumber', e.target.value)}
                          placeholder="Nº licença"
                          className="w-full text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCrewMember(index)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          TRECHO / HORAS / TEMPO DE VOO / CICLOS / COMBUSTÍVEL
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Plane className="w-5 h-5 text-aviation-accent" />
          <h3 className="text-lg font-semibold text-aviation-accent">TRECHO / HORAS / VOO</h3>
        </div>

        {/* Aeródromos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">De (Origem) *</label>
            <SearchableInput
              value={formData.departureAirport}
              onChange={value => setFormData(prev => ({ ...prev, departureAirport: value.toUpperCase() }))}
              searchFn={searchAirports}
              getLabel={option => option.icao}
              getSubLabel={option => [option.name, option.city].filter(Boolean).join(' · ')}
              placeholder="ICAO origem"
              minQuery={1}
            />
            {errors.departureAirport && <p className="text-red-400 text-sm mt-1">{errors.departureAirport}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Para (Destino) *</label>
            <SearchableInput
              value={formData.arrivalAirport}
              onChange={value => setFormData(prev => ({ ...prev, arrivalAirport: value.toUpperCase() }))}
              searchFn={searchAirports}
              getLabel={option => option.icao}
              getSubLabel={option => [option.name, option.city].filter(Boolean).join(' · ')}
              placeholder="ICAO destino"
              minQuery={1}
            />
            {errors.arrivalAirport && <p className="text-red-400 text-sm mt-1">{errors.arrivalAirport}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Aeródromo Alternado</label>
            <SearchableInput
              value={formData.alternatedAirport || ''}
              onChange={value => setFormData(prev => ({ ...prev, alternatedAirport: value.toUpperCase() }))}
              searchFn={searchAirports}
              getLabel={option => option.icao}
              getSubLabel={option => [option.name, option.city].filter(Boolean).join(' · ')}
              placeholder="ICAO alternado"
              minQuery={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Distância (NM)</label>
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

        {/* Horas (Z) - Conforme modelo JOMARCA */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-600 mb-2">HORAS (Z)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Partida (off-block)</label>
              <input
                type="time"
                value={formData.partidaTime || ''}
                onChange={e => setFormData(prev => ({ ...prev, partidaTime: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Decolagem (takeoff) *</label>
              <input
                type="time"
                value={formData.departureTime}
                onChange={e => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                className="w-full"
              />
              {errors.departureTime && <p className="text-red-400 text-xs mt-1">{errors.departureTime}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Pouso (landing) *</label>
              <input
                type="time"
                value={formData.arrivalTime}
                onChange={e => setFormData(prev => ({ ...prev, arrivalTime: e.target.value }))}
                className="w-full"
              />
              {errors.arrivalTime && <p className="text-red-400 text-xs mt-1">{errors.arrivalTime}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Corte (shutdown)</label>
              <input
                type="time"
                value={formData.corteTime || ''}
                onChange={e => setFormData(prev => ({ ...prev, corteTime: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Tempo de Voo - Conforme modelo JOMARCA */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-600 mb-2">TEMPO DE VOO</h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">DIV</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.flightTime.div || ''}
                onChange={e => updateFlightTime('div', e.target.value)}
                placeholder="0.0"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">NOT</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.flightTime.not || ''}
                onChange={e => updateFlightTime('not', e.target.value)}
                placeholder="0.0"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">VFR</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.flightTime.vfr || ''}
                onChange={e => updateFlightTime('vfr', e.target.value)}
                placeholder="0.0"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Dia</label>
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
              <label className="block text-xs font-medium mb-1">Noite</label>
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
              <label className="block text-xs font-medium mb-1">Instrumento</label>
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
          </div>
          {/* Total */}
          <div className="mt-3 p-3 bg-slate-100 rounded-xl flex items-center justify-between">
            <span className="text-slate-500 text-sm">Tempo Total:</span>
            <span className="text-xl font-bold text-blue-600 font-mono">
              {flightUtils.formatHours(totalFlightTime)}
            </span>
          </div>
        </div>

        {/* Ciclos - Conforme modelo JOMARCA */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-600 mb-2">CICLO</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Pouso Parcial</label>
              <input
                type="number"
                min="0"
                value={formData.cycles?.pousoPartial || ''}
                onChange={e => updateCycles('pousoPartial', e.target.value)}
                placeholder="0"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Pouso Total</label>
              <input
                type="number"
                min="0"
                value={formData.cycles?.pousoTotal || ''}
                onChange={e => updateCycles('pousoTotal', e.target.value)}
                placeholder="0"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">NG 1 (Parcial)</label>
              <input
                type="number"
                min="0"
                value={formData.cycles?.ng1 || ''}
                onChange={e => updateCycles('ng1', e.target.value)}
                placeholder="0"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">NG 1 (Total)</label>
              <input
                type="number"
                min="0"
                value={formData.cycles?.ng1Total || ''}
                onChange={e => updateCycles('ng1Total', e.target.value)}
                placeholder="0"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">NTL 1 (Parcial)</label>
              <input
                type="number"
                min="0"
                value={formData.cycles?.ntl1 || ''}
                onChange={e => updateCycles('ntl1', e.target.value)}
                placeholder="0"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">NTL 1 (Total)</label>
              <input
                type="number"
                min="0"
                value={formData.cycles?.ntl1Total || ''}
                onChange={e => updateCycles('ntl1Total', e.target.value)}
                placeholder="0"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Combustível / POB / Carga */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-600 mb-2">COMB. (KG) / POB / CARGA</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Comb. Total (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.fuelTotal || ''}
                onChange={e => setFormData(prev => ({ ...prev, fuelTotal: parseFloat(e.target.value) || undefined }))}
                placeholder="0"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">NAT (Natureza)</label>
              <select
                value={formData.flightNatureCode || formData.flightNature || ''}
                onChange={e => setFormData(prev => ({ ...prev, flightNatureCode: e.target.value, flightNature: e.target.value as FlightNature || undefined }))}
                className="w-full"
              >
                <option value="">Selecione...</option>
                {flightNatureOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label} - {opt.desc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">POB (pessoas)</label>
              <input
                type="number"
                min="0"
                value={formData.passengersCount || ''}
                onChange={e => setFormData(prev => ({ ...prev, passengersCount: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Carga (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.cargoWeight || ''}
                onChange={e => setFormData(prev => ({ ...prev, cargoWeight: parseFloat(e.target.value) || undefined }))}
                placeholder="0"
                className="w-full"
            />
            </div>
          </div>
        </div>

        {/* Regras de Voo */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-600 mb-2">REGRAS DE VOO</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Regras de Voo *</label>
              <select
                value={formData.flightRules}
                onChange={e => setFormData(prev => ({ ...prev, flightRules: e.target.value as any }))}
                className="w-full"
              >
                <option value="VFR">VFR</option>
                <option value="IFR">IFR</option>
                <option value="YVFR">YVFR</option>
                <option value="ZIFR">ZIFR</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Tipo de Voo *</label>
              <div className="flex flex-wrap gap-2">
                {flightTypeOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleFlightType(option.value)}
                    className={`px-3 py-1.5 rounded-lg border-2 transition-all duration-200 font-medium text-xs ${
                      formData.flightTypes.includes(option.value)
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {errors.flightTypes && <p className="text-red-400 text-xs mt-1">{errors.flightTypes}</p>}
            </div>
          </div>
        </div>

        {/* Pousos */}
        <div>
          <h4 className="text-sm font-semibold text-slate-600 mb-2">POUSOS</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Pousos Dia</label>
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
              <label className="block text-xs font-medium mb-1">Pousos Noite</label>
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
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          RUBRICA PIC / SIC CNAC
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-aviation-accent" />
          <h3 className="text-lg font-semibold text-aviation-accent">RUBRICA / ASSINATURAS</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-2">Rubrica PIC (Assinatura)</label>
            <input
              type="text"
              value={formData.picSignature || ''}
              onChange={e => setFormData(prev => ({ ...prev, picSignature: e.target.value }))}
              placeholder="Assinatura/rubrica do PIC"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">SIC CNAC</label>
            <input
              type="text"
              value={formData.copilotLicense || ''}
              onChange={e => setFormData(prev => ({ ...prev, copilotLicense: e.target.value }))}
              placeholder="Código ANAC do SIC"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          OCORRÊNCIAS / OBSERVAÇÕES
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-aviation-accent" />
          <h3 className="text-lg font-semibold text-aviation-accent">OCORRÊNCIAS / OBSERVAÇÕES</h3>
        </div>
        <textarea
          value={formData.remarks}
          onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
          placeholder="Registre ocorrências, observações, condições meteorológicas, NOTAMs, obstáculos, etc."
          rows={4}
          className="w-full resize-none"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          HORAS ACUMULADAS
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-aviation-accent" />
          <h3 className="text-lg font-semibold text-aviation-accent">HORAS ACUMULADAS</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Horas Célula</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.cumulativeHours?.horasCelula || ''}
              onChange={e => updateCumulativeHours('horasCelula', e.target.value)}
              placeholder="0"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Horas Motor</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.cumulativeHours?.horasMotor || ''}
              onChange={e => updateCumulativeHours('horasMotor', e.target.value)}
              placeholder="0"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Ciclo NG</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.cumulativeHours?.cicloNg || ''}
              onChange={e => updateCumulativeHours('cicloNg', e.target.value)}
              placeholder="0"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Ciclo NTL</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.cumulativeHours?.cicloNtl || ''}
              onChange={e => updateCumulativeHours('cicloNtl', e.target.value)}
              placeholder="0"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Pouso Célula</label>
            <input
              type="number"
              min="0"
              value={formData.cumulativeHours?.pousoCelula || ''}
              onChange={e => updateCumulativeHours('pousoCelula', e.target.value)}
              placeholder="0"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          INSPEÇÃO DE VOR (RBAC 91.171)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-aviation-accent" />
          <h3 className="text-lg font-semibold text-aviation-accent">INSPEÇÃO DE VOR (RBAC 91.171)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">VOR #1 - RD/DME</label>
            <input
              type="text"
              value={formData.vorInspection?.vor1Rddme || ''}
              onChange={e => updateVorInspection('vor1Rddme', e.target.value)}
              placeholder="Ex: RD/DME"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Diferença VOR #1</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.vorInspection?.vor1Difference || ''}
              onChange={e => updateVorInspection('vor1Difference', parseFloat(e.target.value) || 0)}
              placeholder="Graus"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">VOR #2 - RD/DME</label>
            <input
              type="text"
              value={formData.vorInspection?.vor2Rddme || ''}
              onChange={e => updateVorInspection('vor2Rddme', e.target.value)}
              placeholder="Ex: RD/DME"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Diferença VOR #2</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.vorInspection?.vor2Difference || ''}
              onChange={e => updateVorInspection('vor2Difference', parseFloat(e.target.value) || 0)}
              placeholder="Graus"
              className="w-full"
            />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Diferença máxima permitida: {formData.vorInspection?.maxAllowedDifference || 4} graus
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          BANCO DE DADOS - GPS/FMS
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Plane className="w-5 h-5 text-aviation-accent" />
          <h3 className="text-lg font-semibold text-aviation-accent">BANCO DE DADOS - GPS/FMS</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Atualizado nesta data?</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="dbUpdated"
                  checked={formData.databaseUpdate?.updated === true}
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    databaseUpdate: { ...prev.databaseUpdate!, updated: true }
                  }))}
                  className="w-4 h-4"
                />
                <span className="text-sm">SIM</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="dbUpdated"
                  checked={formData.databaseUpdate?.updated === false}
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    databaseUpdate: { ...prev.databaseUpdate!, updated: false }
                  }))}
                  className="w-4 h-4"
                />
                <span className="text-sm">NÃO</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Vencimento</label>
            <input
              type="date"
              value={formData.databaseUpdate?.expiration || ''}
              onChange={e => setFormData(prev => ({
                ...prev,
                databaseUpdate: { ...prev.databaseUpdate!, expiration: e.target.value }
              }))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          PARTE II - SITUAÇÃO TÉCNICA DA AERONAVE
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-aviation-accent" />
          <h3 className="text-lg font-semibold text-aviation-accent">PARTE II - SITUAÇÃO TÉCNICA DA AERONAVE</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Tipo da Última Intervenção de Manutenção</label>
            <input
              type="text"
              value={formData.maintenanceRecord?.lastMaintenanceType || ''}
              onChange={e => updateMaintenanceRecord('lastMaintenanceType', e.target.value)}
              placeholder="Ex: CNA (Corretiva Não Agressive)"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Tipo da Próxima Intervenção de Manutenção</label>
            <input
              type="text"
              value={formData.maintenanceRecord?.nextMaintenanceType || ''}
              onChange={e => updateMaintenanceRecord('nextMaintenanceType', e.target.value)}
              placeholder="Ex: 100h"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Horas de Célula para Próxima Intervenção</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.maintenanceRecord?.hoursToNextMaintenance || ''}
              onChange={e => updateMaintenanceRecord('hoursToNextMaintenance', parseFloat(e.target.value) || 0)}
              placeholder="Ex: 1700.9 h"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Código ANAC do Responsável</label>
            <input
              type="text"
              value={formData.maintenanceRecord?.releasedByCode || ''}
              onChange={e => updateMaintenanceRecord('releasedByCode', e.target.value)}
              placeholder="Ex: 71432"
              className="w-full"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1">Rubrica/Assinatura do Responsável</label>
            <input
              type="text"
              value={formData.maintenanceRecord?.releasedBySignature || ''}
              onChange={e => updateMaintenanceRecord('releasedBySignature', e.target.value)}
              placeholder="Assinatura do responsável pela liberação"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          LIBERAÇÃO DO MECÂNICO
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-aviation-accent" />
          <h3 className="text-lg font-semibold text-aviation-accent">LIBERAÇÃO DO MECÂNICO (RBAC 43)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Código ANAC do Mecânico</label>
            <input
              type="text"
              value={formData.mechanicReleaseCode || ''}
              onChange={e => setFormData(prev => ({ ...prev, mechanicReleaseCode: e.target.value }))}
              placeholder="Ex: 4530"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Rubrica do Mecânico</label>
            <input
              type="text"
              value={formData.mechanicReleaseSignature || ''}
              onChange={e => setFormData(prev => ({ ...prev, mechanicReleaseSignature: e.target.value }))}
              placeholder="Assinatura/rubrica do mecânico"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          BOTÕES DE AÇÃO
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={onCancel} className="btn-secondary">
          <X className="w-5 h-5 inline mr-2" />
          Cancelar
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary">
          <Save className="w-5 h-5 inline mr-2" />
          {isLoading ? 'Salvando...' : 'Salvar Voo'}
        </button>
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
