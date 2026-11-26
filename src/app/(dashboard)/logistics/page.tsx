'use client';

import { useCallback, useEffect, useState } from 'react';
import { Route, X, Copy, Check, MapPin, Phone } from 'lucide-react';
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

// Stages from which a leg may still be cancelled (mirrors the backend state machine —
// cancellable up to and including `scheduled`, never once picked up).
const CANCELLABLE = ['pending_payment', 'paid', 'broadcasting_rep', 'rep_assigned', 'broadcasting_vendor', 'vendor_assigned', 'scheduled'];

const mapsLink = (lat?: number | null, lng?: number | null) =>
  lat != null && lng != null ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null;

type Stop = {
  role: 'Vendor' | 'Customer';
  name: string;
  phone: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

/**
 * Resolve a leg's two physical ends in travel order (pickup → drop-off). A delivery
 * runs vendor → customer; a collect runs customer → vendor. The customer end always
 * comes from the recipient record; the vendor end's coordinates are the pickup point
 * for a delivery and the drop-off point for a collect.
 */
function legEnds(o: Order): { pickup: Stop; dropoff: Stop } {
  const isCollect = o.flow === 'logistics_collect';
  const vendor: Stop = {
    role: 'Vendor',
    name: o.vendorName ?? 'Vendor',
    phone: o.vendorPhone ?? null,
    address: null, // vendors have no street address on file — the map pin is the locator
    lat: isCollect ? o.dropoffLatitude ?? null : o.pickupLatitude ?? null,
    lng: isCollect ? o.dropoffLongitude ?? null : o.pickupLongitude ?? null,
  };
  const customer: Stop = {
    role: 'Customer',
    name: o.recipient?.name ?? 'Recipient',
    phone: o.recipient?.phone ?? null,
    address: o.recipient?.address ?? null,
    lat: o.recipient?.latitude ?? (isCollect ? o.pickupLatitude ?? null : o.dropoffLatitude ?? null),
    lng: o.recipient?.longitude ?? (isCollect ? o.pickupLongitude ?? null : o.dropoffLongitude ?? null),
  };
  return isCollect ? { pickup: customer, dropoff: vendor } : { pickup: vendor, dropoff: customer };
}

/** Plain-text brief a rider can act on, built in travel order. */
function repBrief(o: Order): string {
  const { pickup, dropoff } = legEnds(o);
  const line = (s: Stop) => {
    const parts = [`${s.role}: ${s.name}`];
    if (s.phone) parts.push(`Tel: ${s.phone}`);
    if (s.address) parts.push(s.address);
    const link = mapsLink(s.lat, s.lng);
    if (link) parts.push(`Map: ${link}`);
    return parts.join('\n');
  };
  const out = [
    `${o.reference} — ${prettyFlow(o.flow)}`,
    `Status: ${pretty(o.status)}`,
    '',
    `PICK UP\n${line(pickup)}`,
    '',
    `DROP OFF\n${line(dropoff)}`,
  ];
  if (o.specialInstructions) out.push('', `Notes: ${o.specialInstructions}`);
  if (o.scheduledPickupAt) out.push('', `Scheduled: ${formatDateTime(o.scheduledPickupAt)}`);
  return out.join('\n');
}

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
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);

  // Status-action modals
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

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
  const refresh = useCallback(async (id: string) => {
    const [d, h] = await Promise.all([
      api.get<ApiResponse<Order>>(`/orders/${id}`),
      api.get<ApiResponse<OrderTimelineEntry[]>>(`/orders/${id}/history`),
    ]);
    setSelected(d.data.data);
    setTimeline(Array.isArray(h.data.data) ? h.data.data : []);
  }, []);

  async function open(o: Order) {
    try {
      await refresh(o.id);
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
      await refresh(selected.id);
      load();
    } catch (e) {
      setError(apiErr(e));
    } finally {
      setBusy(false);
    }
  }

  // Guarded leg-status actions (admin). Each stays on the backend's lifecycle path.
  async function runAction(fn: () => Promise<unknown>, onDone?: () => void) {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      await fn();
      onDone?.();
      await refresh(selected.id);
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

  const st = selected?.status ?? '';
  const needsRep = !!selected && (['paid', 'broadcasting_rep'].includes(st) || !selected.repName);
  const canPickup = st === 'scheduled';
  const canDeliver = st === 'picked_up';
  const canCancel = CANCELLABLE.includes(st);
  const ends = selected ? legEnds(selected) : null;

  function copyBrief() {
    if (!selected) return;
    navigator.clipboard?.writeText(repBrief(selected));
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 1600);
  }

  return (
    <Section>
      <div className="mb-1 flex items-center gap-2">
        <Route size={18} className="text-primary" />
        <h1 className="text-lg font-bold text-ink">Logistics</h1>
      </div>
      <p className="mb-4 text-sm text-faint">Rep-only mobility jobs (deliveries &amp; collections). Open a job to copy a rider brief, assign a rep, and move it through pickup &amp; delivery.</p>

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
      {selected && ends && (
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
                  <div className="flex items-start justify-between gap-3"><dt className="text-faint">Wash-rep</dt><dd className="text-right font-medium text-ink">{selected.repName ?? '—'}{selected.repPhone && <span className="text-faint"> ({selected.repPhone})</span>}</dd></div>
                </dl>

                {/* ── Rider brief: the two stops in travel order, with map pins ── */}
                <div className="my-4 border-t border-dashed border-line" />
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-ink">Rider brief</p>
                  <button
                    onClick={copyBrief}
                    className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-body hover:bg-section"
                  >
                    {copiedBrief ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy for rep</>}
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {([['Pick up', ends.pickup], ['Drop off', ends.dropoff]] as const).map(([label, stop]) => {
                    const link = mapsLink(stop.lat, stop.lng);
                    return (
                      <div key={label} className="rounded-2xl border border-line p-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">{label} · {stop.role}</p>
                        <p className="mt-0.5 font-semibold text-ink">{stop.name}</p>
                        {stop.address && <p className="mt-0.5 text-sm text-body">{stop.address}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                          {stop.phone ? (
                            <a href={`tel:${stop.phone}`} className="flex items-center gap-1.5 font-medium text-primary hover:underline">
                              <Phone size={13} /> {stop.phone}
                            </a>
                          ) : (
                            <span className="flex items-center gap-1.5 text-faint"><Phone size={13} /> No phone</span>
                          )}
                          {link && (
                            <a href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-medium text-primary hover:underline">
                              <MapPin size={13} /> Open in Maps
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selected.specialInstructions && (
                  <div className="mt-3 rounded-2xl bg-section p-3.5 text-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">Notes</p>
                    <p className="mt-0.5 text-body">{selected.specialInstructions}</p>
                  </div>
                )}

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
                      onClick={() => { navigator.clipboard?.writeText(selected.trackingToken ?? ''); setCopiedToken(true); setTimeout(() => setCopiedToken(false), 1500); }}
                      className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-body hover:bg-section"
                    >
                      {copiedToken ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
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
                        <span>
                          <span className="block text-sm font-semibold text-ink">{pretty(t.toStatus)}</span>
                          <span className="text-xs text-faint">{formatDateTime(t.createdAt)}{t.triggeredByRole && <> · {pretty(t.triggeredByRole)}</>}</span>
                          {t.note && <span className="mt-0.5 block text-xs text-body">{t.note}</span>}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* footer actions — guarded to the leg's current stage */}
            <div className="flex flex-wrap gap-3 border-t border-line px-6 py-4">
              <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>Close</Button>
              {needsRep && (
                <Button className="flex-1" onClick={() => { setRepId(''); setAssignOpen(true); }}>Assign Rep</Button>
              )}
              {canPickup && (
                <Button className="flex-1" loading={busy} onClick={() => runAction(() => api.post(`/logistics/${selected.id}/admin/picked-up`))}>
                  Mark picked up
                </Button>
              )}
              {canDeliver && (
                <Button className="flex-1" loading={busy} onClick={() => setDeliverOpen(true)}>Mark delivered</Button>
              )}
              {canCancel && (
                <Button variant="outline" className="flex-1 !border-danger !text-danger hover:!bg-danger-bg" onClick={() => { setCancelReason(''); setCancelOpen(true); }}>
                  Cancel job
                </Button>
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

      {/* Mark delivered — settles money, so confirm explicitly */}
      <Modal open={deliverOpen} onClose={() => setDeliverOpen(false)} title={`Mark delivered — ${selected?.reference ?? ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-body">
            This completes the leg and <span className="font-semibold text-ink">releases escrow</span> — the rep is paid the transport fee and the platform takes the mobility fee. Only do this once the clothes have actually been delivered.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeliverOpen(false)}>Back</Button>
            <Button className="flex-1" loading={busy} onClick={() => selected && runAction(() => api.post(`/logistics/${selected.id}/admin/delivered`), () => setDeliverOpen(false))}>
              Confirm delivered
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel job — refunds the payer if already paid */}
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title={`Cancel job — ${selected?.reference ?? ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-body">
            Cancels this leg and kills any live rep offer. If it was already paid, the payer is refunded and escrow is released. This can&apos;t be undone.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Reason <span className="text-faint">(optional)</span></label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. Rep unavailable; vendor rescheduled"
              className="w-full rounded-xl border border-line px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setCancelOpen(false)}>Back</Button>
            <Button
              className="flex-1 !bg-danger hover:!bg-danger"
              loading={busy}
              onClick={() => selected && runAction(() => api.post(`/logistics/${selected.id}/admin/cancel`, { reason: cancelReason.trim() || undefined }), () => setCancelOpen(false))}
            >
              Cancel this job
            </Button>
          </div>
        </div>
      </Modal>
    </Section>
  );
}
