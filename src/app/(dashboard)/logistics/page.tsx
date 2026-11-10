'use client';

import { useCallback, useEffect, useState } from 'react';
import { Route, X, Copy, Check } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip, statusTone } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EntitySearchSelect } from '@/components/ui/EntitySearchSelect';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDateTime } from '@/lib/utils';
import type { ApiResponse, Paginated } from '@/types';
import type { Order, OrderTimelineEntry } from '@/types/ops';

const pretty = (s?: string) => (s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—');
const prettyFlow = (f?: string) =>
  f === 'logistics_delivery' ? 'Delivery' : f === 'logistics_collect' ? 'Collect' : pretty(f);
const naira = (n?: number | null) => `₦${Number(n ?? 0).toLocaleString()}`;

type RepLite = { id: string; user?: { fullName?: string; email?: string }; fullName?: string; email?: string };
const repLabel = (r: RepLite) => r.user?.fullName ?? r.fullName ?? 'Unnamed rep';
const repSub = (r: RepLite) => r.user?.email ?? r.email ?? '';

const STATUSES = ['pending_payment', 'paid', 'broadcasting_rep', 'rep_assigned', 'scheduled', 'picked_up', 'out_for_delivery', 'delivered', 'completed', 'cancelled'];

export default function LogisticsPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [selected, setSelected] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<OrderTimelineEntry[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [repId, setRepId] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: '20' });
    // Default to both logistics flows; narrow to one when the Type filter is set.
    p.set('flow', typeFilter ?? 'logistics');
    if (search) p.set('search', search);
    if (status) p.set('status', status);
    if (dateFrom) p.set('from', dateFrom);
    if (dateTo) p.set('to', dateTo);
    api
      .get<Paginated<Order>>(`/orders?${p.toString()}`)
      .then((res) => { setRows(res.data.data); setTotal(res.data.meta.total); })
      .catch((e) => setError(apiErr(e)))
      .finally(() => setLoading(false));
  }, [page, search, status, typeFilter, dateFrom, dateTo]);

  useEffect(load, [load]);

  // Enriched detail (vendor/rep names, recipient, tracking) + timeline on open.
  async function open(o: Order) {
    try {
      const [d, h] = await Promise.all([
        api.get<ApiResponse<Order>>(`/orders/${o.id}`),
        api.get<ApiResponse<OrderTimelineEntry[]>>(`/orders/${o.id}/history`),
      ]);
      setSelected(d.data.data);
      setTimeline(Array.isArray(h.data.data) ? h.data.data : []);
    } catch (e) {
      setError(apiErr(e));
    }
  }

  async function assignRep() {
    if (!selected || !repId) return;
    setBusy(true);
    try {
      await api.post(`/assignment/orders/${selected.id}/assign/rep/${repId}`);
      setAssignOpen(false); setRepId('');
      await open(selected);
      load();
    } catch (e) {
      setError(apiErr(e));
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<Order>[] = [
    { key: 'reference', header: 'Job', sortable: true, value: (o) => o.reference, render: (o) => <button onClick={() => open(o)} className="font-mono text-xs font-semibold text-primary hover:underline">{o.reference}</button> },
    { key: 'type', header: 'Type', value: (o) => o.flow ?? '', render: (o) => <Chip tone="info">{prettyFlow(o.flow)}</Chip> },
    { key: 'by', header: 'Requested by', value: (o) => o.requesterType ?? '', render: (o) => <span className="text-body">{pretty(o.requesterType ?? undefined)}</span> },
    { key: 'recipient', header: 'Recipient', render: (o) => <span className="text-body">{o.recipient?.name ?? '—'}</span> },
    { key: 'area', header: 'Area', render: (o) => <span className="text-body">{o.areaName ?? '—'}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (o) => o.status, render: (o) => <Chip tone={statusTone(o.status)}>{pretty(o.status)}</Chip> },
    { key: 'created', header: 'Created', render: (o) => <span className="text-body">{formatDateTime(o.createdAt)}</span> },
  ];

  const needsRep = selected && ['paid', 'broadcasting_rep'].includes(selected.status) || (selected && !selected.repName);

  return (
    <Section>
      <div className="mb-1 flex items-center gap-2">
        <Route size={18} className="text-primary" />
        <h1 className="text-lg font-bold text-ink">Logistics</h1>
      </div>
      <p className="mb-4 text-sm text-faint">Rep-only mobility jobs (deliveries &amp; collections). Read-only oversight — view recipient, legs, tracking and status; assign a rep when needed.</p>

      {error && <p className="mb-3 rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search by job reference"
        onSearch={(q) => { setSearch(q); setPage(1); }}
        serverPagination={{ page, pageSize: 20, total, onPageChange: setPage }}
        onFilter={(label, v) => {
          if (label === 'Status') setStatus(v);
          if (label === 'Type') setTypeFilter(v);
          setPage(1);
        }}
        dateRange={{ field: (o) => o.createdAt, label: 'Created' }}
        onDateRange={(from, to) => { setDateFrom(from ?? ''); setDateTo(to ?? ''); setPage(1); }}
        filters={[
          { label: 'Status', options: STATUSES },
          { label: 'Type', options: ['logistics_delivery', 'logistics_collect'] },
        ]}
        pageSize={20}
        emptyText="No logistics jobs yet."
      />

      {/* detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setSelected(null)}>
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6">
              <h2 className="text-lg font-bold text-ink">Logistics Job</h2>
              <button onClick={() => setSelected(null)} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-faint hover:bg-section"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="rounded-3xl border border-line p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-faint">Reference</p>
                    <p className="text-2xl font-extrabold tracking-tight text-primary">{selected.reference}</p>
                    <p className="mt-1 text-xs text-faint">{formatDateTime(selected.createdAt)}</p>
                  </div>
                  <Chip tone="info">{prettyFlow(selected.flow)}</Chip>
                </div>

                <dl className="mt-4 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between"><dt className="text-faint">Status</dt><dd><Chip tone={statusTone(selected.status)}>{pretty(selected.status)}</Chip></dd></div>
                  <div className="flex items-center justify-between"><dt className="text-faint">Requested by</dt><dd className="font-medium text-ink">{pretty(selected.requesterType ?? undefined)}</dd></div>
                  <div className="flex items-center justify-between"><dt className="text-faint">Area</dt><dd className="font-medium text-ink">{selected.areaName ?? '—'}</dd></div>
                  <div className="flex items-start justify-between gap-3"><dt className="text-faint">Washerman</dt><dd className="text-right font-medium text-ink">{selected.vendorName ?? '—'}{selected.vendorPhone && <span className="text-faint"> ({selected.vendorPhone})</span>}</dd></div>
                  <div className="flex items-start justify-between gap-3"><dt className="text-faint">Wash-rep</dt><dd className="text-right font-medium text-ink">{selected.repName ?? '—'}{selected.repPhone && <span className="text-faint"> ({selected.repPhone})</span>}</dd></div>
                </dl>

                <div className="my-4 border-t border-dashed border-line" />

                {/* recipient */}
                <p className="text-sm font-bold text-ink">Recipient</p>
                <dl className="mt-2 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between"><dt className="text-faint">Name</dt><dd className="font-medium text-ink">{selected.recipient?.name ?? '—'}</dd></div>
                  <div className="flex items-center justify-between"><dt className="text-faint">Phone</dt><dd className="font-medium text-ink">{selected.recipient?.phone ?? '—'}</dd></div>
                  <div className="flex items-start justify-between gap-3"><dt className="text-faint">Address</dt><dd className="text-right font-medium text-ink">{selected.recipient?.address ?? selected.pickupAddress ?? '—'}</dd></div>
                </dl>

                {/* fees */}
                <div className="mt-4 rounded-2xl bg-section p-4">
                  <p className="text-sm font-bold text-ink">Fees (WP)</p>
                  <dl className="mt-2 space-y-1.5 text-sm">
                    {selected.mobilityFeeWp != null && <div className="flex items-center justify-between"><dt className="text-faint">Mobility fee</dt><dd className="font-medium text-ink">{selected.mobilityFeeWp} pts</dd></div>}
                    {selected.pricingSnapshot?.transportWP != null && <div className="flex items-center justify-between"><dt className="text-faint">Transport</dt><dd className="font-medium text-ink">{selected.pricingSnapshot.transportWP} pts</dd></div>}
                    <div className="mt-1 flex items-center justify-between border-t border-dashed border-line pt-1.5"><dt className="font-semibold text-ink">Total</dt><dd className="font-bold text-ink">{selected.totalWP} pts {selected.nairaEquivalentSnapshot != null && <span className="text-faint">({naira(selected.nairaEquivalentSnapshot)})</span>}</dd></div>
                  </dl>
                </div>

                {/* tracking */}
                {selected.trackingToken && (
                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-line p-3 text-sm">
                    <div><p className="text-xs text-faint">Tracking token</p><p className="font-mono text-ink">{selected.trackingToken}</p></div>
                    <button
                      onClick={() => { navigator.clipboard?.writeText(selected.trackingToken ?? ''); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                      className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-body hover:bg-section"
                    >
                      {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                    </button>
                  </div>
                )}

                {selected.parentOrderId && (
                  <p className="mt-3 text-xs text-faint">Round-trip leg of order <span className="font-mono">{selected.parentOrderId}</span>.</p>
                )}

                {/* timeline */}
                <div className="mt-5">
                  <p className="text-sm font-bold text-ink">Timeline</p>
                  <ol className="mt-3 space-y-4">
                    {timeline.length === 0 && <li className="text-xs text-faint">No history yet.</li>}
                    {timeline.map((t, i) => (
                      <li key={t.id} className="flex gap-3">
                        <span className="relative flex flex-col items-center">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"><Check size={12} strokeWidth={3} /></span>
                          {i < timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
                        </span>
                        <span><span className="block text-sm font-semibold text-ink">{pretty(t.toStatus)}</span><span className="text-xs text-faint">{formatDateTime(t.createdAt)}</span></span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-line px-6 py-4">
              <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>Close</Button>
              {needsRep && (
                <Button className="flex-1" onClick={() => { setRepId(''); setAssignOpen(true); }}>Assign Rep</Button>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title={`Assign Rep — ${selected?.reference ?? ''}`}>
        <div className="space-y-4">
          <EntitySearchSelect<RepLite>
            label="Rep"
            required
            endpoint="/reps"
            value={repId}
            onChange={setRepId}
            getId={(r) => r.id}
            getLabel={repLabel}
            getSub={repSub}
            placeholder="Search by rep name…"
          />
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={busy} disabled={!repId} onClick={assignRep}>Assign Rep</Button>
          </div>
        </div>
      </Modal>
    </Section>
  );
}
