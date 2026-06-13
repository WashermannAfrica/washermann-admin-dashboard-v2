'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TriangleAlert, RotateCw } from 'lucide-react';
import { EntityHero, HeroTabs } from '@/components/ui/EntityHero';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { ConfirmModal } from '@/components/ui/Modal';
import { Section, Panel } from '@/components/ui/Section';
import { USERS, ORDERS, DISPUTES, Order, Dispute } from '@/lib/mock-data';

const MEMBERSHIPS = [
  { company: 'CleanFresh Ltd', tier: 'Basic Tier' },
  { company: 'SparkleWash', tier: 'Basic Tier' },
];

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = USERS.find((u) => u.id === params.id) ?? USERS[0];
  const [tab, setTab] = useState('Orders');
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const orderCols: Column<Order>[] = [
    { key: 'trackingId', header: 'Tracking ID', render: (o) => <span className="font-medium text-ink">{o.trackingId}</span> },
    { key: 'amount', header: 'Amount', render: (o) => <span className="text-ink">{o.amount}</span> },
    { key: 'date', header: 'Date', sortable: true, value: (o) => o.date, render: (o) => <span className="text-body">{o.date}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (o) => o.status, render: (o) => <Chip>{o.status}</Chip> },
    { key: 'view', header: '', render: () => <button onClick={() => router.push('/orders')} className="cursor-pointer font-medium text-ink underline-offset-2 hover:underline">View Detail</button> },
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
        name={user.name}
        contact={`${user.email}, ${user.phone}`}
        chips={[user.status, 'Basic Tier', `${user.orders * 10} orders`]}
        onDeactivate={() => setDeactivateOpen(true)}
        tiles={[
          { label: 'Total Earnings', value: '245,000 pts', hint: '≈ ₦64,200', accent: true },
          { label: 'Points Lost', value: '1,284 pts', hint: '≈ ₦245,000' },
        ]}
      />

      <HeroTabs tabs={['Orders', 'Disputes', 'Company / Teams']} active={tab} onChange={setTab} />

      <div className="mt-4">
        {tab === 'Orders' && (
          <DataTable columns={orderCols} rows={ORDERS.slice(0, 15)} searchPlaceholder="Search by tracking ID" pageSize={5} />
        )}
        {tab === 'Disputes' && (
          <DataTable columns={disputeCols} rows={DISPUTES.slice(0, 6)} searchPlaceholder="Search disputes" pageSize={5} />
        )}
        {tab === 'Company / Teams' && (
          <Section>
            <div className="grid gap-3 sm:grid-cols-2">
              {MEMBERSHIPS.map((m) => (
                <Panel key={m.company}>
                  <div className="flex items-center justify-between border-b border-dashed border-line pb-3">
                    <span className="flex items-baseline gap-2">
                      <span className="font-bold text-ink">{m.company}</span>
                      <span className="text-xs text-faint">{m.tier}</span>
                    </span>
                    <span className="cursor-pointer text-[13px] font-semibold text-ink underline underline-offset-2">View Company</span>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-faint">
                    <RotateCw size={12} /> Quarterly·Ends Jun 30, 2026
                  </p>
                  <div className="mt-2.5 space-y-2">
                    {['Used this cycle', 'Earned/cycle', 'Points lost'].map((l) => (
                      <div key={l} className="flex items-center justify-between">
                        <span className="text-[13px] text-faint">{l}</span>
                        <span className="text-[13px] font-bold text-ink">₦0</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              ))}
            </div>
          </Section>
        )}
      </div>

      <ConfirmModal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        icon={<TriangleAlert size={20} />}
        title={`Deactivate ${user.name}?`}
        body="Deactivating this user blocks logins and new orders. Their wallet balance is preserved and restored on reactivation."
        confirmLabel="Deactivate"
      />
    </div>
  );
}
