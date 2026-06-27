'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowUpCircle, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Panel } from '@/components/ui/Section';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import type { ApiResponse, Paginated } from '@/types';
import type { SalesRep, SalesRepDetail } from '@/types/ops';

const naira = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

export function SalesRepsTab() {
  const [rows, setRows] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgrading, setUpgrading] = useState<SalesRep | null>(null);
  const [busy, setBusy] = useState(false);

  const [detail, setDetail] = useState<SalesRepDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<Paginated<SalesRep>>('/sales-rep?limit=100')
      .then((res) => setRows(res.data.data))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  function openDetail(userId: string) {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    api
      .get<ApiResponse<SalesRepDetail>>(`/sales-rep/${userId}`)
      .then((res) => setDetail(res.data.data))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setDetailLoading(false));
  }

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

  const columns: Column<SalesRep>[] = [
    {
      key: 'name', header: 'Sales Rep', sortable: true, value: (r) => r.user?.fullName ?? r.userId,
      render: (r) => (
        <button onClick={() => openDetail(r.userId)} className="text-left">
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
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => openDetail(r.userId)}><Eye size={14} /> View</Button>
          {!r.upgradedToRepAt && (
            <Button size="sm" variant="soft" onClick={() => setUpgrading(r)}><ArrowUpCircle size={14} /> Upgrade</Button>
          )}
        </div>
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
        filters={[{ label: 'Status', options: [] }]}
        pageSize={10}
        emptyText="No sales reps yet."
      />

      {/* Detail */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Sales rep" wide>
        {detailLoading || !detail ? (
          <div className="flex justify-center py-12 text-primary"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-5">
            {/* header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-ink">{detail.user?.fullName ?? '—'}</h3>
                <p className="text-sm text-body">{detail.user?.email ?? '—'}{detail.user?.phone ? ` · ${detail.user.phone}` : ''}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Chip>{detail.profile.status}</Chip>
                  {detail.profile.assessmentPassed && <Badge variant="success">Passed · {detail.profile.bestScorePct}%</Badge>}
                  {detail.profile.upgradedToRepAt && <Badge variant="blue">Wash Rep</Badge>}
                </div>
              </div>
              {detail.referral.code && (
                <div className="rounded-xl bg-section px-4 py-2 text-right">
                  <p className="text-xs text-faint">Referral code</p>
                  <p className="font-mono text-sm font-bold text-ink">{detail.referral.code}</p>
                </div>
              )}
            </div>

            {/* earnings */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Panel><p className="text-xs font-semibold uppercase tracking-wide text-faint">Available (due)</p><p className="mt-1 text-xl font-bold text-success">{naira(detail.referral.payout.available)}</p></Panel>
              <Panel><p className="text-xs font-semibold uppercase tracking-wide text-faint">Pending</p><p className="mt-1 text-xl font-bold text-ink">{naira(detail.referral.payout.pending)}</p></Panel>
              <Panel><p className="text-xs font-semibold uppercase tracking-wide text-faint">Paid out</p><p className="mt-1 text-xl font-bold text-ink">{naira(detail.referral.payout.paid)}</p></Panel>
            </div>

            {/* bank */}
            <Panel>
              <p className="text-sm font-semibold text-ink">Payout account</p>
              <p className="mt-1 text-sm text-body">
                {detail.profile.bank.accountName
                  ? `${detail.profile.bank.accountName} · ${detail.profile.bank.accountNumber} · ${detail.profile.bank.bankCode}`
                  : 'Not set yet'}
              </p>
            </Panel>

            {/* referrals */}
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Referrals ({detail.referral.referrals.length})</p>
              <div className="overflow-hidden rounded-2xl border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-section text-left text-xs uppercase tracking-wide text-faint">
                    <tr><th className="px-4 py-2.5">Referred</th><th className="px-4 py-2.5">Type</th><th className="px-4 py-2.5">Reward</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5">Date</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {detail.referral.referrals.map((r) => (
                      <tr key={r.id} className="bg-white">
                        <td className="px-4 py-2.5">
                          <span className="block font-medium text-ink">{r.referredName ?? '—'}</span>
                          <span className="text-xs text-faint">{r.referredEmail ?? ''}</span>
                        </td>
                        <td className="px-4 py-2.5 capitalize text-body">{r.referredType}</td>
                        <td className="px-4 py-2.5 text-ink">{r.rewardAmount != null ? naira(r.rewardAmount) : '—'}</td>
                        <td className="px-4 py-2.5"><Chip>{r.status}</Chip></td>
                        <td className="px-4 py-2.5 text-body">{formatDate(r.createdAt)}</td>
                      </tr>
                    ))}
                    {detail.referral.referrals.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-faint">No referrals yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!upgrading}
        onClose={() => setUpgrading(null)}
        onConfirm={upgrade}
        icon={<ArrowUpCircle size={20} />}
        title="Upgrade to Wash Rep?"
        body="This grants the sales rep the field wash-rep role. They keep their referral code and earnings. Operational onboarding (zones, vehicle) is handled in the Reps section."
        confirmLabel={busy ? 'Upgrading…' : 'Upgrade'}
      />
    </div>
  );
}
