import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { masterApi, AdminTenant, CreateAdminDTO } from '../api/master';
import { fetchAddressByCep, maskCep, maskCnpjCpf, maskPhone } from '../utils/masks';
import { Building2, Plus, Trash2, Search, X, Phone, Mail, MapPin, KeyRound, User as UserIcon } from 'lucide-react';

const emptyAddress = {
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

const emptyForm = {
  companyName: '',
  cnpjCpf: '',
  email: '',
  phones: [''],
  address: { ...emptyAddress },
  username: '',
  password: '',
};

export default function MasterAdmins() {
  const { token } = useAuth();
  const [admins, setAdmins] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchingCep, setSearchingCep] = useState(false);

  const loadAdmins = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await masterApi.listAdmins(token);
      setAdmins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, [token]);

  const handleCepSearch = async () => {
    const cep = form.address.cep;
    if (cep.replace(/\D/g, '').length !== 8) return;
    setSearchingCep(true);
    setError('');
    try {
      const data = await fetchAddressByCep(cep);
      if (!data) {
        setError('CEP não encontrado');
        return;
      }
      setForm((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
          complement: data.complemento || prev.address.complement,
        },
      }));
    } catch {
      setError('Erro ao buscar CEP');
    } finally {
      setSearchingCep(false);
    }
  };

  const updatePhone = (index: number, value: string) => {
    setForm((prev) => {
      const phones = [...prev.phones];
      phones[index] = maskPhone(value);
      return { ...prev, phones };
    });
  };

  const addPhone = () => {
    setForm((prev) => ({ ...prev, phones: [...prev.phones, ''] }));
  };

  const removePhone = (index: number) => {
    setForm((prev) => {
      const phones = prev.phones.filter((_, i) => i !== index);
      return { ...prev, phones: phones.length ? phones : [''] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');
    setSuccess('');

    if (!form.companyName.trim() || !form.cnpjCpf.trim() || !form.email.trim()) {
      setError('Razão social, CNPJ/CPF e email são obrigatórios');
      return;
    }
    if (!form.username.trim() || form.password.length < 6) {
      setError('Usuário e senha (mínimo 6 caracteres) são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateAdminDTO = {
        companyName: form.companyName,
        cnpjCpf: form.cnpjCpf,
        email: form.email,
        phones: form.phones.map((p) => p.trim()).filter(Boolean),
        address: form.address,
        username: form.username,
        password: form.password,
      };
      await masterApi.createAdmin(token, payload);
      setSuccess('Admin cadastrado com sucesso!');
      setShowForm(false);
      setForm(emptyForm);
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar admin');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (admin: AdminTenant) => {
    if (!token) return;
    if (!window.confirm(`Excluir o admin "${admin.company_name}"? Esta ação não pode ser desfeita.`)) return;
    setError('');
    try {
      await masterApi.deleteAdmin(token, admin.id);
      setSuccess('Admin excluído');
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir admin');
    }
  };

  const inputClass = "w-full";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-500" />
            Painel Master
          </h2>
          <p className="text-sm text-slate-500">Cadastro de administradores do sistema</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setError('');
            setSuccess('');
          }}
          className="btn-primary"
        >
          {showForm ? <><X className="w-4 h-4" /> Cancelar</> : <><Plus className="w-4 h-4" /> Novo Admin</>}
        </button>
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

      {showForm && (
        <div className="card p-6 space-y-6 animate-slide-down">
          <h3 className="text-lg font-semibold">Cadastrar Administrador</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-medium">Razão Social / Nome</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="Nome da empresa ou organização"
                  className={inputClass}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">CNPJ ou CPF</label>
                <input
                  type="text"
                  value={form.cnpjCpf}
                  onChange={(e) => setForm({ ...form, cnpjCpf: maskCnpjCpf(e.target.value) })}
                  placeholder="00.000.000/0000-00 ou 000.000.000-00"
                  className={inputClass}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contato@empresa.com"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-blue-500 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Endereço
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-sm font-medium">CEP</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.address.cep}
                      onChange={(e) => setForm({ ...form, address: { ...form.address, cep: maskCep(e.target.value) } })}
                      placeholder="00000-000"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={handleCepSearch}
                      disabled={searchingCep}
                      className="btn-ghost shrink-0"
                      title="Buscar CEP"
                    >
                      {searchingCep ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1 md:col-span-4">
                  <label className="block text-sm font-medium">Logradouro</label>
                  <input
                    type="text"
                    value={form.address.street}
                    onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })}
                    placeholder="Rua, Avenida..."
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1 md:col-span-1">
                  <label className="block text-sm font-medium">Número</label>
                  <input
                    type="text"
                    value={form.address.number}
                    onChange={(e) => setForm({ ...form, address: { ...form.address, number: e.target.value } })}
                    placeholder="123"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="block text-sm font-medium">Complemento</label>
                  <input
                    type="text"
                    value={form.address.complement}
                    onChange={(e) => setForm({ ...form, address: { ...form.address, complement: e.target.value } })}
                    placeholder="Sala, andar..."
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1 md:col-span-3">
                  <label className="block text-sm font-medium">Bairro</label>
                  <input
                    type="text"
                    value={form.address.neighborhood}
                    onChange={(e) => setForm({ ...form, address: { ...form.address, neighborhood: e.target.value } })}
                    placeholder="Bairro"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="block text-sm font-medium">Cidade</label>
                  <input
                    type="text"
                    value={form.address.city}
                    onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
                    placeholder="Cidade"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1 md:col-span-1">
                  <label className="block text-sm font-medium">UF</label>
                  <input
                    type="text"
                    value={form.address.state}
                    onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value.toUpperCase() } })}
                    placeholder="SP"
                    maxLength={2}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Telefones */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-blue-500 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Telefones
              </h4>
              <div className="space-y-2">
                {form.phones.map((phone, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1 max-w-sm">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => updatePhone(index, e.target.value)}
                        placeholder="(00) 00000-0000"
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhone(index)}
                      className="btn-ghost text-red-400 hover:bg-red-500/10"
                      title="Remover telefone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addPhone}
                className="btn-ghost text-blue-500 hover:bg-blue-500/10"
              >
                <Plus className="w-4 h-4" /> Adicionar telefone
              </button>
            </div>

            {/* Acesso */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-blue-500 flex items-center gap-2">
                <KeyRound className="w-4 h-4" /> Dados de Acesso
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Usuário</label>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      placeholder="Usuário para login"
                      className={inputClass}
                      required
                      minLength={3}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Senha</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className={inputClass}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full btn-primary py-3">
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Salvando...
                </span>
              ) : (
                <><Plus className="w-5 h-5 inline mr-2" /> Cadastrar Admin</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Lista de admins */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Administradores ({admins.length})</h3>
        {loading ? (
          <div className="text-center py-8 text-slate-500">Carregando...</div>
        ) : admins.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            Nenhum admin cadastrado ainda.
          </div>
        ) : (
          admins.map((admin) => (
            <div key={admin.id} className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold">{admin.company_name}</span>
                  {!admin.active && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">Inativo</span>
                  )}
                </div>
                <div className="text-sm text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {admin.email}</span>
                  {admin.cnpj_cpf && <span>{admin.cnpj_cpf}</span>}
                  {admin.username && <span>Login: {admin.username}</span>}
                </div>
                <div className="text-xs text-slate-400">
                  {(admin.phones || []).map((p) => p).join(' · ')}
                  {admin.address?.city && ` · ${admin.address.city}/${admin.address.state}`}
                </div>
              </div>
              <button
                onClick={() => handleDelete(admin)}
                className="btn-ghost text-red-400 hover:bg-red-500/10 shrink-0"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}