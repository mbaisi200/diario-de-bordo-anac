import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, List, User, Shield, Building2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function MobileNav() {
  const location = useLocation();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const tabs = [
    { path: '/', label: 'Início', icon: Home },
    { path: '/flights', label: 'Voos', icon: List },
    { path: '/new-flight', label: 'Novo', icon: PlusCircle, isAction: true },
    ...(user?.role === 'master'
      ? [{ path: '/master', label: 'Master', icon: Shield }]
      : []),
    ...(user?.role === 'admin'
      ? [{ path: '/admin', label: 'Admin', icon: Building2 }]
      : []),
    { path: '/profile', label: 'Perfil', icon: User },
  ];

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl safe-area-inset ${
      isDark
        ? 'bg-slate-900/95 border-slate-700/50'
        : 'bg-white/95 border-slate-200/50'
    }`}>
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          if (tab.isAction) {
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="relative -mt-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-lg opacity-40" />
                  <div className={`relative p-3 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-md shadow-blue-500/20'
                  }`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center gap-1 py-2 px-3 min-w-[60px]"
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? isDark
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-blue-500/10 text-blue-600'
                  : isDark
                    ? 'text-slate-400'
                    : 'text-slate-500'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${
                isActive
                  ? isDark ? 'text-blue-400' : 'text-blue-600'
                  : isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
