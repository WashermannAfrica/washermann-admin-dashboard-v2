'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { StatBlock } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip, statusTone } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EntitySearchSelect } from '@/components/ui/EntitySearchSelect';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import type { Paginated } from '@/types';
import type { Order } from '@/types/ops';

const pretty = (s?: string) =>
  s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

type VendorLite = { id: string; businessName: string | null; user?: { fullName?: string; email?: string } };
type RepLite = { id: string; user?: { fullName?: string; email?: string }; fullName?: string; email?: string };

const vendorLabel = (v: VendorLite) => v.businessName ?? v.user?.fullName ?? 'Unnamed vendor';
const vendorSub = (v: VendorLite) => v.user?.fullName ?? v.user?.email ?? '';
const repLabel = (r: RepLite) => r.user?.fullName ?? r.fullName ?? 'Unnamed rep';
const repSub = (r: RepLite) => r.user?.email ?? r.email ?? '';

/** Compact "waiting for N" label from an ISO timestamp. */
function ageLabel(iso?: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 'just now';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

export default function EscalationsPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assign, setAssign] = useState<Order | null>(null);
  const [repId, setRepId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<Paginated<Order>>('/orders?status=broadcasting_rep&limit=100'),
      api.get<Paginated<Order>>('/orders?status=broadcasting_vendor&limit=100'),
    ])
      .then(([r, v]) => {
        const merged = [...r.data.data, ...v.data.data].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        setRows(merged);
      })
      .catch((e) => setError(apiErr(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const awaitingRep = rows.filter((o) => o.status === 'broadcasting_rep').length;
  const awaitingVendor = rows.filter((o) => o.status === 'broadcasting_vendor').length;
  const needsRep = assign?.status === 'broadcasting_rep';

  async function doAssign() {
    if (!assign) return;
    setBusy(true);
    try {
      if (needsRep) {
        await api.post(`/assignment/orders/${assign.id}/assign/rep/${repId}`);
      } else {
        await api.post(`/assignment/orders/${assign.id}/assign/vendor/${vendorId}`);
      }
      setAssign(null); setRepId(''); setVendorId('');
      load();
    } catch (e) {
      setError(apiErr(e));
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<Order>[] = [
    { key: 'reference', header: 'Order', sortable: true, value: (o) => o.reference, render: (o) => <span className="font-mono text-xs font-semibold text-ink">{o.reference}</span> },
    { key: 'flow', header: 'Type', value: (o) => o.flow ?? '', render: (o) => <span className="text-body">{pretty(o.flow)}</span> },
    { key: 'customer', header: 'Customer', render: (o) => <span className="text-body">{o.customerName ?? '—'}</span> },
    { key: 'area', header: 'Area', render: (o) => <span className="text-body">{o.areaName ?? '—'}</span> },
    { key: 'waiting', header: 'Needs', value: (o) => o.status, render: (o) => <Chip tone={statusTone(o.status)}>{o.status === 'broadcasting_rep' ? 'Rep' : 'Vendor'}</Chip> },
    { key: 'age', header: 'Waiting', sortable: true, value: (o) => o.createdAt, render: (o) => <span className="text-body">{ageLabel(o.createdAt)}</span> },
    {
      key: 'actions', header: '', render: (o) => (
        <Button size="sm" onClick={() => { setAssign(o); setRepId(''); setVendorId(''); }}>
          Assign {o.status === 'broadcasting_rep' ? 'Rep' : 'Vendor'}
        </Button>
      ),
    },
  ];

  return (
    <Section>
      <div className="mb-1 flex items-center gap-2">
        <AlertTriangle size={18} className="text-amber" />
        <h1 className="text-lg font-bold text-ink">Escalations</h1>
      </div>
      <p className="mb-4 text-sm text-faint">Orders waiting for a rep or vendor — broadcast found no taker. Oldest first; assign one to unblock it.</p>

      {error && <p className="mb-3 rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatBlock label="Awaiting rep" value={String(awaitingRep)} hint="broadcasting_rep" />
        <StatBlock label="Awaiting vendor" value={String(awaitingVendor)} hint="broadcasting_vendor" />
        <StatBlock label="Total queued" value={String(rows.length)} hint="Needs manual action" />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search by order reference"
        pageSize={15}
        emptyText="No escalations — every order is matched 🎉"
      />

      <Modal open={!!assign} onClose={() => setAssign(null)} title={`Assign ${needsRep ? 'Rep' : 'Vendor'} — ${assign?.reference ?? ''}`}>
        <div className="space-y-4">
          {needsRep ? (
            <EntitySearchSelect<RepLite>
              label="Rep"
              required
              endpoint="/reps"
              value={repId}
              onChange={setRepId}
              getId={(r) => r.id}
              getLabel={repLabel}
              getSub={repSub}
              placeholder="Search by rep name…"
            />
          ) : (
            <EntitySearchSelect<VendorLite>
              label="Vendor"
              required
              endpoint="/vendors"
              value={vendorId}
              onChange={setVendorId}
              getId={(v) => v.id}
              getLabel={vendorLabel}
              getSub={vendorSub}
              placeholder="Search by business or owner name…"
            />
          )}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setAssign(null)}>Cancel</Button>
            <Button className="flex-1" loading={busy} disabled={needsRep ? !repId : !vendorId} onClick={doAssign}>
              Assign {needsRep ? 'Rep' : 'Vendor'}
            </Button>
          </div>
        </div>
      </Modal>
    </Section>
  );
}
