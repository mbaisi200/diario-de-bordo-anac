import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative group p-2.5 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-aviation-400"
      title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {/* Background glow */}
      <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
        isDark 
          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100' 
          : 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100'
      }`} />

      {/* Icon */}
      <div className="relative z-10 transition-transform duration-500 ease-in-out">
        {isDark ? (
          <Sun className="w-5 h-5 text-amber-400 group-hover:text-amber-300 group-hover:rotate-90 transition-all duration-500" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-500 group-hover:text-indigo-400 group-hover:-rotate-12 transition-all duration-500" />
        )}
      </div>

      {/* Tooltip */}
      <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
        isDark ? 'bg-slate-700 text-white' : 'bg-slate-800 text-white'
      }`}>
        {isDark ? '☀️ Tema Claro' : '🌙 Tema Escuro'}
      </div>
    </button>
  );
}
