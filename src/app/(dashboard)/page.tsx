'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users as UsersIcon, Building2, CircleDollarSign, ShoppingBag } from 'lucide-react';
import { Section, Panel } from '@/components/ui/Section';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDate } from '@/lib/utils';
import type { ApiResponse, Paginated } from '@/types';
import type { AdminOverview, Order } from '@/types/ops';

const naira = (n: number | null) => `₦${Number(n ?? 0).toLocaleString()}`;

function Kpi({ icon, iconClass, label, value, sub }: { icon: React.ReactNode; iconClass: string; label: string; value: string; sub?: string }) {
  return (
    <Panel>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>{icon}</span>
        <div>
          <p className="text-xs text-faint">{label}</p>
          <p className="text-2xl font-bold text-ink">{value}</p>
        </div>
      </div>
      {sub && <p className="mt-2 text-xs text-body">{sub}</p>}
    </Panel>
  );
}

const orderColumns: Column<Order>[] = [
  { key: 'reference', header: 'Reference', render: (o) => <span className="font-mono text-xs text-ink">{o.reference}</span> },
  { key: 'customer', header: 'Customer', render: (o) => <span className="flex items-center gap-2.5 text-body"><Avatar name={o.customerId} size={26} /> {o.customerId.slice(0, 8)}…</span> },
  { key: 'service', header: 'Service', value: (o) => o.serviceType, render: (o) => <span className="capitalize text-body">{o.serviceType.replace('_', ' & ')}</span> },
  { key: 'amount', header: 'Amount', value: (o) => o.totalWP, render: (o) => <span className="text-ink">{o.totalWP} WP <span className="text-xs text-faint">({naira(o.nairaEquivalentSnapshot)})</span></span> },
  { key: 'date', header: 'Date', sortable: true, value: (o) => o.createdAt, render: (o) => <span className="text-body">{formatDate(o.createdAt)}</span> },
  { key: 'status', header: 'Status', sortable: true, value: (o) => o.status, render: (o) => <Chip>{o.status.replace(/_/g, ' ')}</Chip> },
  { key: 'view', header: '', render: () => <Link href="/orders" className="font-medium text-ink underline-offset-2 hover:underline">View</Link> },
];

export default function DashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<ApiResponse<AdminOverview>>('/admin/overview'),
      api.get<Paginated<Order>>('/orders?limit=8'),
    ])
      .then(([o, ord]) => {
        setOverview(o.data.data);
        setOrders(ord.data.data);
        setOrderTotal(ord.data.meta.total);
      })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-24 text-primary"><Spinner size="lg" /></div>;
  if (error) return <p className="py-12 text-center text-sm text-danger">{error}</p>;
  if (!overview) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<UsersIcon size={18} />} iconClass="bg-[#E5177E] text-white" label="Total Users" value={String(overview.users.total)} sub={`${overview.users.active} active · ${overview.users.newThisWeek} new this week`} />
        <Kpi icon={<ShoppingBag size={18} />} iconClass="bg-violet text-white" label="Total Orders" value={String(orderTotal)} sub="All time" />
        <Kpi icon={<Building2 size={18} />} iconClass="bg-info text-white" label="Companies" value={String(overview.companies.total)} sub={`${overview.companies.awaitingApproval} awaiting approval`} />
        <Kpi icon={<CircleDollarSign size={18} />} iconClass="bg-primary text-white" label="WP in circulation" value={overview.washPoints.inCirculation.toLocaleString()} sub={`${overview.washPoints.userHeld.toLocaleString()} user · ${overview.washPoints.companyHeld.toLocaleString()} company`} />
      </div>

      {/* Recent signups */}
      <Section>
        <Panel>
          <p className="text-sm font-semibold text-ink">Recent signups</p>
          <div className="mt-3 divide-y divide-line">
            {overview.recentUsers.slice(0, 6).map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2.5">
                <span className="flex items-center gap-2.5">
                  <Avatar name={u.fullName} size={28} />
                  <span>
                    <span className="block text-sm font-medium text-ink">{u.fullName}</span>
                    <span className="text-xs text-faint">{u.email ?? u.phone ?? '—'}</span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="hidden text-xs text-faint sm:inline">{formatDate(u.createdAt)}</span>
                  <Chip>{u.status}</Chip>
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </Section>

      {/* Recent orders */}
      <DataTable
        columns={orderColumns}
        rows={orders}
        searchPlaceholder="Search by reference"
        filters={[{ label: 'Status', options: [] }]}
        pageSize={8}
        emptyText="No orders yet."
      />
    </div>
  );
}
