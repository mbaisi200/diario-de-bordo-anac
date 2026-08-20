import { useEffect, useState } from 'react';
import { User, Save, AlertTriangle, Check, Plane, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { pilotApi, PilotProfile as PilotProfileType, CreatePilotProfileDTO } from '../api/pilot';

const licenseTypes = [
  { value: 'PPL', label: 'PPL - Privada (Private Pilot License)' },
  { value: 'CPL', label: 'CPL - Comercial (Commercial Pilot License)' },
  { value: 'ATPL', label: 'ATPL - Transporte Aéreo (Airline Transport)' },
  { value: 'SPL', label: 'SPL - Planador (Glider Pilot License)' },
  { value: 'BPL', label: 'BPL - Balão (Balloon Pilot License)' },
  { value: 'IFR', label: 'IFR - Instrumentos (Instrument Rating)' },
  { value: 'FI', label: 'FI - Instrutor de Voo (Flight Instructor)' },
];

const medicalClasses = [
  { value: '1', label: 'Classe I (Transporte Aéreo)' },
  { value: '2', label: 'Classe II (Aviação Geral)' },
  { value: '3', label: 'Classe III (Piloto de Planador)' },
  { value: '4', label: 'Classe IV (Piloto de Balão)' },
];

export default function PilotProfilePage() {
  const { user } = useAuth();
  const [, setProfile] = useState<PilotProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState<CreatePilotProfileDTO>({
    user_id: user?.id || 'default',
    full_name: user?.name || '',
    license_number: '',
    license_type: 'PPL',
    medical_class: '2',
    medical_expiry: '',
    rg: '',
    cpf: '',
    email: '',
    phone: '',
    address: '',
    birth_date: '',
    nationality: 'Brasileira',
    total_flight_hours: 0,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await pilotApi.getProfile(user?.id || 'default');
      if (data) {
        setProfile(data);
        setFormData({
          user_id: data.user_id,
          full_name: data.full_name,
          license_number: data.license_number,
          license_type: data.license_type,
          medical_class: data.medical_class,
          medical_expiry: data.medical_expiry,
          rg: data.rg,
          cpf: data.cpf,
          email: data.email,
          phone: data.phone,
          address: data.address,
          birth_date: data.birth_date,
          nationality: data.nationality,
          total_flight_hours: data.total_flight_hours,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const saved = await pilotApi.saveProfile(formData);
      setProfile(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof CreatePilotProfileDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isMedicalExpired = formData.medical_expiry && 
    new Date(formData.medical_expiry) < new Date();

  const isMedicalExpiringSoon = formData.medical_expiry && 
    !isMedicalExpired &&
    new Date(formData.medical_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card animate-pulse">
          <div className="h-8 bg-aviation-light rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-aviation-light rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Perfil do Piloto</h1>
          <p className="text-gray-400">Dados pessoais e habilitações ANAC</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-aviation-accent">
            <User className="w-5 h-5 inline mr-2" />
            Dados Pessoais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Nome Completo *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={e => updateField('full_name', e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">RG</label>
              <input
                type="text"
                value={formData.rg}
                onChange={e => updateField('rg', e.target.value)}
                placeholder="00.000.000-0"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CPF</label>
              <input
                type="text"
                value={formData.cpf}
                onChange={e => updateField('cpf', e.target.value)}
                placeholder="000.000.000-00"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Data de Nascimento</label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={e => updateField('birth_date', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nacionalidade</label>
              <input
                type="text"
                value={formData.nationality}
                onChange={e => updateField('nationality', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => updateField('email', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => updateField('phone', e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Endereço</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => updateField('address', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Habilitação ANAC */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-aviation-accent">
            <Plane className="w-5 h-5 inline mr-2" />
            Habilitação ANAC
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Número da Licença *</label>
              <input
                type="text"
                value={formData.license_number}
                onChange={e => updateField('license_number', e.target.value)}
                placeholder="Ex: 123456789"
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Licença *</label>
              <select
                value={formData.license_type}
                onChange={e => updateField('license_type', e.target.value)}
                className="w-full"
                required
              >
                {licenseTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Horas de Voo Totais</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.total_flight_hours || ''}
                onChange={e => updateField('total_flight_hours', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Certificado Médico */}
        <div className={`card ${isMedicalExpired ? 'border-red-500' : isMedicalExpiringSoon ? 'border-yellow-500' : ''}`}>
          <h3 className="text-lg font-semibold mb-4 text-aviation-accent">
            <Heart className="w-5 h-5 inline mr-2" />
            Certificado Médico
          </h3>
          
          {isMedicalExpired && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-300">Certificado médico VENCIDO!</span>
            </div>
          )}
          
          {isMedicalExpiringSoon && !isMedicalExpired && (
            <div className="mb-4 p-3 bg-yellow-900/50 border border-yellow-500 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-300">Certificado médico vence em breve!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Classe do Médico *</label>
              <select
                value={formData.medical_class}
                onChange={e => updateField('medical_class', e.target.value)}
                className="w-full"
                required
              >
                {medicalClasses.map(cls => (
                  <option key={cls.value} value={cls.value}>
                    {cls.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Data de Validade *</label>
              <input
                type="date"
                value={formData.medical_expiry}
                onChange={e => updateField('medical_expiry', e.target.value)}
                className={`w-full ${isMedicalExpired ? 'border-red-500' : ''}`}
                required
              />
            </div>
          </div>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="card bg-green-900/30 border-green-500">
            <div className="flex items-center gap-2 text-green-400">
              <Check className="w-5 h-5" />
              <span>Perfil salvo com sucesso!</span>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary flex items-center"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Perfil'}
          </button>
        </div>
      </form>
    </div>
  );
}
