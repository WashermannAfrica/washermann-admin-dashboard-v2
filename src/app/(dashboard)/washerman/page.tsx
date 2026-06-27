'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WashingMachine, ArrowUpRight, TriangleAlert, Check, X, ShieldCheck, Plus, Trophy, MapPin } from 'lucide-react';
import { PageKpi } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Stars } from '@/components/ui/Stars';
import { RowMenu } from '@/components/ui/RowMenu';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import type { Paginated } from '@/types';
import type { Vendor } from '@/types/ops';

const wp = (n?: number) => `${Number(n ?? 0).toLocaleString()} WP`;
type AreaLite = { id: string; name: string };

export default function WashermanPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [areas, setAreas] = useState<AreaLite[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rejecting, setRejecting] = useState<Vendor | null>(null);
  const [reason, setReason] = useState('');
  const [suspending, setSuspending] = useState<Vendor | null>(null);
  const [busy, setBusy] = useState(false);

  // Add Washerman modal
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ fullName: '', businessName: '', email: '', phone: '', areaIds: [] as string[] });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<Paginated<Vendor>>('/vendors?limit=100'),
      api.get<{ data: AreaLite[] }>('/areas?limit=100').catch(() => ({ data: { data: [] } })),
    ])
      .then(([v, a]) => {
        setVendors(v.data.data);
        setTotal(v.data.meta.total);
        setAreas(Array.isArray(a.data.data) ? a.data.data : []);
      })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function verify(v: Vendor) {
    setBusy(true);
    try { await api.post(`/vendors/${v.id}/verify`, { decision: 'verified' }); load(); }
    catch (err) { setError(apiErr(err)); } finally { setBusy(false); }
  }
  async function reject() {
    if (!rejecting) return;
    setBusy(true);
    try { await api.post(`/vendors/${rejecting.id}/verify`, { decision: 'rejected', rejectionReason: reason.trim() || undefined }); setRejecting(null); setReason(''); load(); }
    catch (err) { setError(apiErr(err)); } finally { setBusy(false); }
  }
  async function suspend() {
    if (!suspending) return;
    setBusy(true);
    try { await api.post(`/vendors/${suspending.id}/suspend`); setSuspending(null); load(); }
    catch (err) { setError(apiErr(err)); } finally { setBusy(false); }
  }
  async function addWasherman(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setAdding(true);
    try {
      await api.post('/vendors', {
        fullName: form.fullName.trim(),
        businessName: form.businessName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        ...(form.areaIds.length ? { areaIds: form.areaIds } : {}),
      });
      setAddOpen(false);
      setForm({ fullName: '', businessName: '', email: '', phone: '', areaIds: [] });
      load();
    } catch (err) { setAddError(apiErr(err)); } finally { setAdding(false); }
  }

  // ── summary cards ──────────────────────────────────────────────────────────
  const newLast7 = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return vendors.filter((v) => new Date(v.createdAt).getTime() >= cutoff).length;
  }, [vendors]);

  const best = useMemo(
    () => [...vendors].sort((a, b) => (b.orderCount ?? 0) - (a.orderCount ?? 0) || b.rating - a.rating)[0],
    [vendors],
  );

  const areasCovered = useMemo(() => {
    const set = new Set<string>();
    vendors.forEach((v) => v.areaIds.forEach((id) => set.add(id)));
    const names = areas.filter((a) => set.has(a.id)).map((a) => a.name);
    return { count: set.size, total: areas.length, names };
  }, [vendors, areas]);

  const columns: Column<Vendor>[] = [
    {
      key: 'name', header: 'Name', sortable: true, value: (v) => v.user?.fullName ?? v.businessName ?? '',
      render: (v) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={v.user?.fullName ?? v.businessName ?? '—'} size={28} dot={v.isAvailable} />
          <span>
            <span className="block font-medium text-ink">{v.user?.fullName ?? '—'}</span>
            <span className="text-xs text-faint">{v.businessName ?? v.user?.email?.toLowerCase() ?? '—'}</span>
          </span>
        </span>
      ),
    },
    { key: 'orders', header: 'Orders', sortable: true, value: (v) => v.orderCount ?? 0, render: (v) => <span className="text-body">{v.orderCount ?? 0}</span> },
    { key: 'earnings', header: 'Earnings', sortable: true, value: (v) => v.earnedWp ?? 0, render: (v) => <span className="text-ink">{wp(v.earnedWp)}</span> },
    { key: 'escrow', header: 'Escrow', sortable: true, value: (v) => v.balanceWp ?? 0, render: (v) => <span className="text-body">{wp(v.balanceWp)}</span> },
    { key: 'rating', header: 'Ratings', value: (v) => v.rating, render: (v) => <span className="flex items-center gap-1.5"><Stars rating={Math.round(v.rating)} /><span className="text-[11px] text-faint">({v.ratingCount})</span></span> },
    { key: 'status', header: 'Status', sortable: true, value: (v) => v.verificationStatus, render: (v) => <Chip>{v.verificationStatus.replace(/_/g, ' ')}</Chip> },
    {
      key: 'actions', header: '', render: (v) => (
        <div className="flex justify-end">
          <RowMenu
            items={[
              { label: 'View Details', icon: <ArrowUpRight size={14} />, onClick: () => router.push(`/washerman/${v.id}`) },
              ...(v.verificationStatus === 'pending_review'
                ? [
                    { label: 'Verify', icon: <Check size={14} />, onClick: () => verify(v) },
                    { label: 'Reject', icon: <X size={14} />, danger: true, onClick: () => setRejecting(v) },
                  ]
                : []),
              ...(v.verificationStatus === 'verified'
                ? [{ label: 'Suspend Washerman', icon: <TriangleAlert size={14} />, danger: true, onClick: () => setSuspending(v) }]
                : []),
              ...(v.verificationStatus === 'suspended' || v.verificationStatus === 'rejected'
                ? [{ label: 'Reinstate', icon: <ShieldCheck size={14} />, onClick: () => verify(v) }]
                : []),
            ]}
          />
        </div>
      ),
    },
  ];

  const toggleArea = (id: string) =>
    setForm((f) => ({ ...f, areaIds: f.areaIds.includes(id) ? f.areaIds.filter((x) => x !== id) : [...f.areaIds, id] }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi
        icon={<WashingMachine size={16} />} iconClass="bg-[#E5177E] text-white"
        label="Total Washermen" value={String(total)}
        delta={newLast7 > 0 ? `+${newLast7} over the last 7 days` : undefined}
      />

      {/* Best performing + Areas covered */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-section px-5 py-4">
          <p className="flex items-center gap-1.5 text-[13px] text-body"><Trophy size={13} className="text-warn" /> Best Performing</p>
          <p className="mt-1 truncate text-2xl font-bold tracking-tight text-ink">{best?.user?.fullName ?? best?.businessName ?? '—'}</p>
          <p className="mt-1.5 text-xs text-faint">{best ? `${best.orderCount ?? 0} orders · ⭐ ${best.rating.toFixed(1)}` : 'No vendors yet'}</p>
        </div>
        <div className="rounded-2xl bg-section px-5 py-4">
          <p className="flex items-center gap-1.5 text-[13px] text-body"><MapPin size={13} className="text-violet" /> Areas Covered</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{areasCovered.count}{areasCovered.total ? `/${areasCovered.total}` : ''}</p>
          <p className="mt-1.5 truncate text-xs text-faint">{areasCovered.names.slice(0, 4).join(', ') || '—'}{areasCovered.names.length > 4 ? '…' : ''}</p>
        </div>
      </div>

      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>
      ) : (
        <DataTable
          columns={columns}
          rows={vendors}
          searchPlaceholder="Search"
          filters={[{ label: 'Status', key: 'status' }]}
          exportName="washermen"
          headerExtra={<Button size="sm" onClick={() => setAddOpen(true)}><Plus size={14} /> Add Washerman</Button>}
          pageSize={10}
          emptyText="No vendors yet."
        />
      )}

      {/* Add Washerman */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Washerman">
        <form onSubmit={addWasherman} className="space-y-4">
          <Input label="Full name" required placeholder="e.g. Ibrahim Musa" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Input label="Business name" required placeholder="e.g. Sparkle Cleaners" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          <Input label="Email" required type="email" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone number" required placeholder="+234 800 000 0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Areas covered</label>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-line p-2">
              {areas.length === 0 ? (
                <p className="px-2 py-1.5 text-sm text-faint">No areas configured yet.</p>
              ) : areas.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-section">
                  <input type="checkbox" checked={form.areaIds.includes(a.id)} onChange={() => toggleArea(a.id)} className="accent-primary" />
                  <span className="text-body">{a.name}</span>
                </label>
              ))}
            </div>
          </div>
          {addError && <p className="text-sm text-danger">{addError}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={adding}>Add Washerman</Button>
          </div>
        </form>
      </Modal>

      {/* Reject */}
      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title={`Reject ${rejecting?.user?.fullName ?? 'vendor'}`}>
        <div className="space-y-4">
          <Textarea label="Reason" placeholder="Why is this vendor being rejected?" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="danger" className="flex-1" loading={busy} onClick={reject}>Reject vendor</Button>
          </div>
        </div>
      </Modal>

      {/* Suspend */}
      <ConfirmModal
        open={!!suspending}
        onClose={() => setSuspending(null)}
        onConfirm={suspend}
        danger
        icon={<TriangleAlert size={20} />}
        title={`Suspend ${suspending?.user?.fullName ?? 'vendor'}?`}
        body="Suspending this vendor removes them from new order assignments immediately. Pending payouts are held until the suspension is lifted."
        confirmLabel={busy ? 'Suspending…' : 'Suspend'}
      />
    </div>
  );
}
