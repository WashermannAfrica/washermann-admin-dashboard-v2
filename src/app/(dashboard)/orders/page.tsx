'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShoppingBag, Check, X, Plus } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip, statusTone } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { ApiResponse, Paginated } from '@/types';
import type { Order, OrderTimelineEntry } from '@/types/ops';

const naira = (n: number | null) => `₦${Number(n ?? 0).toLocaleString()}`;
const pretty = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const TERMINAL = ['completed', 'cancelled', 'delivered'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<OrderTimelineEntry[]>([]);
  const [busy, setBusy] = useState(false);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ by: string; dir: 'ASC' | 'DESC' } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [service, setService] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (service) params.set('serviceType', service);
    if (sort) { params.set('sortBy', sort.by); params.set('sortDir', sort.dir); }
    api
      .get<Paginated<Order>>(`/orders?${params.toString()}`)
      .then((res) => { setOrders(res.data.data); setTotal(res.data.meta.total); })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, [search, page, status, service, sort]);

  useEffect(load, [load]);

  // Load the status-history timeline whenever a drawer opens.
  useEffect(() => {
    if (!selected) { setTimeline([]); return; }
    api
      .get<ApiResponse<OrderTimelineEntry[]>>(`/orders/${selected.id}/history`)
      .then((res) => setTimeline(Array.isArray(res.data.data) ? res.data.data : []))
      .catch(() => setTimeline([]));
  }, [selected]);

  async function complete(o: Order) {
    setBusy(true);
    try {
      await api.post(`/orders/${o.id}/admin/complete`);
      setSelected(null);
      load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setBusy(false);
    }
  }

  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const activeCount = orders.filter((o) => !TERMINAL.includes(o.status)).length;

  const columns: Column<Order>[] = [
    { key: 'reference', header: 'Tracking ID', sortable: true, value: (o) => o.reference, render: (o) => <span className="font-mono text-xs text-ink">{o.reference}</span> },
    {
      key: 'name', header: 'Name', value: (o) => o.customerName ?? '',
      render: (o) => (
        <span className="flex items-center gap-2.5 text-body">
          <Avatar name={o.customerName ?? o.customerId} size={26} />
          {o.customerName ?? `${o.customerId.slice(0, 8)}…`}
        </span>
      ),
    },
    { key: 'company', header: 'Company', value: (o) => o.companyName ?? '', render: (o) => <span className="text-body">{o.companyName ?? '—'}</span> },
    { key: 'amount', header: 'Amount', value: (o) => o.totalWP, render: (o) => <span className="text-ink">{o.totalWP} WP <span className="text-xs text-faint">({naira(o.nairaEquivalentSnapshot)})</span></span> },
    { key: 'date', header: 'Date', sortable: true, value: (o) => o.createdAt, render: (o) => <span className="text-body">{formatDate(o.createdAt)}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (o) => o.status, render: (o) => <Chip tone={statusTone(o.status)}>{pretty(o.status)}</Chip> },
    { key: 'view', header: '', render: (o) => <span onClick={() => setSelected(o)} className="cursor-pointer font-medium text-primary underline-offset-2 hover:underline">View Detail</span> },
  ];

  const items = selected?.pricingSnapshot?.lineItems ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi icon={<ShoppingBag size={16} />} iconClass="bg-violet text-white" label="Total Orders" value={String(total)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Active" value={String(activeCount)} hint="In progress" />
        <StatBlock label="Completed" value={String(completedCount)} hint="Settled" />
      </div>

      {error ? (
        <p className="py-12 text-center text-sm text-danger">{error}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={orders}
          loading={loading}
          searchPlaceholder="Search by tracking ID"
          onSearch={(q) => { setSearch(q); setPage(1); }}
          serverPagination={{ page, pageSize: 20, total, onPageChange: setPage }}
          onSort={(by, dir) => { setSort({ by, dir: dir === 1 ? 'ASC' : 'DESC' }); setPage(1); }}
          onFilter={(label, v) => {
            if (label === 'Status') setStatus(v);
            if (label === 'Service') setService(v);
            setPage(1);
          }}
          filters={[
            { label: 'Status', options: ['paid', 'broadcasting_rep', 'rep_assigned', 'broadcasting_vendor', 'vendor_assigned', 'scheduled', 'picked_up', 'with_vendor', 'in_progress', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'disputed'] },
            { label: 'Service', options: ['wash_fold', 'wash_iron'] },
          ]}
          pageSize={10}
          emptyText="No orders yet."
        />
      )}

      {/* Order Details drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setSelected(null)}>
          <div
            className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-center justify-between px-6 pt-6">
              <h2 className="text-lg font-bold text-ink">Order Details</h2>
              <button onClick={() => setSelected(null)} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-faint hover:bg-section">
                <X size={16} />
              </button>
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="rounded-3xl border border-line p-5">
                {/* tracking + actions */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-faint">Tracking ID</p>
                    <p className="text-2xl font-extrabold tracking-tight text-primary">{selected.reference}</p>
                    <p className="mt-1 text-xs text-faint">{formatDateTime(selected.createdAt)}</p>
                  </div>
                  {!TERMINAL.includes(selected.status) && (
                    <Button size="sm" loading={busy} onClick={() => complete(selected)}>
                      <Plus size={14} /> Actions
                    </Button>
                  )}
                </div>

                {/* status / amount / wp */}
                <dl className="mt-4 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-faint">Status</dt>
                    <dd><Chip tone={statusTone(selected.status)}>{pretty(selected.status)}</Chip></dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-faint">Amount</dt>
                    <dd className="font-bold text-ink">{naira(selected.nairaEquivalentSnapshot)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-faint">WP Used</dt>
                    <dd className="font-bold text-ink">{selected.totalWP} pts</dd>
                  </div>
                </dl>

                <div className="my-4 border-t border-dashed border-line" />

                {/* user / company / area */}
                <dl className="space-y-2.5 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-faint">User</dt>
                    <dd className="text-right font-medium text-ink">
                      {selected.customerName ?? '—'}
                      {selected.customerEmail && <span className="text-faint"> ({selected.customerEmail})</span>}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-faint">Company</dt>
                    <dd className="font-medium text-ink">{selected.companyName ?? '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-faint">Area</dt>
                    <dd className="font-medium text-ink">{selected.areaName ?? '—'}</dd>
                  </div>
                </dl>

                <div className="my-4 border-t border-dashed border-line" />

                {/* pickup / delivery */}
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-2 text-faint"><span className="h-2.5 w-2.5 rounded-full border-2 border-primary" /> Pickup</span>
                    <span className="text-right font-medium text-ink">{selected.pickupAddress ?? '—'}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-2 text-faint"><span className="h-2.5 w-2.5 rounded-full border-2 border-primary bg-primary" /> Delivery</span>
                    <span className="text-right font-medium text-ink">{selected.pickupAddress ?? '—'}</span>
                  </div>
                </div>

                {/* order items */}
                {items.length > 0 && (
                  <div className="mt-4 rounded-2xl bg-section p-4">
                    <p className="text-sm font-bold text-ink">Order Items</p>
                    <div className="mt-2 space-y-2">
                      {items.map((it, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-body">{it.label}{it.qty ? ` × ${it.qty}` : ''}</span>
                          <span className="font-bold text-ink">{it.subtotalWP} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
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
                          <span className="text-xs text-faint">{formatDateTime(t.createdAt)}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* footer */}
            <div className="flex gap-3 border-t border-line px-6 py-4">
              <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>Close</Button>
              {!TERMINAL.includes(selected.status) && (
                <Button className="flex-1" loading={busy} onClick={() => complete(selected)}>
                  <Check size={16} /> Force-complete
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
