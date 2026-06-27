'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import type { Paginated } from '@/types';
import type { SalesRepPayout } from '@/types/ops';

const naira = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

export function PayoutsTab() {
  const [rows, setRows] = useState<SalesRepPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [approving, setApproving] = useState<SalesRepPayout | null>(null);
  const [reference, setReference] = useState('');
  const [failing, setFailing] = useState<SalesRepPayout | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<Paginated<SalesRepPayout>>('/sales-rep/payouts?limit=100')
      .then((res) => setRows(res.data.data))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function approve() {
    if (!approving) return;
    setBusy(true);
    try {
      await api.post(`/sales-rep/payouts/${approving.id}/approve`, { reference: reference.trim() || undefined });
      setApproving(null);
      setReference('');
      load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setBusy(false);
    }
  }

  async function fail() {
    if (!failing) return;
    setBusy(true);
    try {
      await api.post(`/sales-rep/payouts/${failing.id}/fail`, { reason: reason.trim() || undefined });
      setFailing(null);
      setReason('');
      load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<SalesRepPayout>[] = [
    {
      key: 'rep', header: 'Sales Rep', sortable: true, value: (r) => r.salesRepName ?? r.salesRepUserId,
      render: (r) => (
        <span>
          <span className="block font-medium text-ink">{r.salesRepName ?? '—'}</span>
          {r.salesRepEmail && <span className="text-xs text-faint">{r.salesRepEmail.toLowerCase()}</span>}
        </span>
      ),
    },
    { key: 'amount', header: 'Amount', sortable: true, value: (r) => r.amountNaira, render: (r) => <span className="font-semibold text-ink">{naira(r.amountNaira)}</span> },
    { key: 'bank', header: 'Destination', render: (r) => <span className="text-body">{r.accountName} · {r.accountNumber} · {r.bankCode}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (r) => r.status, render: (r) => <Chip>{r.status}</Chip> },
    { key: 'requested', header: 'Requested', render: (r) => <span className="text-body">{formatDate(r.createdAt)}</span> },
    {
      key: 'actions', header: '', render: (r) =>
        r.status === 'pending' ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="soft" onClick={() => setApproving(r)} disabled={busy}><Check size={14} /> Approve</Button>
            <Button size="sm" variant="outline" onClick={() => setFailing(r)} disabled={busy}><X size={14} /> Fail</Button>
          </div>
        ) : (
          <span className="text-xs text-faint">{r.failureReason ?? '—'}</span>
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
        searchPlaceholder="Search payouts"
        filters={[{ label: 'Status', options: [] }]}
        pageSize={10}
        emptyText="No payout requests yet."
      />

      {/* Approve */}
      <Modal open={!!approving} onClose={() => setApproving(null)} title={`Approve payout · ${approving ? naira(approving.amountNaira) : ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-body">
            Confirm you have transferred {approving ? naira(approving.amountNaira) : ''} to {approving?.accountName} ({approving?.accountNumber}). This marks the covered referrals as paid.
          </p>
          <Input label="Transfer reference (optional)" placeholder="e.g. bank/Paystack ref" value={reference} onChange={(e) => setReference(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setApproving(null)}>Cancel</Button>
            <Button className="flex-1" loading={busy} onClick={approve}>Mark paid</Button>
          </div>
        </div>
      </Modal>

      {/* Fail */}
      <Modal open={!!failing} onClose={() => setFailing(null)} title="Mark payout failed">
        <div className="space-y-4">
          <p className="text-sm text-body">The covered referrals stay available so the rep can request again.</p>
          <Textarea label="Reason (optional)" placeholder="Why did this payout fail?" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setFailing(null)}>Cancel</Button>
            <Button variant="danger" className="flex-1" loading={busy} onClick={fail}>Mark failed</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
