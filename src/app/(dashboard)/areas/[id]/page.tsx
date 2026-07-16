'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Power, Star, Pencil, X } from 'lucide-react';
import { AreaMapEditor, DraftLocation } from '@/components/areas/AreaMapEditor';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, SelectField, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { DataTable, Column } from '@/components/ui/DataTable';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDate } from '@/lib/utils';
import type { ApiResponse, Paginated } from '@/types';
import type { Area, AreaDetail, AreaRep, AreaVendor, AreaOrderRow } from '@/types/ops';

const NG_STATES = ['Lagos', 'FCT', 'Rivers', 'Oyo', 'Kano'];

const naira = (n: number) => `₦${Number(n || 0).toLocaleString()}`;
const DEACTIVATE_CATEGORIES = ['Low demand', 'Operational issue', 'Merged with another area', 'Compliance', 'Other'];
const TABS = ['Reps', 'Washermen', 'Orders'] as const;
type Tab = (typeof TABS)[number];

function HeroStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-[90px]">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
    </div>
  );
}

function Rating({ value, count }: { value: number; count: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-body">
      <Star size={13} className="fill-warn text-warn" /> {Number(value).toFixed(1)}
      <span className="text-xs text-faint">({count})</span>
    </span>
  );
}

export default function AreaDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [area, setArea] = useState<AreaDetail | null>(null);
  const [reps, setReps] = useState<AreaRep[]>([]);
  const [vendors, setVendors] = useState<AreaVendor[]>([]);
  const [orders, setOrders] = useState<AreaOrderRow[]>([]);
  const [tab, setTab] = useState<Tab>('Reps');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [draftLocs, setDraftLocs] = useState<DraftLocation[]>([]);
  const [addingLoc, setAddingLoc] = useState(false);
  const [locOpen, setLocOpen] = useState(false);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [category, setCategory] = useState(DEACTIVATE_CATEGORIES[0]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const [townsExpanded, setTownsExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', state: 'Lagos', targetUsers: '', transportFeeWP: '', description: '' });
  const [adjacentIds, setAdjacentIds] = useState<string[]>([]);
  const [allAreas, setAllAreas] = useState<Area[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<ApiResponse<AreaDetail>>(`/areas/${id}`),
      api.get<ApiResponse<AreaRep[]>>(`/areas/${id}/reps`).catch(() => ({ data: { data: [] } })),
      api.get<ApiResponse<AreaVendor[]>>(`/areas/${id}/vendors`).catch(() => ({ data: { data: [] } })),
      api.get<Paginated<AreaOrderRow>>(`/areas/${id}/orders?limit=100`).catch(() => ({ data: { data: [] } })),
    ])
      .then(([a, r, v, o]) => {
        setArea(a.data.data);
        setReps(Array.isArray(r.data.data) ? r.data.data : []);
        setVendors(Array.isArray(v.data.data) ? v.data.data : []);
        setOrders(Array.isArray((o.data as Paginated<AreaOrderRow>).data) ? (o.data as Paginated<AreaOrderRow>).data : []);
      })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  function openLocEditor() {
    setDraftLocs(
      (area?.locations ?? []).map((l) => ({
        id: l.id,
        name: l.name,
        centerLat: l.centerLat,
        centerLng: l.centerLng,
        radiusKm: l.radiusKm ?? 2,
      })),
    );
    setLocOpen(true);
  }

  /** Diff-save the town drafts: POST new, PATCH changed, DELETE removed. */
  async function saveLocations() {
    if (!area) return;
    setAddingLoc(true);
    setError('');
    try {
      const existing = area.locations ?? [];
      const keptIds = new Set(draftLocs.filter((d) => d.id).map((d) => d.id!));
      const byId = new Map(existing.map((l) => [l.id, l]));

      for (const l of existing) {
        if (!keptIds.has(l.id)) await api.delete(`/areas/${id}/locations/${l.id}`);
      }
      for (const d of draftLocs) {
        if (!d.id) {
          await api.post(`/areas/${id}/locations`, {
            name: d.name.trim(),
            ...(d.centerLat != null && d.centerLng != null
              ? { centerLat: d.centerLat, centerLng: d.centerLng, radiusKm: d.radiusKm }
              : {}),
          });
        } else {
          const prev = byId.get(d.id);
          const changed =
            prev &&
            (prev.name !== d.name.trim() ||
              prev.centerLat !== d.centerLat ||
              prev.centerLng !== d.centerLng ||
              (prev.radiusKm ?? 2) !== d.radiusKm);
          if (changed) {
            await api.patch(`/areas/${id}/locations/${d.id}`, {
              name: d.name.trim(),
              ...(d.centerLat != null && d.centerLng != null
                ? { centerLat: d.centerLat, centerLng: d.centerLng, radiusKm: d.radiusKm }
                : {}),
            });
          }
        }
      }
      setLocOpen(false);
      load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setAddingLoc(false);
    }
  }
  function openEditor() {
    if (!area) return;
    setEditForm({
      name: area.name,
      state: area.state,
      targetUsers: String(area.targetUsers ?? 0),
      transportFeeWP: String(area.transportFeeWP ?? 0),
      description: area.description ?? '',
    });
    setAdjacentIds(area.adjacentAreaIds ?? []);
    setEditError('');
    setEditOpen(true);
    if (allAreas.length === 0) {
      api
        .get<Paginated<Area>>('/areas?limit=100')
        .then((res) => setAllAreas(res.data.data.filter((a) => a.id !== id)))
        .catch(() => setAllAreas([]));
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError('');
    setSavingEdit(true);
    try {
      await api.patch(`/areas/${id}`, {
        name: editForm.name.trim(),
        state: editForm.state.trim(),
        targetUsers: Number(editForm.targetUsers || 0),
        transportFeeWP: Number(editForm.transportFeeWP || 0),
        description: editForm.description.trim() || undefined,
        adjacentAreaIds: adjacentIds,
      });
      setEditOpen(false);
      load();
    } catch (err) {
      setEditError(apiErr(err));
    } finally {
      setSavingEdit(false);
    }
  }

  async function deactivate() {
    setBusy(true);
    try { await api.delete(`/areas/${id}`, { data: { category, reason: reason.trim() || undefined } }); setDeactivateOpen(false); setReason(''); load(); }
    catch (err) { setError(apiErr(err)); } finally { setBusy(false); }
  }
  async function reactivate() {
    setBusy(true);
    try { await api.patch(`/areas/${id}`, { isActive: true }); load(); } catch (err) { setError(apiErr(err)); } finally { setBusy(false); }
  }

  if (loading) return <div className="flex justify-center py-24 text-primary"><Spinner size="lg" /></div>;
  if (error && !area) return <p className="py-12 text-center text-sm text-danger">{error}</p>;
  if (!area) return null;

  const locs = area.locations ?? [];
  const s = area.stats;

  const repCols: Column<AreaRep>[] = [
    { key: 'name', header: 'Name', render: (r) => <div><span className="block font-medium text-ink">{r.name}</span>{r.phone && <span className="text-xs text-faint">{r.phone}</span>}</div> },
    { key: 'pickups', header: 'Pickups', sortable: true, value: (r) => r.pickups, render: (r) => <span className="text-body">{r.pickups}</span> },
    { key: 'deliveries', header: 'Delivery', sortable: true, value: (r) => r.deliveries, render: (r) => <span className="text-body">{r.deliveries}</span> },
    { key: 'rating', header: 'Ratings', sortable: true, value: (r) => r.rating, render: (r) => <Rating value={r.rating} count={r.ratingCount} /> },
    { key: 'status', header: 'Status', sortable: true, value: (r) => r.status, render: (r) => <Chip tone={r.status === 'active' ? 'success' : 'neutral'}>{r.status}</Chip> },
  ];
  const vendorCols: Column<AreaVendor>[] = [
    { key: 'name', header: 'Name', render: (v) => <div><span className="block font-medium text-ink">{v.name}</span>{v.phone && <span className="text-xs text-faint">{v.phone}</span>}</div> },
    { key: 'orders', header: 'Orders', sortable: true, value: (v) => v.orders, render: (v) => <span className="text-body">{v.orders}</span> },
    { key: 'delivered', header: 'Delivered', sortable: true, value: (v) => v.delivered, render: (v) => <span className="text-body">{v.delivered}</span> },
    { key: 'rating', header: 'Ratings', sortable: true, value: (v) => v.rating, render: (v) => <Rating value={v.rating} count={v.ratingCount} /> },
    { key: 'status', header: 'Status', sortable: true, value: (v) => v.status, render: (v) => <Chip tone={v.status === 'verified' ? 'success' : v.status === 'suspended' || v.status === 'rejected' ? 'danger' : 'neutral'}>{v.status.replace(/_/g, ' ')}</Chip> },
  ];
  const orderCols: Column<AreaOrderRow>[] = [
    { key: 'reference', header: 'Tracking ID', render: (o) => <span className="font-mono text-xs text-ink">{o.reference}</span> },
    { key: 'customer', header: 'Name', render: (o) => <span className="text-body">{o.customerName}</span> },
    { key: 'amount', header: 'Amount', sortable: true, value: (o) => o.totalWP, render: (o) => <span className="text-ink">{o.totalWP} WP</span> },
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
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{area.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-white/70">
              <MapPin size={14} /> {area.lga ? `${area.lga}, ` : ''}{area.state}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Chip tone={area.isActive ? 'success' : 'neutral'}>{area.isActive ? 'Active' : 'Inactive'}</Chip>
              {(townsExpanded ? locs : locs.slice(0, 4)).map((l) => (
                <span key={l.id} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/80">{l.name}</span>
              ))}
              {locs.length > 4 && (
                <button
                  onClick={() => setTownsExpanded((x) => !x)}
                  className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs text-white/80 transition-colors hover:bg-white/10"
                >
                  {townsExpanded ? 'show less' : `+${locs.length - 4} more`}
                </button>
              )}
              <button
                onClick={openLocEditor}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 px-2.5 py-0.5 text-xs text-white/80 transition-colors hover:bg-white/10"
              >
                <Pencil size={11} /> Edit towns
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="soft" onClick={openEditor}><Pencil size={15} /> Edit area</Button>
            {area.isActive
              ? <Button variant="danger" onClick={() => setDeactivateOpen(true)}><Power size={15} /> Deactivate</Button>
              : <Button variant="soft" loading={busy} onClick={reactivate}><Power size={15} /> Reactivate</Button>}
          </div>
        </div>

        {/* 6-metric stat row */}
        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-5">
          <HeroStat label="Total Orders" value={s.totalOrders} />
          <HeroStat label="Completed" value={s.completedOrders} />
          <HeroStat label="Active Reps" value={s.activeReps} />
          <HeroStat label="Washermen" value={s.vendors} />
          <HeroStat label="Active Orders" value={s.activeOrders} />
          <HeroStat label="Target Users" value={area.targetUsers} />
        </div>

        {/* Revenue panel */}
        <div className="mt-5 rounded-2xl bg-white/5 p-5">
          <p className="text-xs text-white/50">Total revenue</p>
          <p className="mt-1 text-3xl font-extrabold">{naira(s.revenueNaira)}</p>
          <p className="mt-0.5 text-xs text-mint">≈ {s.revenueWP.toLocaleString()} pts</p>
        </div>
      </div>

      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

      {/* Tabs */}
      <div className="flex gap-1 rounded-full bg-section p-1">
        {TABS.map((t) => (
          <button
            key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${tab === t ? 'bg-white text-ink shadow-sm' : 'text-body hover:text-ink'}`}
          >
            {t}{t === 'Reps' ? ` (${reps.length})` : t === 'Washermen' ? ` (${vendors.length})` : ` (${s.totalOrders})`}
          </button>
        ))}
      </div>

      {tab === 'Reps' && <DataTable columns={repCols} rows={reps} searchPlaceholder="Search reps" pageSize={10} emptyText="No reps serving this area yet." />}
      {tab === 'Washermen' && <DataTable columns={vendorCols} rows={vendors} searchPlaceholder="Search washermen" pageSize={10} emptyText="No washermen serving this area yet." />}
      {tab === 'Orders' && <DataTable columns={orderCols} rows={orders} searchPlaceholder="Search by tracking ID" pageSize={10} emptyText="No orders in this area yet." />}

      {/* Edit area modal — basics + broadcast-overflow adjacency */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit ${area.name}`}>
        <form className="space-y-4" onSubmit={saveEdit}>
          <Input
            label="Area Name" required
            value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
          />
          <SelectField
            label="State" required value={editForm.state}
            onChange={(e) => setEditForm((f) => ({ ...f, state: e.target.value }))}
          >
            {NG_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target Users" type="number"
              value={editForm.targetUsers} onChange={(e) => setEditForm((f) => ({ ...f, targetUsers: e.target.value }))}
            />
            <Input
              label="Transport Fee (WP)" required type="number"
              value={editForm.transportFeeWP} onChange={(e) => setEditForm((f) => ({ ...f, transportFeeWP: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Adjacent areas (overflow order)</label>
            <p className="mb-2 text-xs text-faint">
              When no rep/vendor here responds, the broadcast spills into these areas in this exact order — closest first.
            </p>
            <div className="flex min-h-[2rem] flex-wrap items-center gap-1.5">
              {adjacentIds.map((aid, i) => {
                const a = allAreas.find((x) => x.id === aid);
                return (
                  <span key={aid} className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2.5 py-1 text-xs font-medium text-forest">
                    {i + 1}. {a?.name ?? '…'}
                    <button type="button" onClick={() => setAdjacentIds((ids) => ids.filter((x) => x !== aid))} className="text-forest/60 hover:text-forest">
                      <X size={12} />
                    </button>
                  </span>
                );
              })}
              {adjacentIds.length === 0 && <span className="text-xs text-faint">None yet — orders here never overflow.</span>}
            </div>
            <select
              className="mt-2 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
              value=""
              onChange={(e) => {
                const v = e.target.value;
                if (v && !adjacentIds.includes(v)) setAdjacentIds((ids) => [...ids, v]);
              }}
            >
              <option value="">Add adjacent area…</option>
              {allAreas
                .filter((a) => !adjacentIds.includes(a.id))
                .map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <Textarea
            label="Description" placeholder="Optional notes about this area"
            value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
          />
          {editError && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{editError}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={savingEdit}>Save changes</Button>
          </div>
        </form>
      </Modal>

      {/* Edit towns modal — map-based circle geofences */}
      <Modal open={locOpen} onClose={() => setLocOpen(false)} title={`Towns & coverage in ${area.name}`} wide>
        <div className="space-y-4">
          <AreaMapEditor locations={draftLocs} onChange={setDraftLocs} height="20rem" />
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => setLocOpen(false)}>Cancel</Button>
            <Button loading={addingLoc} onClick={saveLocations}>Save coverage</Button>
          </div>
        </div>
      </Modal>

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
