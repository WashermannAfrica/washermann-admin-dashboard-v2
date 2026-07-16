'use client';

import { useCallback, useEffect, useState } from 'react';
import { Banknote, CircleDollarSign, Users, Building2, Check } from 'lucide-react';
import { Panel } from '@/components/ui/Section';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDate } from '@/lib/utils';
import type { ApiResponse, Paginated } from '@/types';
import type { AdminOverview, VendorPayout } from '@/types/ops';

const naira = (n: number | null) => `₦${Number(n ?? 0).toLocaleString()}`;
const wp = (n: number) => `${Number(n || 0).toLocaleString()} WP`;

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

export default function FinancialsPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [payouts, setPayouts] = useState<VendorPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState<VendorPayout | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<ApiResponse<AdminOverview>>('/admin/overview'),
      api.get<Paginated<VendorPayout>>('/payouts?limit=100'),
    ])
      .then(([o, p]) => { setOverview(o.data.data); setPayouts(p.data.data); })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function approve() {
    if (!approving) return;
    setBusy(true);
    try {
      await api.post(`/payouts/${approving.id}/approve`);
      setApproving(null);
      load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setBusy(false);
    }
  }

  const pendingCount = payouts.filter((p) => p.status === 'pending').length;

  const columns: Column<VendorPayout>[] = [
    { key: 'vendor', header: 'Vendor', render: (p) => <span className="font-mono text-xs text-ink">{p.vendorId.slice(0, 8)}…</span> },
    { key: 'amount', header: 'Amount', sortable: true, value: (p) => p.nairaAmount, render: (p) => <span className="font-semibold text-ink">{naira(p.nairaAmount)} <span className="text-xs text-faint">({wp(p.amountWP)})</span></span> },
    { key: 'dest', header: 'Destination', render: (p) => <span className="text-body">{p.accountName} · {p.accountNumber} · {p.bankCode}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (p) => p.status, render: (p) => <Chip>{p.status}</Chip> },
    { key: 'date', header: 'Requested', render: (p) => <span className="text-body">{formatDate(p.createdAt)}</span> },
    {
      key: 'actions', header: '', render: (p) =>
        p.status === 'pending' ? (
          <div className="flex justify-end"><Button size="sm" variant="soft" onClick={() => setApproving(p)} disabled={busy}><Check size={13} /> Approve</Button></div>
        ) : <span className="text-xs text-faint">{p.failureReason ?? '—'}</span>,
    },
  ];

  if (loading) return <div className="flex justify-center py-24 text-primary"><Spinner size="lg" /></div>;
  if (error) return <p className="py-12 text-center text-sm text-danger">{error}</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<CircleDollarSign size={18} />} iconClass="bg-primary text-white" label="WP in circulation" value={wp(overview?.washPoints.inCirculation ?? 0)} />
        <Kpi icon={<Users size={18} />} iconClass="bg-violet text-white" label="User-held WP" value={wp(overview?.washPoints.userHeld ?? 0)} />
        <Kpi icon={<Building2 size={18} />} iconClass="bg-info text-white" label="Company-held WP" value={wp(overview?.washPoints.companyHeld ?? 0)} />
        <Kpi icon={<Banknote size={18} />} iconClass="bg-warn text-white" label="Payouts pending" value={String(pendingCount)} sub={`${payouts.length} total`} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold text-ink">Vendor payouts</h2>
        <DataTable
          columns={columns}
          rows={payouts}
          searchPlaceholder="Search payouts"
          filters={[{ label: 'Status', options: [] }]}
          pageSize={10}
          emptyText="No vendor payout requests yet."
        />
      </div>

      <Modal open={!!approving} onClose={() => setApproving(null)} title={`Approve payout · ${approving ? naira(approving.nairaAmount) : ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-body">
            Disburse {approving ? naira(approving.nairaAmount) : ''} to {approving?.accountName} ({approving?.accountNumber}). This debits the vendor wallet and initiates the bank transfer.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setApproving(null)}>Cancel</Button>
            <Button className="flex-1" loading={busy} onClick={approve}>Approve &amp; pay</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
