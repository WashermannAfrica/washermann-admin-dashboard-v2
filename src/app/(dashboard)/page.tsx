'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { PageKpi } from '@/components/ui/PageKpi';
import { Section, Panel } from '@/components/ui/Section';
import { LineChart } from '@/components/ui/LineChart';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { ORDERS, ORDERS_PER_MONTH, Order } from '@/lib/mock-data';

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
      <Link href="/orders" className="font-medium text-ink underline-offset-2 hover:underline">
        View Detail
      </Link>
    ),
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi
        icon={<ShoppingBag size={16} />}
        iconClass="bg-violet text-white"
        label="Total Orders"
        value="100"
        delta="+6 over the last 7 days"
      />

      {/* Orders per month chart */}
      <Section>
        <Panel>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[13px] text-body">Orders Per Month</p>
              <p className="mt-1 text-3xl font-bold text-ink">+67%</p>
              <p className="mt-1 text-xs text-faint">
                Total number of orders placed each month over the last 6 months
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <button className="flex h-8 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-xs text-body">
                12 months
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <div className="min-w-0 flex-1">
              <LineChart series={[{ name: 'Orders', color: '#13C490', data: ORDERS_PER_MONTH, fill: true }]} />
            </div>
            <div className="flex shrink-0 flex-col gap-6 pr-4">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-body">
                  <span className="h-2 w-2 rounded-full bg-danger" /> Overdue Orders
                </p>
                <p className="mt-1 text-3xl font-bold text-ink">20</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-body">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Pending orders
                </p>
                <p className="mt-1 text-3xl font-bold text-ink">10</p>
              </div>
            </div>
          </div>
        </Panel>
      </Section>

      {/* Orders table */}
      <DataTable
        columns={columns}
        rows={ORDERS}
        searchPlaceholder="Search by tracking ID"
        filters={[{ label: 'Status', options: [] }, { label: 'Date', options: [] }]}
        pageSize={5}
      />
    </div>
  );
}
