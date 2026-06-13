'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';
import { EntityHero, HeroTabs } from '@/components/ui/EntityHero';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmModal } from '@/components/ui/Modal';
import { REPS, ORDERS, DISPUTES, Order, Dispute } from '@/lib/mock-data';

export default function RepDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const rep = REPS.find((r) => r.id === params.id) ?? REPS[0];
  const [tab, setTab] = useState('Orders');
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const orderCols: Column<Order>[] = [
    { key: 'trackingId', header: 'Tracking ID', render: (o) => <span className="text-body">{o.trackingId}</span> },
    {
      key: 'name', header: 'Name', sortable: true, value: (o) => o.name,
      render: (o) => (
        <span className="flex items-center gap-2.5 font-medium text-ink">
          <Avatar name={o.name} size={28} /> {o.name}
        </span>
      ),
    },
    { key: 'amount', header: 'Amount', render: (o) => <span className="text-ink">{o.amount}</span> },
    { key: 'date', header: 'Date', sortable: true, value: (o) => o.date, render: (o) => <span className="text-body">{o.date}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (o) => o.status, render: (o) => <Chip>{o.status}</Chip> },
    { key: 'view', header: '', render: () => <button onClick={() => router.push('/orders')} className="font-medium text-ink underline-offset-2 hover:underline cursor-pointer">View Detail</button> },
  ];

  const disputeCols: Column<Dispute>[] = [
    { key: 'id', header: 'Dispute ID', render: (d) => <span className="text-body">{d.id}</span> },
    { key: 'category', header: 'Category', render: (d) => <span className="font-medium text-ink">{d.category}</span> },
    { key: 'amount', header: 'Amount', render: (d) => <span className="text-ink">{d.amount}</span> },
    { key: 'date', header: 'Date', render: (d) => <span className="text-body">{d.date}</span> },
    { key: 'status', header: 'Status', render: (d) => <Chip>{d.status}</Chip> },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <EntityHero
        name={rep.name}
        contact={`${rep.email}, ${rep.phone}`}
        chips={[rep.status, 'Contract']}
        onDeactivate={() => setDeactivateOpen(true)}
        infoRow={[
          { label: 'Area', value: rep.area },
          { label: 'Pickups', value: String(rep.ordersHandled) },
          { label: 'Deliveries', value: (rep.ordersHandled * 2 - 8).toLocaleString() },
          { label: 'Rating', value: '4.7' },
          { label: 'Payment Type', value: 'Per order' },
        ]}
        tiles={[
          { label: 'Per-Order Fee', value: '₦184,500', hint: '+ 92,250 pts', accent: true },
          { label: 'Completed Orders', value: '50', hint: '+ 92,250 pts' },
        ]}
      />

      <HeroTabs tabs={['Orders', 'Disputes']} active={tab} onChange={setTab} />

      <div className="mt-4">
        {tab === 'Orders' && (
          <DataTable columns={orderCols} rows={ORDERS.slice(0, 15)} searchPlaceholder="Search by tracking ID" pageSize={5} />
        )}
        {tab === 'Disputes' && (
          <DataTable columns={disputeCols} rows={DISPUTES.slice(0, 8)} searchPlaceholder="Search disputes" pageSize={5} />
        )}
      </div>

      <ConfirmModal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        icon={<TriangleAlert size={20} />}
        title={`Deactivate ${rep.name}?`}
        body="Deactivating this rep removes them from all assignments. Their order history and pending earnings remain intact."
        confirmLabel="Deactivate"
      />
    </div>
  );
}
