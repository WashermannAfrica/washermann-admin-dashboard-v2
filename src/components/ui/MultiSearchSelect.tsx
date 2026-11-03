'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Check } from 'lucide-react';

export interface SelectOption {
  id: string;
  label: string;
  /** Secondary text, also searchable (e.g. the category an item belongs to). */
  hint?: string;
}

interface Props {
  label: string;
  options: SelectOption[];
  /** Selected ids. */
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  helper?: string;
  loading?: boolean;
}

/** Searchable multi-select. Stores ids, shows names as removable chips. */
export function MultiSearchSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Search…',
  helper,
  loading,
}: Props) {
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

  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return options
      .filter((o) => !s || o.label.toLowerCase().includes(s) || o.hint?.toLowerCase().includes(s))
      .slice(0, 60);
  }, [options, q]);

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div ref={wrapRef} className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        <span className="text-[11px] text-faint">
          {value.length === 0 ? 'None selected' : `${value.length} selected`}
        </span>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => {
            const o = byId.get(id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-md bg-mint-soft px-2 py-0.5 text-[11px] font-medium text-forest"
              >
                {o ? o.label : `Unknown (${id.slice(0, 8)}…)`}
                {o?.hint && <span className="font-normal opacity-70">· {o.hint}</span>}
                <button
                  type="button"
                  aria-label={`Remove ${o?.label ?? id}`}
                  onClick={() => toggle(id)}
                  className="rounded hover:bg-black/10"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input
          type="text"
          value={q}
          placeholder={loading ? 'Loading catalogue…' : placeholder}
          disabled={loading}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm text-ink outline-none focus:border-primary disabled:opacity-60"
        />
      </div>

      {open && !loading && (
        <div className="max-h-52 overflow-y-auto rounded-xl border border-line bg-white">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-center text-[12px] text-faint">No matches</p>
          ) : (
            filtered.map((o) => {
              const checked = value.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggle(o.id)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-mint-soft"
                >
                  <span className="flex flex-col">
                    <span className="text-ink">{o.label}</span>
                    {o.hint && <span className="text-[11px] text-faint">{o.hint}</span>}
                  </span>
                  {checked && <Check size={14} className="shrink-0 text-forest" />}
                </button>
              );
            })
          )}
        </div>
      )}

      {helper && <p className="text-[11px] text-faint">{helper}</p>}
    </div>
  );
}