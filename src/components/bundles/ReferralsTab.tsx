'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { RowMenu } from '@/components/ui/RowMenu';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Ban, RotateCcw } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { ApiResponse } from '@/types';
import type { Referral } from '@/types/ops';

const fmtAmount = (r: Referral) =>
  r.rewardAmount == null ? '—' : r.rewardCurrency === 'cash' ? `₦${Number(r.rewardAmount).toLocaleString()}` : `${r.rewardAmount} WP`;

export function ReferralsTab() {
  const [rows, setRows] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejecting, setRejecting] = useState<Referral | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectFraud, setRejectFraud] = useState(false);
  const [clawing, setClawing] = useState<Referral | null>(null);
  const [clawReason, setClawReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    // Backend GET /referrals returns the array directly under `data`.
    api
      .get<ApiResponse<Referral[]>>('/referrals')
      .then((res) => setRows(Array.isArray(res.data.data) ? res.data.data : []))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function doReject() {
    if (!rejecting) return;
    setBusy(true);
    try {
      await api.post(`/referrals/${rejecting.id}/reject`, { note: rejectNote.trim() || undefined, fraud: rejectFraud });
      setRejecting(null); setRejectNote(''); setRejectFraud(false);
      load();
    } catch (err) { setError(apiErr(err)); } finally { setBusy(false); }
  }

  async function doClawback() {
    if (!clawing) return;
    setBusy(true);
    try {
      await api.post(`/referrals/${clawing.id}/clawback`, { reason: clawReason.trim() });
      setClawing(null); setClawReason('');
      load();
    } catch (err) { setError(apiErr(err)); } finally { setBusy(false); }
  }

  const columns: Column<Referral>[] = [
    { key: 'code', header: 'Code', sortable: true, value: (r) => r.code, render: (r) => <span className="font-mono text-xs font-semibold text-ink">{r.code}</span> },
    {
      key: 'referrer', header: 'Referrer', value: (r) => r.referrerType,
      render: (r) => (
        <span>
          <span className="block text-sm text-ink">{r.referrerName ?? '—'}</span>
          <Badge variant="blue">{r.referrerType.replace('_', ' ')}</Badge>
        </span>
      ),
    },
    {
      key: 'referred', header: 'Referred', value: (r) => r.referredType,
      render: (r) => (
        <span>
          <span className="block text-sm font-medium text-ink">{r.referredName ?? '—'}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-faint">
            <Badge variant="neutral">{r.referredType}</Badge>
            {r.referredEmail ? r.referredEmail.toLowerCase() : ''}
          </span>
        </span>
      ),
    },
    { key: 'amount', header: 'Reward', render: (r) => <span className="text-ink">{fmtAmount(r)}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (r) => r.status, render: (r) => <Chip>{r.status}</Chip> },
    { key: 'created', header: 'Created', render: (r) => <span className="text-body">{formatDate(r.createdAt)}</span> },
    {
      key: 'actions', header: '', render: (r) => {
        const items = [];
        if (r.status !== 'paid' && r.status !== 'rejected' && r.status !== 'clawed_back') {
          items.push({ label: 'Reject', icon: <Ban size={14} />, danger: true, onClick: () => { setRejecting(r); setRejectNote(''); setRejectFraud(false); } });
        }
        if (r.status === 'paid') {
          items.push({ label: 'Claw back (fraud)', icon: <RotateCcw size={14} />, danger: true, onClick: () => { setClawing(r); setClawReason(''); } });
        }
        return items.length ? <RowMenu items={items} /> : <span className="text-xs text-faint">—</span>;
      },
    },
  ];

  if (loading) return <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-3">
      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}
      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search by code"
        filters={[
          { label: 'Status', options: ['pending', 'available', 'paid', 'rejected', 'clawed_back'] },
          { label: 'Referrer', options: ['customer', 'vendor', 'rep', 'sales_rep'] },
          { label: 'Referred', options: ['customer', 'vendor'] },
        ]}
        pageSize={12}
        emptyText="No referrals yet."
      />

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title="Reject referral">
        <div className="space-y-4">
          <p className="text-sm text-body">This voids the reward before payout. Ordinary corrections are only allowed within the correction window; tick fraud to reject outside it.</p>
          <Input label="Note (optional)" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Reason / reference" />
          <label className="flex items-center gap-2 text-sm text-body">
            <input type="checkbox" checked={rejectFraud} onChange={(e) => setRejectFraud(e.target.checked)} className="h-4 w-4 rounded border-line" />
            Fraud / self-referral (bypass the correction window)
          </label>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="danger" className="flex-1" loading={busy} onClick={doReject}>Reject</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!clawing} onClose={() => setClawing(null)} title="Claw back paid referral">
        <div className="space-y-4">
          <p className="text-sm text-body">Post-payout clawback is only for fraud/self-referral. The record is marked clawed-back and the amount flagged for recovery (disbursed money is not auto-reversed).</p>
          <Input label="Reason" value={clawReason} onChange={(e) => setClawReason(e.target.value)} placeholder="Fraud / self-referral detail" required />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setClawing(null)}>Cancel</Button>
            <Button variant="danger" className="flex-1" loading={busy} disabled={clawReason.trim().length < 3} onClick={doClawback}>Claw back</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
