'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface EntitySearchSelectProps<T> {
  label?: string;
  required?: boolean;
  /** List endpoint that accepts `?search=` and returns `{ data: T[] }`, e.g. '/vendors'. */
  endpoint: string;
  /** Extra query params merged into the request. */
  params?: Record<string, string | number>;
  getId: (row: T) => string;
  getLabel: (row: T) => string;
  getSub?: (row: T) => string | undefined;
  /** Selected id (controlled). */
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  minChars?: number;
}

export function EntitySearchSelect<T>({
  label,
  required,
  endpoint,
  params,
  getId,
  getLabel,
  getSub,
  value,
  onChange,
  placeholder = 'Start typing a name…',
  minChars = 2,
}: EntitySearchSelectProps<T>) {
  const [text, setText] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  // Serialize params so the effect re-runs when they actually change.
  const paramsKey = JSON.stringify(params ?? {});

  // Clear the display when the parent resets the value (e.g. after submit).
  useEffect(() => {
    if (!value) {
      setText('');
      setPicked(false);
    }
  }, [value]);

  // Debounced search.
  useEffect(() => {
    if (picked) return; // a selection is showing — don't search
    const q = text.trim();
    if (q.length < minChars) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get<{ data: T[] }>(endpoint, {
          params: { search: q, limit: 8, ...(params ?? {}) },
        });
        setResults(Array.isArray(res.data.data) ? res.data.data : []);
        setOpen(true);
      } catch {
        setResults([]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, endpoint, paramsKey, picked, minChars]);

  // Close the dropdown on an outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function select(row: T) {
    onChange(getId(row));
    setText(getLabel(row));
    setPicked(true);
    setOpen(false);
    setResults([]);
  }

  function clear() {
    onChange('');
    setText('');
    setPicked(false);
    setResults([]);
    setOpen(false);
  }

  const inputId = label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-2" ref={boxRef}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-ink">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-faint">
          {picked ? <Check size={16} className="text-primary" /> : <Search size={16} />}
        </span>
        <input
          id={inputId}
          value={text}
          autoComplete="off"
          onChange={(e) => {
            setText(e.target.value);
            if (picked) {
              setPicked(false);
              onChange('');
            }
          }}
          onFocus={() => { if (results.length) setOpen(true); }}
          placeholder={placeholder}
          className={cn(
            'h-12 w-full rounded-full bg-section pl-11 pr-11 text-sm text-ink',
            'placeholder:text-faint transition-shadow',
            'focus:outline-none focus:ring-2 focus:ring-primary/40',
            picked && 'ring-2 ring-primary/30',
          )}
        />
        {text && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear"
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-faint hover:bg-white hover:text-ink"
          >
            <X size={14} />
          </button>
        )}

        {open && !picked && (
          <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-line bg-white py-1 shadow-xl">
            {loading ? (
              <p className="px-4 py-3 text-sm text-faint">Searching…</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-faint">No matches.</p>
            ) : (
              results.map((row) => {
                const sub = getSub?.(row);
                return (
                  <button
                    key={getId(row)}
                    type="button"
                    onClick={() => select(row)}
                    className="flex w-full flex-col items-start gap-0.5 px-4 py-2 text-left transition-colors hover:bg-section"
                  >
                    <span className="text-sm font-medium text-ink">{getLabel(row)}</span>
                    {sub && <span className="text-xs text-faint">{sub}</span>}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
