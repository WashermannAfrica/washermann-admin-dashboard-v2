'use client';

import { useCallback, useEffect, useState } from 'react';
import { ScrollText, X, User2, CheckCircle2, XCircle } from 'lucide-react';
import { PageKpi } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDateTime } from '@/lib/utils';
import type { ApiResponse, Paginated } from '@/types';
import type { AuditLogEntry, AuditFilterOptions } from '@/types/ops';

const pretty = (s: string) => s.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const APP_TONE: Record<string, 'blue' | 'info' | 'success' | 'neutral' | 'warning'> = {
  admin: 'info', vendor: 'blue', rep: 'success', company: 'warning', web: 'neutral', mobile: 'neutral', api: 'neutral', system: 'neutral',
};

export default function AuditLogPage() {
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [opts, setOpts] = useState<AuditFilterOptions | null>(null);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [app, setApp] = useState<string | null>(null);
  const [actorType, setActorType] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [actorId, setActorId] = useState<{ id: string; name: string } | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    api.get<ApiResponse<AuditFilterOptions>>('/audit-logs/filters').then((r) => setOpts(r.data.data)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: '25' });
    if (search) p.set('search', search);
    if (app) p.set('app', app);
    if (actorType) p.set('actorType', actorType);
    if (category) p.set('category', category);
    if (action) p.set('action', action);
    if (status) p.set('success', status === 'Success' ? 'true' : 'false');
    if (actorId) p.set('actorId', actorId.id);
    if (from) p.set('from', new Date(from).toISOString());
    if (to) p.set('to', new Date(to + 'T23:59:59').toISOString());
    api
      .get<Paginated<AuditLogEntry>>(`/audit-logs?${p.toString()}`)
      .then((res) => { setRows(res.data.data); setTotal(res.data.meta.total); })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, [page, search, app, actorType, category, action, status, actorId, from, to]);

  useEffect(load, [load]);

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'createdAt', header: 'When', value: (r) => r.createdAt,
      render: (r) => <span className="whitespace-nowrap text-xs text-body">{formatDateTime(r.createdAt)}</span>,
    },
    {
      key: 'actor', header: 'Who', value: (r) => r.actorName ?? r.actorType,
      render: (r) => (
        <button
          onClick={() => { if (r.actorId) { setActorId({ id: r.actorId, name: r.actorName ?? 'this person' }); setPage(1); } }}
          className="flex items-center gap-2 text-left"
          title={r.actorId ? 'Filter to this person' : undefined}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-section text-faint"><User2 size={13} /></span>
          <span>
            <span className="block text-[13px] font-medium text-ink hover:underline">{r.actorName ?? '—'}</span>
            <span className="text-[11px] text-faint">{pretty(r.actorType)}</span>
          </span>
        </button>
      ),
    },
    {
      key: 'description', header: 'What happened', className: 'max-w-md',
      render: (r) => (
        <span onClick={() => setSelected(r)} className="block cursor-pointer text-[13px] text-ink hover:text-primary">
          {r.description}
        </span>
      ),
    },
    { key: 'app', header: 'App', value: (r) => r.app, render: (r) => <Badge variant={APP_TONE[r.app] ?? 'neutral'}>{pretty(r.app)}</Badge> },
    { key: 'category', header: 'Category', value: (r) => r.category, render: (r) => <Chip>{pretty(r.category)}</Chip> },
    {
      key: 'status', header: 'Status', value: (r) => (r.success ? 'ok' : 'failed'),
      render: (r) => r.success
        ? <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 size={13} /> {r.statusCode ?? 'OK'}</span>
        : <span className="inline-flex items-center gap-1 text-xs text-danger"><XCircle size={13} /> {r.statusCode ?? 'Failed'}</span>,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi icon={<ScrollText size={16} />} iconClass="bg-ink text-white" label="Audit Log" value={String(total)} />

      {/* Date range + active person chip */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-faint">From
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="mt-1 block h-9 rounded-xl border border-line bg-white px-3 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </label>
        <label className="text-xs text-faint">To
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="mt-1 block h-9 rounded-xl border border-line bg-white px-3 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </label>
        {(from || to) && (
          <button onClick={() => { setFrom(''); setTo(''); setPage(1); }} className="h-9 text-[13px] text-primary hover:underline">Clear dates</button>
        )}
        {actorId && (
          <span className="flex h-9 items-center gap-2 rounded-full border border-primary bg-mint-soft px-3 text-[13px] text-forest">
            Person: {actorId.name}
            <button onClick={() => { setActorId(null); setPage(1); }}><X size={14} /></button>
          </span>
        )}
      </div>

      {error ? (
        <p className="py-12 text-center text-sm text-danger">{error}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          searchPlaceholder="Search description, person, target…"
          onSearch={(q) => { setSearch(q); setPage(1); }}
          serverPagination={{ page, pageSize: 25, total, onPageChange: setPage }}
          onFilter={(label, v) => {
            if (label === 'App') setApp(v);
            if (label === 'User Type') setActorType(v);
            if (label === 'Category') setCategory(v);
            if (label === 'Action') setAction(v);
            if (label === 'Status') setStatus(v);
            setPage(1);
          }}
          filters={[
            { label: 'App', options: opts?.apps ?? [] },
            { label: 'User Type', options: opts?.actorTypes ?? [] },
            { label: 'Category', options: opts?.categories ?? [] },
            { label: 'Action', options: opts?.actions ?? [] },
            { label: 'Status', options: ['Success', 'Failed'] },
          ]}
          pageSize={25}
          emptyText="No audit events match these filters."
        />
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setSelected(null)}>
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6">
              <h2 className="text-lg font-bold text-ink">Audit event</h2>
              <button onClick={() => setSelected(null)} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-faint hover:bg-section"><X size={16} /></button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4 text-sm">
              <p className="rounded-2xl bg-section p-4 text-ink">{selected.description}</p>
              <dl className="space-y-2">
                {[
                  ['When', formatDateTime(selected.createdAt)],
                  ['Who', `${selected.actorName ?? '—'} (${pretty(selected.actorType)})`],
                  ['App', pretty(selected.app)],
                  ['Action', selected.action],
                  ['Category', pretty(selected.category)],
                  ['Target', selected.targetLabel ?? ([selected.targetType, selected.targetId].filter(Boolean).join(' ') || '—')],
                  ['Request', [selected.method, selected.path].filter(Boolean).join(' ') || '—'],
                  ['Status', `${selected.success ? 'Success' : 'Failed'}${selected.statusCode ? ` · ${selected.statusCode}` : ''}`],
                  ['IP', selected.ip ?? '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-3 border-b border-dashed border-line pb-2">
                    <dt className="text-faint">{k}</dt>
                    <dd className="max-w-[60%] break-words text-right font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              {selected.metadata && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">Details</p>
                  <pre className="overflow-x-auto rounded-2xl bg-ink p-3 text-[11px] leading-relaxed text-white">{JSON.stringify(selected.metadata, null, 2)}</pre>
                </div>
              )}
              {selected.userAgent && <p className="text-[11px] text-faint">{selected.userAgent}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
