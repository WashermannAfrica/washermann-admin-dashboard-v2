'use client';

import { useEffect, useState } from 'react';
import { FileText, Users, Banknote, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { Spinner } from '@/components/ui/Spinner';
import { Panel } from '@/components/ui/Section';
import type { ApiResponse } from '@/types';
import type { SalesRepAdminSummary } from '@/types/ops';

function Kpi({ icon, iconClass, label, value, sub }: { icon: React.ReactNode; iconClass: string; label: string; value: string; sub?: string }) {
  return (
    <Panel>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>{icon}</span>
        <div>
          <p className="text-xs text-faint">{label}</p>
          <p className="text-xl font-bold text-ink">{value}</p>
        </div>
      </div>
      {sub && <p className="mt-2 text-xs text-body">{sub}</p>}
    </Panel>
  );
}

const naira = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

export function OverviewTab() {
  const [data, setData] = useState<SalesRepAdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<ApiResponse<SalesRepAdminSummary>>('/sales-rep/admin/summary')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>;
  if (error) return <p className="py-12 text-center text-sm text-danger">{error}</p>;
  if (!data) return null;

  const newApps = data.applications.byStatus['new'] ?? 0;
  const pendingPayouts = data.payouts.byStatus['pending'] ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<FileText size={18} />} iconClass="bg-info text-white" label="Applications" value={String(data.applications.total)} sub={`${newApps} awaiting review`} />
        <Kpi icon={<Users size={18} />} iconClass="bg-primary text-white" label="Sales Reps" value={String(data.salesReps.total)} sub={`${data.salesReps.byStatus['active'] ?? 0} active`} />
        <Kpi icon={<Banknote size={18} />} iconClass="bg-warn text-white" label="Payouts" value={String(data.payouts.total)} sub={`${pendingPayouts} pending`} />
        <Kpi icon={<Wallet size={18} />} iconClass="bg-violet text-white" label="Outstanding" value={naira(data.payouts.outstandingNaira)} sub={`${naira(data.payouts.paidNaira)} paid to date`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel>
          <p className="text-sm font-semibold text-ink">Applications by status</p>
          <BreakdownList byStatus={data.applications.byStatus} />
        </Panel>
        <Panel>
          <p className="text-sm font-semibold text-ink">Sales reps by status</p>
          <BreakdownList byStatus={data.salesReps.byStatus} />
        </Panel>
        <Panel>
          <p className="text-sm font-semibold text-ink">Payouts by status</p>
          <BreakdownList byStatus={data.payouts.byStatus} />
        </Panel>
      </div>
    </div>
  );
}

function BreakdownList({ byStatus }: { byStatus: Record<string, number> }) {
  const entries = Object.entries(byStatus);
  if (entries.length === 0) return <p className="mt-3 text-sm text-faint">None yet.</p>;
  return (
    <div className="mt-3 space-y-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between text-sm">
          <span className="capitalize text-body">{k}</span>
          <span className="font-semibold text-ink">{v}</span>
        </div>
      ))}
    </div>
  );
}
