import { useState } from 'react';
import { Plane, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const { isDark } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLoginMode) {
        await login(username, password);
      } else {
        if (!name.trim()) {
          setError('Nome é obrigatório');
          setIsLoading(false);
          return;
        }
        await register(username, password, name, email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-300/10 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-10'}`}
          style={{
            backgroundImage: `linear-gradient(${isDark ? 'rgba(148,163,184,0.3)' : 'rgba(100,116,139,0.3)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(148,163,184,0.3)' : 'rgba(100,116,139,0.3)'} 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">            <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 p-5 rounded-2xl shadow-2xl animate-glow-pulse">
              <Plane className="w-14 h-14 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mt-6 mb-2 gradient-text">Diário de Bordo</h1>
          <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ANAC Digital Logbook</p>
        </div>

        {/* Card */}
        <div className={`card ${isDark ? 'shadow-2xl shadow-blue-500/10' : 'shadow-xl shadow-slate-200/50'}`}>
          {/* Toggle */}
          <div className={`flex mb-6 p-1 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <button
              type="button"
              onClick={() => setIsLoginMode(true)}
              className={`flex-1 py-2.5 px-4 rounded-lg transition-all duration-300 font-medium ${
                isLoginMode
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setIsLoginMode(false)}
              className={`flex-1 py-2.5 px-4 rounded-lg transition-all duration-300 font-medium ${
                !isLoginMode
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Cadastrar
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1">
              <label className="block text-sm font-medium">Usuário</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                className="w-full"
                required
                minLength={3}
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-sm font-medium">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full pr-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Register fields */}
            {!isLoginMode && (
              <>
                <div className="space-y-1 animate-slide-down">
                  <label className="block text-sm font-medium">Nome Completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full"
                    required
                  />
                </div>
                <div className="space-y-1 animate-slide-down">
                  <label className="block text-sm font-medium">Email (opcional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full"
                  />
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl text-red-400 text-sm animate-scale-in">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary text-base py-3.5"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processando...
                </span>
              ) : (
                <>
                  {isLoginMode ? (
                    <>
                      <LogIn className="w-5 h-5 inline mr-2" />
                      Entrar
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 inline mr-2" />
                      Criar Conta
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          {isLoginMode && (
            <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <p className={`text-sm text-center mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                🔑 Credenciais de teste:
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className={`font-mono px-3 py-1.5 rounded-lg text-sm ${isDark ? 'bg-slate-700 text-blue-300' : 'bg-slate-100 text-blue-600'}`}>
                  neto
                </span>
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>/</span>
                <span className={`font-mono px-3 py-1.5 rounded-lg text-sm ${isDark ? 'bg-slate-700 text-blue-300' : 'bg-slate-100 text-blue-600'}`}>
                  123456
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className={`text-center text-sm mt-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Diário de Bordo Digital © 2024 - ANAC
        </p>
      </div>
    </div>
  );
}
