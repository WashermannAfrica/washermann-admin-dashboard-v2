'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpCircle, ArrowUpRight, TriangleAlert, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { RowMenu } from '@/components/ui/RowMenu';
import { ConfirmModal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import type { Paginated } from '@/types';
import type { SalesRep } from '@/types/ops';

export function SalesRepsTab() {
  const router = useRouter();
  const [rows, setRows] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgrading, setUpgrading] = useState<SalesRep | null>(null);
  const [suspending, setSuspending] = useState<SalesRep | null>(null);
  const [deleting, setDeleting] = useState<SalesRep | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<Paginated<SalesRep>>('/sales-rep?limit=100')
      .then((res) => setRows(res.data.data))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const view = (userId: string) => router.push(`/reps/sales/${userId}`);

  async function upgrade() {
    if (!upgrading) return;
    setBusy(true);
    try {
      await api.post(`/sales-rep/${upgrading.userId}/upgrade-to-wash-rep`);
      setUpgrading(null);
      load();
    } catch (err) {
      setError(apiErr(err));
      setUpgrading(null);
    } finally {
      setBusy(false);
    }
  }

  async function suspend() {
    if (!suspending) return;
    setBusy(true);
    const reactivating = suspending.status === 'suspended';
    try {
      await api.post(`/sales-rep/${suspending.userId}/${reactivating ? 'reactivate' : 'suspend'}`);
      setSuspending(null);
      load();
    } catch (err) {
      setError(apiErr(err));
      setSuspending(null);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/sales-rep/${deleting.userId}`);
      setDeleting(null);
      load();
    } catch (err) {
      setError(apiErr(err));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<SalesRep>[] = [
    {
      key: 'name', header: 'Sales Rep', sortable: true, value: (r) => r.user?.fullName ?? r.userId,
      render: (r) => (
        <button onClick={() => view(r.userId)} className="text-left">
          <span className="block font-medium text-ink hover:underline">{r.user?.fullName ?? '—'}</span>
          <span className="text-xs text-faint">{r.user?.email ?? r.userId.slice(0, 8) + '…'}</span>
        </button>
      ),
    },
    { key: 'status', header: 'Status', sortable: true, value: (r) => r.status, render: (r) => <Chip>{r.status}</Chip> },
    {
      key: 'assessment', header: 'Assessment', value: (r) => r.bestScorePct,
      render: (r) => (
        r.assessmentPassed
          ? <Badge variant="success">Passed · {r.bestScorePct}%</Badge>
          : <Badge variant="neutral">Best {r.bestScorePct}%</Badge>
      ),
    },
    { key: 'joined', header: 'Joined', render: (r) => <span className="text-body">{formatDate(r.createdAt)}</span> },
    {
      key: 'upgraded', header: 'Wash Rep', render: (r) =>
        r.upgradedToRepAt ? <Badge variant="blue">Upgraded</Badge> : <span className="text-xs text-faint">—</span>,
    },
    {
      key: 'actions', header: '', render: (r) => (
        <RowMenu
          items={[
            { label: 'View Details', icon: <ArrowUpRight size={14} />, onClick: () => view(r.userId) },
            ...(!r.upgradedToRepAt ? [{ label: 'Upgrade to Wash Rep', icon: <ArrowUpCircle size={14} />, onClick: () => setUpgrading(r) }] : []),
            {
              label: r.status === 'suspended' ? 'Reactivate' : 'Suspend',
              icon: <TriangleAlert size={14} />,
              danger: r.status !== 'suspended',
              onClick: () => setSuspending(r),
            },
            { label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => setDeleting(r) },
          ]}
        />
      ),
    },
  ];

  if (loading) return <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-3">
      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}
      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search sales reps"
        filters={[{ label: 'Status', options: ['onboarding', 'active', 'suspended'] }]}
        pageSize={10}
        emptyText="No sales reps yet."
      />

      <ConfirmModal
        open={!!upgrading}
        onClose={() => setUpgrading(null)}
        onConfirm={upgrade}
        icon={<ArrowUpCircle size={20} />}
        title="Upgrade to Wash Rep?"
        body="This grants the sales rep the field wash-rep role. They keep their referral code and earnings. Operational onboarding (zones, vehicle) is handled in the Wash Reps tab."
        confirmLabel={busy ? 'Upgrading…' : 'Upgrade'}
      />

      <ConfirmModal
        open={!!suspending}
        onClose={() => setSuspending(null)}
        onConfirm={suspend}
        icon={<TriangleAlert size={20} />}
        danger={suspending?.status !== 'suspended'}
        title={suspending?.status === 'suspended' ? `Reactivate ${suspending?.user?.fullName ?? 'sales rep'}?` : `Suspend ${suspending?.user?.fullName ?? 'sales rep'}?`}
        body={
          suspending?.status === 'suspended'
            ? 'Reactivating restores the sales rep to active — they can request payouts again.'
            : 'Suspending freezes the sales rep. They cannot request payouts while suspended. Their referrals and earnings are preserved.'
        }
        confirmLabel={suspending?.status === 'suspended' ? 'Reactivate' : 'Suspend'}
      />

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        icon={<Trash2 size={20} />}
        danger
        title={`Delete ${deleting?.user?.fullName ?? 'sales rep'}?`}
        body="This archives the sales rep and removes them from the list. Their referral and payout history is preserved and can be restored by reactivating them."
        confirmLabel="Delete"
      />
    </div>
  );
}
