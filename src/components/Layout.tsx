import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  PlusCircle,
  List,
  Plane,
  Menu,
  X,
  Download,
  LogOut,
  User
} from 'lucide-react';
import { useState } from 'react';
import MobileNav from './MobileNav';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/new-flight', label: 'Novo Voo', icon: PlusCircle },
  { path: '/flights', label: 'Meus Voos', icon: List },
  { path: '/profile', label: 'Perfil', icon: User },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        isDark
          ? 'bg-slate-900/80 border-slate-700/50'
          : 'bg-white/80 border-slate-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
              <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <Plane className="w-6 h-6 text-white transform group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">Diário de Bordo</h1>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ANAC Digital</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />

            <button
              className="btn-ghost"
              title="Exportar dados"
            >
              <Download className="w-5 h-5" />
            </button>

            {/* User Menu */}
            {user && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                isDark ? 'bg-slate-800/60' : 'bg-slate-100'
              }`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {user.name}
                </span>
              </div>
            )}

            <button
              onClick={logout}
              className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              className="btn-ghost"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className={`md:hidden border-b transition-all duration-300 ${
          isDark ? 'bg-slate-900/95 border-slate-700/50' : 'bg-white/95 border-slate-200/50'
        } backdrop-blur-xl`}>
          <nav className="px-4 py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* User Info & Logout (Mobile) */}
            {user && (
              <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 pb-24 md:pb-6 animate-fade-in">
        {children}
      </main>

      {/* Footer - hidden on mobile (MobileNav takes space) */}
      <footer className={`hidden md:block border-t transition-all duration-300 ${
        isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/80 border-slate-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Diário de Bordo Digital © 2024 - Conforme normas ANAC/ICAO
            </p>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              ⚠️ Ferramenta auxiliar. Registro oficial: diário homologado ANAC.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
