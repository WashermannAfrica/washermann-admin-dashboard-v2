'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown, Download, ArrowLeft, ArrowRight, ArrowDownUp, Check, Loader2 } from 'lucide-react';
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
  /**
   * When provided, the search box drives SERVER-SIDE search: the value is
   * debounced and passed to this callback (the parent refetches with it), and
   * client-side text filtering is skipped so results beyond the loaded page are
   * not hidden. Omit for the default fully client-side behaviour.
   */
  onSearch?: (q: string) => void;
  /**
   * When provided, pagination is SERVER-SIDE: `rows` is treated as the current
   * page (rendered as-is, not client-sliced), and the footer drives
   * `onPageChange` using the server's `total`/`page`/`pageSize`. Omit for the
   * default client-side pagination over all `rows`.
   * (Sort/filters still operate over the loaded page only.)
   */
  serverPagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  /** When set, column sorting is server-side: the parent refetches sorted.
   *  `key` is the column key; `dir` is 1 (asc) or -1 (desc). */
  onSort?: (key: string, dir: 1 | -1) => void;
  /** When set, filter pills are server-side: the parent refetches filtered.
   *  Provide explicit `options` on each filter def (data is only one page). */
  onFilter?: (label: string, value: string | null) => void;
  /** Subtle in-place "updating" state for server refetches (search/sort/filter/
   *  page). Keeps the toolbar + table mounted (and the search box focused);
   *  just dims the rows and shows a small spinner. Use this instead of swapping
   *  the whole table for a full-page spinner on every keystroke. */
  loading?: boolean;
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
  onSearch,
  serverPagination,
  onSort,
  onFilter,
  loading = false,
}: DataTableProps<T>) {
  const serverMode = !!serverPagination;
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  // Server-side search: debounce the input and hand it to the parent, which
  // refetches. Client text-filtering is then skipped (see `filtered`).
  //
  // NB: depend ONLY on `q`. Parents pass an inline `onSearch` (new identity each
  // render), so keying the effect on it would re-fire on every parent re-render
  // — e.g. after clicking "Next", the parent re-renders, this fired, and calling
  // onSearch('') reset the page back to 1. We call the latest onSearch via a ref
  // and skip the initial mount (the parent's first load already has no search).
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  const searchMounted = useRef(false);
  useEffect(() => {
    if (!onSearchRef.current) return;
    if (!searchMounted.current) { searchMounted.current = true; return; }
    const t = setTimeout(() => onSearchRef.current?.(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
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
    // Client-side text filter — skipped in server-search mode (parent already
    // filtered), so matches outside the loaded page aren't hidden.
    if (!onSearch && q.trim()) {
      const needle = q.toLowerCase();
      out = out.filter((r) =>
        columns.some((c) => cellText(c, r).toLowerCase().includes(needle)),
      );
    }
    // Client-side filters — skipped in server-filter mode.
    if (!onFilter) {
      for (const def of filters) {
        const val = active[def.label];
        if (!val) continue;
        const c = colFor(def);
        if (!c) continue;
        out = out.filter((r) => cellText(c, r) === val);
      }
    }
    // Client-side sort — skipped in server-sort mode.
    if (!onSort && sortKey) {
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

  const pages = serverMode
    ? Math.max(1, Math.ceil(serverPagination!.total / serverPagination!.pageSize))
    : Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = serverMode ? serverPagination!.page : Math.min(page, pages);
  // Server mode: rows are already the current page — render as-is (still
  // client-sorted/filtered over that page). Client mode: slice locally.
  const slice = serverMode ? filtered : filtered.slice((current - 1) * pageSize, current * pageSize);

  function goTo(n: number) {
    const clamped = Math.min(Math.max(1, n), pages);
    if (serverMode) serverPagination!.onPageChange(clamped);
    else setPage(clamped);
  }

  function toggleSort(key: string) {
    const nextDir: 1 | -1 = sortKey === key && sortDir === 1 ? -1 : 1;
    setSortKey(key);
    setSortDir(nextDir);
    onSort?.(key, nextDir);
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
            className="h-9 w-52 rounded-full border border-line bg-white pl-10 pr-9 text-[13px] placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {loading && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" />}
        </div>
        {filters.map((f) => (
          <FilterPill
            key={f.label}
            def={f}
            active={active[f.label] ?? null}
            options={filterOptions[f.label] ?? []}
            onSelect={(v) => { setActive((a) => ({ ...a, [f.label]: v })); setPage(1); onFilter?.(f.label, v); }}
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
        <div className={cn('overflow-x-auto p-3 transition-opacity', loading && 'pointer-events-none opacity-50')} aria-busy={loading}>
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
                <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-faint">{loading ? 'Loading…' : emptyText}</td></tr>
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
            onClick={() => goTo(current - 1)}
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
                  onClick={() => goTo(n as number)}
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
            onClick={() => goTo(current + 1)}
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
