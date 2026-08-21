'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users as UsersIcon, Building2, ShoppingBag, HardHat, AlertTriangle } from 'lucide-react';
import { Section, Panel } from '@/components/ui/Section';
import { Chip, statusTone } from '@/components/ui/Chip';
import { LineChart } from '@/components/ui/LineChart';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDateTime } from '@/lib/utils';
import type { ApiResponse } from '@/types';
import type { AdminAnalytics } from '@/types/ops';

const naira = (n: number | null) => `₦${Number(n ?? 0).toLocaleString()}`;
const pretty = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** One cell in the 5-stat row: coloured icon chip, number, label. */
function Stat({ icon, iconClass, label, value }: { icon: React.ReactNode; iconClass: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight text-ink">{value}</p>
        <p className="truncate text-xs text-faint">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<ApiResponse<AdminAnalytics>>('/admin/analytics')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-24 text-primary"><Spinner size="lg" /></div>;
  if (error) return <p className="py-12 text-center text-sm text-danger">{error}</p>;
  if (!data) return null;

  const c = data.counts;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Revenue hero */}
      <Section>
        <Panel className="p-6 sm:p-7">
          <p className="text-[13px] text-body">Total Revenue</p>
          <p className="mt-1 text-5xl font-bold tracking-tight text-ink">{naira(data.revenueNaira)}</p>
          <p className="mt-2 text-xs text-faint">Gross order value across the platform (all time)</p>
        </Panel>
      </Section>

      {/* 5-stat row */}
      <Section>
        <Panel>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            <Stat icon={<ShoppingBag size={18} />} iconClass="bg-violet text-white" label="Total Orders" value={c.orders.toLocaleString()} />
            <Stat icon={<Building2 size={18} />} iconClass="bg-info text-white" label="Companies" value={c.companies.toLocaleString()} />
            <Stat icon={<HardHat size={18} />} iconClass="bg-primary text-white" label="Contract Workers" value={c.contractWorkers.toLocaleString()} />
            <Stat icon={<UsersIcon size={18} />} iconClass="bg-[#E5177E] text-white" label="Users" value={c.users.toLocaleString()} />
            <Stat icon={<AlertTriangle size={18} />} iconClass="bg-warn text-white" label="Disputes" value={c.disputes.toLocaleString()} />
          </div>
        </Panel>
      </Section>

      {/* Washermen activity chart */}
      <Section>
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Washermen Activity per Month</p>
              <p className="mt-0.5 text-xs text-faint">Orders processed across the current year</p>
            </div>
          </div>
          <div className="mt-4">
            <LineChart
              rangeLabel={String(new Date().getFullYear())}
              series={[{ name: 'Orders', color: '#1FA463', fill: true, data: data.ordersPerMonth.map((m) => m.count) }]}
              labels={data.ordersPerMonth.map((m) => m.month)}
            />
          </div>
        </Panel>
      </Section>

      {/* Recent activities */}
      <Section>
        <Panel>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Recent Activities</p>
            <Link href="/orders" className="text-xs font-medium text-primary underline-offset-2 hover:underline">View all</Link>
          </div>
          <div className="mt-3 divide-y divide-line">
            {data.recentActivities.length === 0 && <p className="py-6 text-center text-xs text-faint">No recent activity.</p>}
            {data.recentActivities.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    Order <span className="font-mono text-xs">{a.reference ?? '—'}</span>
                  </p>
                  <p className="text-xs text-faint">{formatDateTime(a.at)}</p>
                </div>
                <Chip tone={statusTone(a.status)}>{pretty(a.status)}</Chip>
              </div>
            ))}
          </div>
        </Panel>
      </Section>
    </div>
  );
}
