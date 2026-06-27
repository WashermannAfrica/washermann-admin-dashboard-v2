'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, X, Copy } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import type { Paginated } from '@/types';
import type { SalesRepApplication } from '@/types/ops';

export function ApplicationsTab() {
  const [rows, setRows] = useState<SalesRepApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rejecting, setRejecting] = useState<SalesRepApplication | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState<{ name: string; link: string | null } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<Paginated<SalesRepApplication>>('/sales-rep/applications?limit=100')
      .then((res) => setRows(res.data.data))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function accept(app: SalesRepApplication) {
    setBusy(true);
    try {
      const res = await api.post<{ data: { inviteToken: string | null } }>(`/sales-rep/applications/${app.id}/accept`);
      const token = res.data.data?.inviteToken ?? null;
      const base = 'http://localhost:3005';
      setInvite({ name: app.fullName, link: token ? `${base}/invite?token=${token}` : null });
      load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!rejecting) return;
    setBusy(true);
    try {
      await api.post(`/sales-rep/applications/${rejecting.id}/reject`, { reason: reason.trim() || undefined });
      setRejecting(null);
      setReason('');
      load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<SalesRepApplication>[] = [
    { key: 'name', header: 'Name', sortable: true, value: (r) => r.fullName, render: (r) => <span className="font-medium text-ink">{r.fullName}</span> },
    { key: 'email', header: 'Email', render: (r) => <span className="text-body">{r.email}</span> },
    { key: 'phone', header: 'Phone', render: (r) => <span className="text-body">{r.phone}</span> },
    { key: 'area', header: 'Area', render: (r) => <span className="text-body">{r.areaOfLagos}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (r) => r.status, render: (r) => <Chip>{r.status}</Chip> },
    {
      key: 'actions', header: '', render: (r) =>
        r.status === 'new' || r.status === 'reviewing' ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="soft" onClick={() => accept(r)} disabled={busy}><Check size={14} /> Accept</Button>
            <Button size="sm" variant="outline" onClick={() => setRejecting(r)} disabled={busy}><X size={14} /> Reject</Button>
          </div>
        ) : (
          <span className="text-xs text-faint">—</span>
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
        searchPlaceholder="Search applications"
        filters={[{ label: 'Status', options: [] }]}
        pageSize={10}
        emptyText="No applications yet."
      />

      {/* Reject reason */}
      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title={`Reject ${rejecting?.fullName ?? ''}`}>
        <div className="space-y-4">
          <Textarea label="Reason (optional)" placeholder="Let the team know why" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="danger" className="flex-1" loading={busy} onClick={reject}>Reject application</Button>
          </div>
        </div>
      </Modal>

      {/* Invite created */}
      <Modal open={!!invite} onClose={() => setInvite(null)} title="Application accepted">
        <div className="space-y-4">
          <p className="text-sm text-body">
            {invite?.name} has been accepted and emailed an invite to set up their account.
          </p>
          {invite?.link && (
            <div className="rounded-2xl bg-section p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">Invite link</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate text-xs text-ink">{invite.link}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(invite.link ?? '')}
                  className="rounded-lg bg-white p-1.5 text-body hover:text-ink"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          )}
          <Button className="w-full" onClick={() => setInvite(null)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
