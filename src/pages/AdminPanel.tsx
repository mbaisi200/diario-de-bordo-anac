import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, Pilot, Aircraft } from '../api/admin';
import { maskCpf, maskPhone } from '../utils/masks';
import { Users, Plane, Plus, Trash2, X, KeyRound, User as UserIcon } from 'lucide-react';

const emptyPilot = {
  name: '',
  cpf: '',
  email: '',
  phone: '',
  licenseNumber: '',
  licenseType: '',
  medicalClass: '',
  medicalExpiry: '',
  username: '',
  password: '',
};

const emptyAircraft = {
  registration: '',
  type: '',
  model: '',
  manufacturer: '',
  category: '',
  year: '',
};

type Tab = 'pilots' | 'aircrafts';

export default function AdminPanel() {
  const { user, token, logout } = useAuth();
  const tenantId = user?.tenantId || '';

  const [tab, setTab] = useState<Tab>('pilots');
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPilotForm, setShowPilotForm] = useState(false);
  const [showAircraftForm, setShowAircraftForm] = useState(false);
  const [pilotForm, setPilotForm] = useState(emptyPilot);
  const [aircraftForm, setAircraftForm] = useState(emptyAircraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    if (!token || !tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [p, a] = await Promise.all([
        adminApi.listPilots(token, tenantId),
        adminApi.listAircrafts(token, tenantId),
      ]);
      setPilots(p);
      setAircrafts(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, tenantId]);

  const handleCreatePilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !tenantId) return;
    setError('');
    setSuccess('');
    if (!pilotForm.name.trim() || !pilotForm.username.trim() || pilotForm.password.length < 6) {
      setError('Nome, usuário e senha (mínimo 6 caracteres) são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      await adminApi.createPilot(token, tenantId, {
        name: pilotForm.name,
        cpf: pilotForm.cpf,
        email: pilotForm.email || undefined,
        phone: pilotForm.phone,
        licenseNumber: pilotForm.licenseNumber || undefined,
        licenseType: pilotForm.licenseType || undefined,
        medicalClass: pilotForm.medicalClass || undefined,
        medicalExpiry: pilotForm.medicalExpiry || undefined,
        username: pilotForm.username,
        password: pilotForm.password,
      });
      setSuccess('Piloto cadastrado com sucesso!');
      setShowPilotForm(false);
      setPilotForm(emptyPilot);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar piloto');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePilot = async (pilot: Pilot) => {
    if (!token || !tenantId) return;
    if (!window.confirm(`Excluir o piloto "${pilot.name}"?`)) return;
    setError('');
    try {
      await adminApi.deletePilot(token, tenantId, pilot.id);
      setSuccess('Piloto excluído');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir piloto');
    }
  };

  const handleCreateAircraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !tenantId) return;
    setError('');
    setSuccess('');
    if (!aircraftForm.registration.trim() || !aircraftForm.type.trim()) {
      setError('Matrícula e tipo são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      await adminApi.createAircraft(token, tenantId, {
        registration: aircraftForm.registration,
        type: aircraftForm.type,
        model: aircraftForm.model || undefined,
        manufacturer: aircraftForm.manufacturer || undefined,
        category: aircraftForm.category || undefined,
        year: aircraftForm.year ? Number(aircraftForm.year) : undefined,
      });
      setSuccess('Aeronave cadastrada com sucesso!');
      setShowAircraftForm(false);
      setAircraftForm(emptyAircraft);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar aeronave');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAircraft = async (aircraft: Aircraft) => {
    if (!token || !tenantId) return;
    if (!window.confirm(`Excluir a aeronave "${aircraft.registration}"?`)) return;
    setError('');
    try {
      await adminApi.deleteAircraft(token, tenantId, aircraft.id);
      setSuccess('Aeronave excluída');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir aeronave');
    }
  };

  const inputClass = "w-full";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Painel do Admin</h2>
        <p className="text-sm text-slate-500">Cadastre os pilotos e aeronaves da sua organização</p>
      </div>

      {error && (
        <div className="p-3 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
        <button
          onClick={() => setTab('pilots')}
          className={`flex-1 py-2.5 px-4 rounded-lg transition-all duration-300 font-medium flex items-center justify-center gap-2 ${
            tab === 'pilots'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Pilotos ({pilots.length})
        </button>
        <button
          onClick={() => setTab('aircrafts')}
          className={`flex-1 py-2.5 px-4 rounded-lg transition-all duration-300 font-medium flex items-center justify-center gap-2 ${
            tab === 'aircrafts'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Plane className="w-4 h-4" /> Aeronaves ({aircrafts.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Carregando...</div>
      ) : !tenantId ? (
        <div className="card p-8 text-center space-y-4">
          <p className="text-slate-500">
            Sessão desatualizada: não foi possível identificar sua organização.
          </p>
          <button onClick={logout} className="btn-primary">
            Sair e entrar novamente
          </button>
        </div>
      ) : tab === 'pilots' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowPilotForm(!showPilotForm);
                setError('');
                setSuccess('');
              }}
              className="btn-primary"
            >
              {showPilotForm ? <><X className="w-4 h-4" /> Cancelar</> : <><Plus className="w-4 h-4" /> Novo Piloto</>}
            </button>
          </div>

          {showPilotForm && (
            <form onSubmit={handleCreatePilot} className="card p-6 space-y-5 animate-slide-down">
              <h3 className="text-lg font-semibold">Cadastrar Piloto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-sm font-medium">Nome Completo</label>
                  <input type="text" value={pilotForm.name} onChange={(e) => setPilotForm({ ...pilotForm, name: e.target.value })} className={inputClass} placeholder="Nome do piloto" required />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">CPF</label>
                  <input type="text" value={pilotForm.cpf} onChange={(e) => setPilotForm({ ...pilotForm, cpf: maskCpf(e.target.value) })} className={inputClass} placeholder="000.000.000-00" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Email</label>
                  <input type="email" value={pilotForm.email} onChange={(e) => setPilotForm({ ...pilotForm, email: e.target.value })} className={inputClass} placeholder="piloto@email.com" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Telefone</label>
                  <input type="tel" value={pilotForm.phone} onChange={(e) => setPilotForm({ ...pilotForm, phone: maskPhone(e.target.value) })} className={inputClass} placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Licença (ANAC)</label>
                  <input type="text" value={pilotForm.licenseNumber} onChange={(e) => setPilotForm({ ...pilotForm, licenseNumber: e.target.value })} className={inputClass} placeholder="Nº da licença" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Tipo de Licença</label>
                  <select value={pilotForm.licenseType} onChange={(e) => setPilotForm({ ...pilotForm, licenseType: e.target.value })} className={inputClass}>
                    <option value="">Selecione...</option>
                    <option value="PPL">PPL - Piloto Privado</option>
                    <option value="CPL">CPL - Piloto Comercial</option>
                    <option value="ATPL">ATPL - Piloto de Linha Aérea</option>
                    <option value="MPL">MPL - Piloto Multipiloto</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Classe Médica</label>
                  <select value={pilotForm.medicalClass} onChange={(e) => setPilotForm({ ...pilotForm, medicalClass: e.target.value })} className={inputClass}>
                    <option value="">Selecione...</option>
                    <option value="1">1ª Classe</option>
                    <option value="2">2ª Classe</option>
                    <option value="3">3ª Classe</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Validade Médico</label>
                  <input type="date" value={pilotForm.medicalExpiry} onChange={(e) => setPilotForm({ ...pilotForm, medicalExpiry: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-semibold text-blue-500 flex items-center gap-2">
                  <KeyRound className="w-4 h-4" /> Dados de Acesso
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium">Usuário</label>
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <input type="text" value={pilotForm.username} onChange={(e) => setPilotForm({ ...pilotForm, username: e.target.value })} className={inputClass} placeholder="Usuário para login" required minLength={3} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium">Senha</label>
                    <input type="password" value={pilotForm.password} onChange={(e) => setPilotForm({ ...pilotForm, password: e.target.value })} className={inputClass} placeholder="Mínimo 6 caracteres" required minLength={6} />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={saving} className="w-full btn-primary py-3">
                {saving ? 'Salvando...' : <><Plus className="w-5 h-5 inline mr-2" /> Cadastrar Piloto</>}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {pilots.length === 0 ? (
              <div className="card p-8 text-center text-slate-500">Nenhum piloto cadastrado.</div>
            ) : (
              pilots.map((pilot) => (
                <div key={pilot.id} className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold">{pilot.name}</span>
                      {!pilot.active && <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">Inativo</span>}
                    </div>
                    <div className="text-sm text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                      {pilot.license_number && <span>{pilot.license_type} · {pilot.license_number}</span>}
                      {pilot.cpf && <span>{pilot.cpf}</span>}
                      {pilot.email && <span>{pilot.email}</span>}
                      {pilot.username && <span className="text-xs">Login: {pilot.username}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDeletePilot(pilot)} className="btn-ghost text-red-400 hover:bg-red-500/10 shrink-0" title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowAircraftForm(!showAircraftForm);
                setError('');
                setSuccess('');
              }}
              className="btn-primary"
            >
              {showAircraftForm ? <><X className="w-4 h-4" /> Cancelar</> : <><Plus className="w-4 h-4" /> Nova Aeronave</>}
            </button>
          </div>

          {showAircraftForm && (
            <form onSubmit={handleCreateAircraft} className="card p-6 space-y-5 animate-slide-down">
              <h3 className="text-lg font-semibold">Cadastrar Aeronave</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Matrícula</label>
                  <input type="text" value={aircraftForm.registration} onChange={(e) => setAircraftForm({ ...aircraftForm, registration: e.target.value.toUpperCase() })} className={inputClass} placeholder="PT-ABC" required />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Tipo</label>
                  <input type="text" value={aircraftForm.type} onChange={(e) => setAircraftForm({ ...aircraftForm, type: e.target.value })} className={inputClass} placeholder="Cessna 172" required />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Modelo</label>
                  <input type="text" value={aircraftForm.model} onChange={(e) => setAircraftForm({ ...aircraftForm, model: e.target.value })} className={inputClass} placeholder="172S" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Fabricante</label>
                  <input type="text" value={aircraftForm.manufacturer} onChange={(e) => setAircraftForm({ ...aircraftForm, manufacturer: e.target.value })} className={inputClass} placeholder="Cessna" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Categoria</label>
                  <select value={aircraftForm.category} onChange={(e) => setAircraftForm({ ...aircraftForm, category: e.target.value })} className={inputClass}>
                    <option value="">Selecione...</option>
                    <option value="Avião">Avião</option>
                    <option value="Helicóptero">Helicóptero</option>
                    <option value="Planador">Planador</option>
                    <option value="Ultralight">Ultralight</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Ano</label>
                  <input type="number" value={aircraftForm.year} onChange={(e) => setAircraftForm({ ...aircraftForm, year: e.target.value })} className={inputClass} placeholder="2020" min={1900} max={2100} />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full btn-primary py-3">
                {saving ? 'Salvando...' : <><Plus className="w-5 h-5 inline mr-2" /> Cadastrar Aeronave</>}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {aircrafts.length === 0 ? (
              <div className="card p-8 text-center text-slate-500">Nenhuma aeronave cadastrada.</div>
            ) : (
              aircrafts.map((aircraft) => (
                <div key={aircraft.id} className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Plane className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold">{aircraft.registration}</span>
                      {!aircraft.active && <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">Inativo</span>}
                    </div>
                    <div className="text-sm text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>{aircraft.type}</span>
                      {aircraft.model && <span>{aircraft.model}</span>}
                      {aircraft.manufacturer && <span>{aircraft.manufacturer}</span>}
                      {aircraft.year && <span>{aircraft.year}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteAircraft(aircraft)} className="btn-ghost text-red-400 hover:bg-red-500/10 shrink-0" title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}