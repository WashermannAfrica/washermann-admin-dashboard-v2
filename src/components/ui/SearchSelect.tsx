'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import type { SelectOption } from './MultiSearchSelect';

interface Props {
  options: SelectOption[];
  /** Selected id, or '' for none. */
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  loading?: boolean;
}

/** Single-select searchable dropdown over a local option list (ids in, ids out). */
export function SearchSelect({ options, value, onChange, placeholder = 'Search…', loading }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const selected = useMemo(() => options.find((o) => o.id === value), [options, value]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return options
      .filter((o) => !s || o.label.toLowerCase().includes(s) || o.hint?.toLowerCase().includes(s))
      .slice(0, 60);
  }, [options, q]);

  return (
    <div ref={wrapRef} className="relative">
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
      <input
        type="text"
        disabled={loading}
        value={open ? q : selected ? (selected.hint ? `${selected.label} · ${selected.hint}` : selected.label) : ''}
        placeholder={loading ? 'Loading…' : placeholder}
        onFocus={() => {
          setQ('');
          setOpen(true);
        }}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm text-ink outline-none focus:border-primary disabled:opacity-60"
      />
      {open && !loading && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-line bg-white shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-center text-[12px] text-faint">No matches</p>
          ) : (
            filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-mint-soft"
              >
                <span className={o.id === value ? 'font-semibold text-forest' : 'text-ink'}>{o.label}</span>
                {o.hint && <span className="text-[11px] text-faint">{o.hint}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}