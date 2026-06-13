'use client';

import { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { ActionsPill } from '@/components/ui/ActionsPill';
import { PageKpi } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Drawer, DrawerRow } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { ORDERS, Order } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const TIMELINE = [
  { label: 'Order Placed', sub: 'Apr 17, 10:00 AM', done: true },
  { label: 'Washing in progress', sub: 'Now', done: true },
  { label: 'Dispatched', sub: 'Pending', done: false },
  { label: 'Completed', sub: 'Pending', done: false },
];

export default function OrdersPage() {
  const [selected, setSelected] = useState<Order | null>(null);

  const columns: Column<Order>[] = [
    { key: 'trackingId', header: 'Tracking ID', render: (o) => <span className="text-body">{o.trackingId}</span> },
    {
      key: 'name', header: 'Name', sortable: true, value: (o) => o.name,
      render: (o) => (
        <span className="flex items-center gap-2.5 font-medium text-ink">
          <Avatar name={o.name} size={28} /> {o.name}
        </span>
      ),
    },
    { key: 'company', header: 'Company', render: (o) => <span className="text-body">{o.company}</span> },
    { key: 'amount', header: 'Amount', render: (o) => <span className="text-ink">{o.amount}</span> },
    { key: 'date', header: 'Date', sortable: true, value: (o) => o.date, render: (o) => <span className="text-body">{o.date}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (o) => o.status, render: (o) => <Chip>{o.status}</Chip> },
    {
      key: 'view', header: '', render: (o) => (
        <button onClick={() => setSelected(o)} className="font-medium text-ink underline-offset-2 hover:underline">
          View Detail
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi
        icon={<ShoppingBag size={16} />}
        iconClass="bg-violet text-white"
        label="Total Orders"
        value={String(ORDERS.length * 2 + 4)}
        delta="+6 over the last 7 days"
      />

      <DataTable
        columns={columns}
        rows={ORDERS}
        searchPlaceholder="Search by tracking ID"
        pageSize={10}
      />

      {/* Order Details drawer — matches Order Details.png */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Order Details"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={() => setSelected(null)}>Apply Update</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div>
              <p className="text-xs text-faint">Tracking ID</p>
              <div className="mt-1 flex items-center justify-between">
                <h3 className="text-3xl font-bold text-ink">{selected.trackingId}</h3>
                <ActionsPill
                  actions={[
                    { label: 'Mark as completed' },
                    { label: 'Reassign washerman' },
                    { label: 'Contact customer' },
                    { label: 'Cancel order', danger: true },
                  ]}
                />
              </div>
              <p className="mt-1 text-xs text-faint">{selected.date}, 00:21</p>
            </div>

            <div className="border-y border-line py-3">
              <DrawerRow label="Status"><Chip>{selected.status}</Chip></DrawerRow>
              <DrawerRow label="Amount">₦8,500</DrawerRow>
              <DrawerRow label="WP Used">{selected.amount.replace('-', '')}</DrawerRow>
            </div>

            <div className="border-b border-line pb-3">
              <DrawerRow label="User">{selected.name}</DrawerRow>
              <DrawerRow label="Company">{selected.company}</DrawerRow>
              <DrawerRow label="Area">{selected.area}</DrawerRow>
            </div>

            <div className="border-b border-line pb-3">
              <DrawerRow label="● Pickup"><span>{selected.address}</span></DrawerRow>
              <DrawerRow label="● Delivery"><span>{selected.address}</span></DrawerRow>
            </div>

            <div className="rounded-2xl bg-section p-4">
              <p className="mb-3 text-[13px] font-semibold text-ink">Order Items</p>
              {selected.items.map((it) => (
                <div key={it.service} className="flex items-center justify-between py-1.5">
                  <span className="text-[13px] text-body">{it.service} × {it.qty}</span>
                  <span className="text-[13px] font-semibold text-ink">{it.points * it.qty} pts</span>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-3 text-[13px] font-semibold text-ink">Timeline</p>
              <ol className="space-y-4">
                {TIMELINE.map((t, i) => (
                  <li key={t.label} className="flex gap-3">
                    <span
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]',
                        t.done ? 'bg-primary text-white' : 'bg-section text-faint',
                      )}
                    >
                      {t.done ? <Check size={11} strokeWidth={3} /> : i + 1}
                    </span>
                    <div>
                      <p className={cn('text-[13px] font-medium', t.done ? 'text-ink' : 'text-faint')}>{t.label}</p>
                      <p className="text-xs text-faint">{t.sub}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
