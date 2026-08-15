'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TriangleAlert, Banknote } from 'lucide-react';
import { EntityHero, HeroTabs } from '@/components/ui/EntityHero';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { ConfirmModal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import type { Paginated } from '@/types';
import type { Rep, Area } from '@/types/ops';

interface OrderRow {
  id: string;
  trackingId?: string;
  status?: string;
  totalWP?: number;
  createdAt?: string;
  [k: string]: unknown;
}

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');
const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export default function RepDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [rep, setRep] = useState<Rep | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Orders');
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!params.id) return;
    setLoading(true);
    Promise.all([
      api.get<{ data?: Rep }>(`/reps/${params.id}`),
      api.get<Paginated<OrderRow>>(`/orders?repId=${params.id}&limit=50`).catch(() => ({ data: { data: [] } })),
      api.get<Paginated<Area>>('/areas?limit=100').catch(() => ({ data: { data: [] } })),
    ])
      .then(([r, o, a]) => {
        setRep((r.data as { data?: Rep }).data ?? (r.data as unknown as Rep));
        setOrders((o.data as Paginated<OrderRow>).data ?? []);
        setAreas((a.data as Paginated<Area>).data ?? []);
        setError('');
      })
      .catch((e) => setError(e?.response?.data?.message ?? 'Could not load this rep.'))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(load, [load]);

  async function deactivate() {
    if (!rep) return;
    setBusy(true);
    try {
      const next = rep.status === 'suspended' ? 'active' : 'suspended';
      await api.patch(`/reps/${rep.id}`, { status: next });
      setDeactivateOpen(false);
      load();
    } catch {
      setDeactivateOpen(false);
    } finally {
      setBusy(false);
    }
  }

  const orderCols: Column<OrderRow>[] = [
    { key: 'trackingId', header: 'Tracking ID', render: (o) => <span className="text-body">{o.trackingId ?? o.id.slice(0, 8)}</span> },
    { key: 'amount', header: 'Amount', render: (o) => <span className="text-ink">{o.totalWP != null ? `${Number(o.totalWP).toLocaleString()} pts` : '—'}</span> },
    { key: 'date', header: 'Date', sortable: true, value: (o) => o.createdAt ?? '', render: (o) => <span className="text-body">{fmtDate(o.createdAt)}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (o) => o.status ?? '', render: (o) => <Chip>{cap(o.status)}</Chip> },
    { key: 'view', header: '', render: (o) => <button onClick={() => router.push(`/orders?focus=${o.id}`)} className="cursor-pointer font-medium text-ink underline-offset-2 hover:underline">View Detail</button> },
  ];

  if (loading) return <div className="flex justify-center py-24 text-primary"><Spinner size="lg" /></div>;
  if (error || !rep) return <p className="py-24 text-center text-sm text-danger">{error || 'Rep not found.'}</p>;

  const areaNames = rep.areaIds.map((id) => areas.find((a) => a.id === id)?.name).filter(Boolean).join(', ') || '—';

  return (
    <div className="mx-auto max-w-6xl">
      <EntityHero
        name={rep.user?.fullName ?? '—'}
        contact={[rep.user?.email, rep.user?.phone ?? rep.phone].filter(Boolean).join(', ')}
        chips={[cap(rep.status), rep.isAvailable ? 'Available' : 'Offline', ...(rep.flaggedForReview ? ['Flagged'] : [])]}
        onDeactivate={() => setDeactivateOpen(true)}
        infoRow={[
          { label: 'Area', value: areaNames },
          { label: 'Orders handled', value: String(orders.length) },
          { label: 'Rating', value: `${Number(rep.rating ?? 0).toFixed(1)} (${rep.ratingCount ?? 0})` },
          { label: 'Availability', value: rep.isAvailable ? 'On duty' : 'Off duty' },
        ]}
        tiles={[
          { label: 'Completed orders', value: String(orders.filter((o) => o.status === 'completed' || o.status === 'delivered').length), accent: true },
          { label: 'Total orders', value: String(orders.length) },
        ]}
      />

      {/* Payout account — captured when the rep requests a referral payout */}
      <div className="mt-4 rounded-2xl border border-line bg-white p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink"><Banknote size={16} /> Payout account</h2>
        {rep.accountNumber ? (
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-faint">Account name</dt>
              <dd className="text-sm font-medium text-ink">{rep.accountName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Account number</dt>
              <dd className="text-sm font-medium text-ink">{rep.accountNumber}</dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Bank code</dt>
              <dd className="text-sm font-medium text-ink">{rep.bankCode ?? '—'}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-faint">No payout account yet — set when the rep first requests a payout.</p>
        )}
      </div>

      <HeroTabs tabs={['Orders']} active={tab} onChange={setTab} />

      <div className="mt-4">
        {tab === 'Orders' && (
          <DataTable columns={orderCols} rows={orders} searchPlaceholder="Search by tracking ID" pageSize={8} emptyText="No orders for this rep yet." />
        )}
      </div>

      <ConfirmModal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={deactivate}
        icon={<TriangleAlert size={20} />}
        danger={rep.status !== 'suspended'}
        title={rep.status === 'suspended' ? `Reactivate ${rep.user?.fullName ?? 'rep'}?` : `Deactivate ${rep.user?.fullName ?? 'rep'}?`}
        body={
          rep.status === 'suspended'
            ? 'Reactivating this rep makes them eligible for assignments again.'
            : 'Deactivating this rep removes them from all assignments. Their order history and pending earnings remain intact.'
        }
        confirmLabel={rep.status === 'suspended' ? 'Reactivate' : 'Deactivate'}
      />
    </div>
  );
}
