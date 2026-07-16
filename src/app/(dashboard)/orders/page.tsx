'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDateTime } from '@/lib/utils';
import type { Paginated } from '@/types';
import type { Order } from '@/types/ops';

const naira = (n: number | null) => `₦${Number(n ?? 0).toLocaleString()}`;
const TERMINAL = ['completed', 'cancelled', 'delivered'];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0">
      <span className="text-faint">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<Paginated<Order>>('/orders?limit=100')
      .then((res) => { setOrders(res.data.data); setTotal(res.data.meta.total); })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

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
    { key: 'reference', header: 'Reference', sortable: true, value: (o) => o.reference, render: (o) => <span className="font-mono text-xs text-ink">{o.reference}</span> },
    { key: 'customer', header: 'Customer', render: (o) => <span className="flex items-center gap-2.5 text-body"><Avatar name={o.customerId} size={26} /> {o.customerId.slice(0, 8)}…</span> },
    { key: 'service', header: 'Service', value: (o) => o.serviceType, render: (o) => <span className="capitalize text-body">{o.serviceType.replace('_', ' & ')}</span> },
    { key: 'amount', header: 'Amount', value: (o) => o.totalWP, render: (o) => <span className="text-ink">{o.totalWP} WP <span className="text-xs text-faint">({naira(o.nairaEquivalentSnapshot)})</span></span> },
    { key: 'status', header: 'Status', sortable: true, value: (o) => o.status, render: (o) => <Chip>{o.status.replace(/_/g, ' ')}</Chip> },
    { key: 'view', header: '', render: (o) => <span onClick={() => setSelected(o)} className="cursor-pointer font-medium text-ink underline-offset-2 hover:underline">View Detail</span> },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi icon={<ShoppingBag size={16} />} iconClass="bg-violet text-white" label="Total Orders" value={String(total)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Active" value={String(activeCount)} hint="In progress" />
        <StatBlock label="Completed" value={String(completedCount)} hint="Settled" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>
      ) : error ? (
        <p className="py-12 text-center text-sm text-danger">{error}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={orders}
          searchPlaceholder="Search by reference"
          filters={[{ label: 'Status', options: [] }, { label: 'Service', options: [] }]}
          pageSize={10}
          emptyText="No orders yet."
        />
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.reference} wide>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Chip>{selected.status.replace(/_/g, ' ')}</Chip>
              <span className="text-sm text-faint">{formatDateTime(selected.createdAt)}</span>
            </div>
            <div className="rounded-2xl bg-section p-4">
              <Row label="Service" value={<span className="capitalize">{selected.serviceType.replace('_', ' & ')}</span>} />
              <Row label="Total" value={`${selected.totalWP} WP · ${naira(selected.nairaEquivalentSnapshot)}`} />
              <Row label="Vendor share" value={`${selected.vendorShareWP} WP`} />
              <Row label="Rep share" value={`${selected.repShareWP} WP`} />
              <Row label="Platform share" value={`${selected.platformShareWP} WP`} />
              <Row label="Scheduled pickup" value={selected.scheduledPickupAt ? formatDateTime(selected.scheduledPickupAt) : '—'} />
              <Row label="Customer" value={<span className="font-mono text-xs">{selected.customerId}</span>} />
              <Row label="Vendor" value={<span className="font-mono text-xs">{selected.vendorId ?? '—'}</span>} />
              <Row label="Rep" value={<span className="font-mono text-xs">{selected.repId ?? '—'}</span>} />
            </div>
            {!TERMINAL.includes(selected.status) && (
              <Button className="w-full" loading={busy} onClick={() => complete(selected)}>
                <Check size={16} /> Force-complete order
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
