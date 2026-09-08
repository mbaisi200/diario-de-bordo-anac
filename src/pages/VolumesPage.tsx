import { useState, useEffect } from 'react';
import { BookOpen, Plus, CheckCircle, XCircle, Calendar, Plane } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { flightApi } from '../api/flights';

interface Volume {
  id: string; volume_number: string; aircraft_registration: string;
  aircraft_manufacturer: string | null; aircraft_model: string | null;
  aircraft_serial_number: string | null; registration_category: string | null;
  total_hours_at_opening: number; total_cycles_at_opening: number;
  total_landings_at_opening: number; year_of_manufacture: string | null;
  owner: string | null; operator: string | null; opening_date: string;
  closing_date: string | null; status: string; signed_by: string | null;
}

export default function VolumesPage() {
  useTheme();
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    volumeNumber: '', aircraftRegistration: '', aircraftManufacturer: '',
    aircraftModel: '', aircraftSerialNumber: '', registrationCategory: '',
    totalHoursAtOpening: 0, totalCyclesAtOpening: 0, totalLandingsAtOpening: 0,
    yearOfManufacture: '', owner: '', operator: '',
    openingDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => { loadVolumes(); }, []);

  const loadVolumes = async () => {
    try { setLoading(true); setVolumes(await flightApi.getVolumes()); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await flightApi.createVolume({ ...form, aircraftRegistration: form.aircraftRegistration.toUpperCase() });
      setShowForm(false); loadVolumes();
    } catch (e) { console.error(e); }
  };

  const handleClose = async (id: string) => {
    if (!confirm('Fechar este volume?')) return;
    try { await flightApi.closeVolume(id, 'operator'); loadVolumes(); }
    catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-aviation-accent" />Volumes do Diário
          </h2>
          <p className="text-sm text-slate-500 mt-1">Conforme Portaria 3.220/SPO/SAR</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus className="w-4 h-4 inline mr-1" />Novo Volume
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-4">
          <h3 className="text-lg font-semibold">Abrir Novo Volume</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nº Volume * (NN/CC-MMM/AAAA)</label>
              <input type="text" required value={form.volumeNumber}
                onChange={e => setForm(p => ({ ...p, volumeNumber: e.target.value }))}
                placeholder="001/PTABC/26" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Matrícula *</label>
              <input type="text" required value={form.aircraftRegistration}
                onChange={e => setForm(p => ({ ...p, aircraftRegistration: e.target.value.toUpperCase() }))}
                placeholder="PT-ABC" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Abertura *</label>
              <input type="date" required value={form.openingDate}
                onChange={e => setForm(p => ({ ...p, openingDate: e.target.value }))}
                className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fabricante</label>
              <input type="text" value={form.aircraftManufacturer}
                onChange={e => setForm(p => ({ ...p, aircraftManufacturer: e.target.value }))}
                placeholder="Cessna" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Modelo</label>
              <input type="text" value={form.aircraftModel}
                onChange={e => setForm(p => ({ ...p, aircraftModel: e.target.value }))}
                placeholder="172S" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nº Série</label>
              <input type="text" value={form.aircraftSerialNumber}
                onChange={e => setForm(p => ({ ...p, aircraftSerialNumber: e.target.value }))}
                className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoria Registro</label>
              <input type="text" value={form.registrationCategory}
                onChange={e => setForm(p => ({ ...p, registrationCategory: e.target.value }))}
                placeholder="Standart" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Horas na Abertura</label>
              <input type="number" step="0.1" min="0" value={form.totalHoursAtOpening}
                onChange={e => setForm(p => ({ ...p, totalHoursAtOpening: parseFloat(e.target.value) || 0 }))}
                className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ciclos na Abertura</label>
              <input type="number" min="0" value={form.totalCyclesAtOpening}
                onChange={e => setForm(p => ({ ...p, totalCyclesAtOpening: parseInt(e.target.value) || 0 }))}
                className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pousos na Abertura</label>
              <input type="number" min="0" value={form.totalLandingsAtOpening}
                onChange={e => setForm(p => ({ ...p, totalLandingsAtOpening: parseInt(e.target.value) || 0 }))}
                className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ano Fabricação</label>
              <input type="text" value={form.yearOfManufacture}
                onChange={e => setForm(p => ({ ...p, yearOfManufacture: e.target.value }))}
                className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Proprietário</label>
              <input type="text" value={form.owner}
                onChange={e => setForm(p => ({ ...p, owner: e.target.value }))}
                className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Operador</label>
              <input type="text" value={form.operator}
                onChange={e => setForm(p => ({ ...p, operator: e.target.value }))}
                className="w-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm">Abrir Volume</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="card text-center py-8"><p className="text-slate-500">Carregando volumes...</p></div>
      ) : volumes.length === 0 ? (
        <div className="card text-center py-8">
          <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-500">Nenhum volume cadastrado</p>
          <p className="text-xs text-slate-400 mt-1">Crie o primeiro volume para começar a registrar voos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {volumes.map(v => (
            <div key={v.id} className="card">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${v.status === 'open'
                    ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                    {v.status === 'open' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-semibold">{v.volume_number}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Plane className="w-3 h-3" />{v.aircraft_registration}
                      {v.aircraft_manufacturer && <span>· {v.aircraft_manufacturer} {v.aircraft_model}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{new Date(v.opening_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                  <span>{v.total_hours_at_opening}h</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    v.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {v.status === 'open' ? 'ABERTO' : 'FECHADO'}
                  </span>
                  {v.status === 'open' && (
                    <button onClick={() => handleClose(v.id)}
                      className="text-orange-500 hover:text-orange-600 text-xs font-medium">
                      Fechar Volume
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
