'use client';

import { useMemo, useState } from 'react';
import { Search, ChevronDown, Download, ArrowLeft, ArrowRight, ArrowDownUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Section, Panel } from './Section';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render: (row: T) => React.ReactNode;
  /** string accessor used for search + sort + filter + export; defaults to row[key] */
  value?: (row: T) => string | number;
}

interface FilterDef {
  label: string;
  /** column key this filter applies to; defaults to label.toLowerCase() */
  key?: string;
  /** explicit options; if omitted they are derived from the data */
  options?: string[];
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  searchPlaceholder?: string;
  filters?: FilterDef[];
  pageSize?: number;
  onExport?: boolean;
  exportName?: string;
  headerExtra?: React.ReactNode;
  bare?: boolean;
  emptyText?: string;
}

function FilterPill({
  def,
  active,
  options,
  onSelect,
}: {
  def: FilterDef;
  active: string | null;
  options: string[];
  onSelect: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-full border px-4 text-[13px] transition-colors',
          active ? 'border-primary bg-mint-soft text-forest' : 'border-line bg-white text-body hover:bg-section',
        )}
      >
        {active ?? def.label}
        <ChevronDown size={14} className={active ? 'text-forest' : 'text-faint'} />
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <span className="absolute left-0 z-40 mt-1 max-h-64 w-48 overflow-y-auto rounded-2xl border border-line bg-white py-1 shadow-xl">
            <button
              onClick={() => { onSelect(null); setOpen(false); }}
              className="flex w-full items-center justify-between px-4 py-2 text-left text-[13px] text-body hover:bg-section"
            >
              All {def.label}
              {active === null && <Check size={14} className="text-forest" />}
            </button>
            {options.map((o) => (
              <button
                key={o}
                onClick={() => { onSelect(o); setOpen(false); }}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-[13px] text-ink hover:bg-section"
              >
                <span className="capitalize">{o}</span>
                {active === o && <Check size={14} className="text-forest" />}
              </button>
            ))}
            {options.length === 0 && <span className="block px-4 py-2 text-xs text-faint">No options</span>}
          </span>
        </>
      )}
    </span>
  );
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  searchPlaceholder = 'Search',
  filters = [{ label: 'Status' }, { label: 'Date' }],
  pageSize = 10,
  onExport = true,
  exportName = 'washermann-export',
  headerExtra,
  bare = false,
  emptyText = 'Nothing here yet.',
}: DataTableProps<T>) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [active, setActive] = useState<Record<string, string | null>>({});

  // resolve which column a filter maps to
  function colFor(def: FilterDef): Column<T> | undefined {
    const key = (def.key ?? def.label).toLowerCase();
    return columns.find((c) => c.key.toLowerCase() === key || c.header.toLowerCase() === key);
  }
  function cellText(c: Column<T> | undefined, r: T): string {
    if (!c) return '';
    return String(c.value ? c.value(r) : (r[c.key] ?? ''));
  }

  // derive options per filter from data
  const filterOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const def of filters) {
      if (def.options?.length) { map[def.label] = def.options; continue; }
      const c = colFor(def);
      if (!c) { map[def.label] = []; continue; }
      map[def.label] = [...new Set(rows.map((r) => cellText(c, r)).filter(Boolean))].sort();
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, rows, columns]);

  const filtered = useMemo(() => {
    let out = rows;
    if (q.trim()) {
      const needle = q.toLowerCase();
      out = out.filter((r) =>
        columns.some((c) => cellText(c, r).toLowerCase().includes(needle)),
      );
    }
    for (const def of filters) {
      const val = active[def.label];
      if (!val) continue;
      const c = colFor(def);
      if (!c) continue;
      out = out.filter((r) => cellText(c, r) === val);
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col) {
        out = [...out].sort((a, b) => {
          const av = cellText(col, a), bv = cellText(col, b);
          return (av < bv ? -1 : av > bv ? 1 : 0) * sortDir;
        });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, sortKey, sortDir, active, filters, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const slice = filtered.slice((current - 1) * pageSize, current * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(1); }
  }

  function exportCSV() {
    const cols = columns.filter((c) => c.header.trim());
    const head = cols.map((c) => `"${c.header}"`).join(',');
    const body = filtered
      .map((r) => cols.map((c) => `"${cellText(c, r).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([head + '\n' + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${exportName}.csv`;
    a.click();
  }

  const body = (
    <>
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder={searchPlaceholder}
            className="h-9 w-52 rounded-full border border-line bg-white pl-10 pr-4 text-[13px] placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {filters.map((f) => (
          <FilterPill
            key={f.label}
            def={f}
            active={active[f.label] ?? null}
            options={filterOptions[f.label] ?? []}
            onSelect={(v) => { setActive((a) => ({ ...a, [f.label]: v })); setPage(1); }}
          />
        ))}
        <div className="ml-auto flex items-center gap-2">
          {headerExtra}
          {onExport && (
            <button
              onClick={exportCSV}
              className="flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-medium text-white hover:bg-black transition-colors"
            >
              <Download size={14} /> Export
            </button>
          )}
        </div>
      </div>

      {/* table */}
      <Panel className="p-0 overflow-hidden">
        <div className="overflow-x-auto p-3">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-section">
                {columns.map((c, i) => (
                  <th
                    key={c.key}
                    onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                    className={cn(
                      'px-4 py-2.5 font-medium text-body whitespace-nowrap select-none',
                      i === 0 && 'rounded-l-xl',
                      i === columns.length - 1 && 'rounded-r-xl',
                      c.sortable && 'cursor-pointer hover:text-ink',
                      c.className,
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.header}
                      {c.sortable && <ArrowDownUp size={12} className="text-faint" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 && (
                <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-faint">{emptyText}</td></tr>
              )}
              {slice.map((row, ri) => (
                <tr key={ri} className="border-b border-line/70 last:border-0 hover:bg-page transition-colors">
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-4 py-3.5 whitespace-nowrap', c.className)}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current === 1}
            className="flex items-center gap-1.5 text-[13px] text-body hover:text-ink disabled:opacity-40"
          >
            <ArrowLeft size={14} /> Previous
          </button>
          <div className="flex items-center gap-1">
            {pageNumbers(current, pages).map((n, i) =>
              n === '…' ? (
                <span key={`e${i}`} className="px-1.5 text-faint text-[13px]">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n as number)}
                  className={cn(
                    'h-8 w-8 rounded-lg text-[13px] transition-colors',
                    n === current ? 'bg-mint-soft font-semibold text-forest' : 'text-body hover:bg-section',
                  )}
                >
                  {n}
                </button>
              ),
            )}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={current === pages}
            className="flex items-center gap-1.5 text-[13px] text-body hover:text-ink disabled:opacity-40"
          >
            Next <ArrowRight size={14} />
          </button>
        </div>
      </Panel>
    </>
  );

  if (bare) return body;
  return <Section>{body}</Section>;
}

function pageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, '…', total - 2, total - 1, total];
  if (current >= total - 2) return [1, 2, 3, '…', total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}
