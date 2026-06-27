'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Power, Plus, X, ShoppingBag, Activity, Target, Banknote } from 'lucide-react';
import { Section, Panel } from '@/components/ui/Section';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SelectField, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { DataTable, Column } from '@/components/ui/DataTable';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDate } from '@/lib/utils';
import type { ApiResponse } from '@/types';
import type { AreaDetail, Order } from '@/types/ops';

const naira = (n: number) => `₦${Number(n || 0).toLocaleString()}`;
const DEACTIVATE_CATEGORIES = ['Low demand', 'Operational issue', 'Merged with another area', 'Compliance', 'Other'];

function Kpi({ icon, iconClass, label, value }: { icon: React.ReactNode; iconClass: string; label: string; value: string }) {
  return (
    <Panel>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>{icon}</span>
        <div>
          <p className="text-xs text-faint">{label}</p>
          <p className="text-xl font-bold text-ink">{value}</p>
        </div>
      </div>
    </Panel>
  );
}

export default function AreaDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [area, setArea] = useState<AreaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newLoc, setNewLoc] = useState('');
  const [addingLoc, setAddingLoc] = useState(false);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [category, setCategory] = useState(DEACTIVATE_CATEGORIES[0]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<ApiResponse<AreaDetail>>(`/areas/${id}`)
      .then((res) => setArea(res.data.data))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  async function addLocation() {
    const name = newLoc.trim();
    if (!name) return;
    setAddingLoc(true);
    try {
      await api.post(`/areas/${id}/locations`, { name });
      setNewLoc('');
      load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setAddingLoc(false);
    }
  }

  async function removeLocation(locationId: string) {
    try {
      await api.delete(`/areas/${id}/locations/${locationId}`);
      load();
    } catch (err) {
      setError(apiErr(err));
    }
  }

  async function deactivate() {
    setBusy(true);
    try {
      await api.delete(`/areas/${id}`, { data: { category, reason: reason.trim() || undefined } });
      setDeactivateOpen(false);
      setReason('');
      load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setBusy(false);
    }
  }

  async function reactivate() {
    setBusy(true);
    try {
      await api.patch(`/areas/${id}`, { isActive: true });
      load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="flex justify-center py-24 text-primary"><Spinner size="lg" /></div>;
  if (error && !area) return <p className="py-12 text-center text-sm text-danger">{error}</p>;
  if (!area) return null;

  const locs = area.locations ?? [];

  const orderColumns: Column<Order>[] = [
    { key: 'reference', header: 'Reference', render: (o) => <span className="font-mono text-xs text-ink">{o.reference}</span> },
    { key: 'service', header: 'Service', render: (o) => <span className="capitalize text-body">{o.serviceType.replace('_', ' & ')}</span> },
    { key: 'amount', header: 'Amount', value: (o) => o.totalWP, render: (o) => <span className="text-ink">{o.totalWP} WP</span> },
    { key: 'date', header: 'Date', sortable: true, value: (o) => o.createdAt, render: (o) => <span className="text-body">{formatDate(o.createdAt)}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (o) => o.status, render: (o) => <Chip>{o.status.replace(/_/g, ' ')}</Chip> },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button onClick={() => router.push('/areas')} className="flex items-center gap-1.5 text-sm text-body hover:text-ink">
        <ArrowLeft size={16} /> Back to Areas
      </button>

      {/* Hero */}
      <div className="rounded-3xl bg-forest-deep p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{area.name}</h1>
              <Chip tone={area.isActive ? 'success' : 'neutral'}>{area.isActive ? 'Active' : 'Inactive'}</Chip>
            </div>
            <p className="mt-1.5 flex items-center gap-1 text-sm text-white/70">
              <MapPin size={14} /> {area.lga ? `${area.lga}, ` : ''}{area.state} · Transport {area.transportFeeWP} WP
            </p>
            {!area.isActive && area.deactivationReason && (
              <p className="mt-2 text-sm text-white/60">Deactivated: {area.deactivationReason}</p>
            )}
          </div>
          {area.isActive ? (
            <Button variant="danger" onClick={() => setDeactivateOpen(true)}><Power size={15} /> Deactivate</Button>
          ) : (
            <Button variant="soft" loading={busy} onClick={reactivate}><Power size={15} /> Reactivate</Button>
          )}
        </div>
      </div>

      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<ShoppingBag size={18} />} iconClass="bg-violet text-white" label="Total Orders" value={String(area.stats.totalOrders)} />
        <Kpi icon={<Activity size={18} />} iconClass="bg-info text-white" label="Active Orders" value={String(area.stats.activeOrders)} />
        <Kpi icon={<Target size={18} />} iconClass="bg-primary text-white" label="Target Users" value={String(area.targetUsers)} />
        <Kpi icon={<Banknote size={18} />} iconClass="bg-warn text-white" label="Revenue" value={naira(area.stats.revenueNaira)} />
      </div>

      {/* Locations */}
      <Section>
        <Panel>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Locations / Towns</h2>
            <span className="text-xs text-faint">{locs.length} total · {area.stats.reps} reps · {area.stats.vendors} vendors</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {locs.map((l) => (
              <span key={l.id} className="inline-flex items-center gap-1 rounded-full border border-line bg-section px-3 py-1.5 text-[13px] text-ink">
                {l.name}
                <button onClick={() => removeLocation(l.id)} className="text-faint hover:text-danger" aria-label={`Remove ${l.name}`}>
                  <X size={13} />
                </button>
              </span>
            ))}
            {locs.length === 0 && <span className="text-sm text-faint">No locations yet.</span>}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input
              value={newLoc}
              onChange={(e) => setNewLoc(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLocation(); } }}
              placeholder="Type a town name and press enter"
              className="h-10 flex-1 rounded-full bg-section px-4 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Button size="sm" loading={addingLoc} onClick={addLocation}><Plus size={14} /> Add</Button>
          </div>
        </Panel>
      </Section>

      {/* Recent orders */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-ink">Recent orders in this area</h2>
        <DataTable columns={orderColumns} rows={area.recentOrders} searchPlaceholder="Search by reference" pageSize={10} emptyText="No orders in this area yet." />
      </div>

      {/* Deactivate modal */}
      <Modal open={deactivateOpen} onClose={() => setDeactivateOpen(false)} title={`Deactivate ${area.name}?`}>
        <div className="space-y-4">
          <p className="text-sm text-body">
            Deactivating hides this area from new orders and pauses rep/vendor assignment. Existing accounts and history are kept.
          </p>
          <SelectField label="Select a category" required value={category} onChange={(e) => setCategory(e.target.value)}>
            {DEACTIVATE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectField>
          <Textarea label="Reason for deactivation" placeholder="Why are you deactivating this area?" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeactivateOpen(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" loading={busy} onClick={deactivate}>Deactivate</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
