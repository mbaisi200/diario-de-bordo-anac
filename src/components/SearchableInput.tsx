import { useEffect, useRef, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchableInputProps<T> {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (option: T) => void;
  searchFn: (query: string) => Promise<T[]>;
  getLabel: (option: T) => string;
  getSubLabel?: (option: T) => string;
  placeholder?: string;
  disabled?: boolean;
  minQuery?: number;
}

export default function SearchableInput<T>({
  value,
  onChange,
  onSelect,
  searchFn,
  getLabel,
  getSubLabel,
  placeholder,
  disabled,
  minQuery = 2,
}: SearchableInputProps<T>) {
  const [options, setOptions] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = value.trim();
    if (query.length < minQuery) {
      setOptions([]);
      setOpen(false);
      setLoading(false);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchFn(query);
        setOptions(results);
        setSearched(true);
        setOpen(true);
      } catch {
        setOptions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, searchFn, minQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: T) => {
    onChange(getLabel(option));
    onSelect?.(option);
    setOpen(false);
    setSearched(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pr-8"
          onFocus={() => {
            if (value.trim().length >= minQuery) setOpen(true);
          }}
        />
        {loading ? (
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
        ) : value.trim().length >= minQuery ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setOptions([]);
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            title="Limpar"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        )}
      </div>

      {open && options.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-slate-100 last:border-0"
            >
              <div className="text-sm font-medium text-slate-800">{getLabel(option)}</div>
              {getSubLabel && getSubLabel(option) && (
                <div className="text-xs text-slate-500">{getSubLabel(option)}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {open && searched && options.length === 0 && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg px-3 py-2 text-sm text-slate-500">
          Nenhum resultado encontrado
        </div>
      )}
    </div>
  );
}