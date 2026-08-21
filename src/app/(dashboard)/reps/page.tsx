'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRound, Plus, ArrowUpRight, TriangleAlert, Mail, ShieldCheck, MapPin } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Stars } from '@/components/ui/Stars';
import { RowMenu } from '@/components/ui/RowMenu';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, SelectField } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import type { Paginated } from '@/types';
import type { Rep, Area } from '@/types/ops';

export default function RepsPage() {
  const router = useRouter();
  const [reps, setReps] = useState<Rep[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [suspending, setSuspending] = useState<Rep | null>(null);
  const [assigning, setAssigning] = useState<Rep | null>(null);
  const [assignAreaId, setAssignAreaId] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', areaId: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const areaName = useCallback(
    (id: string) => areas.find((a) => a.id === id)?.name ?? 'Area',
    [areas],
  );

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<{ by: string; dir: 'ASC' | 'DESC' } | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (sort) { params.set('sortBy', sort.by); params.set('sortDir', sort.dir); }
    Promise.all([
      api.get<Paginated<Rep>>(`/reps?${params.toString()}`),
      api.get<Paginated<Area>>('/areas?limit=100'),
    ])
      .then(([r, a]) => {
        setReps(r.data.data);
        setTotal(r.data.meta.total);
        setAreas(a.data.data);
      })
      .catch((err) => setError(err?.response?.data?.message ?? 'Failed to load reps.'))
      .finally(() => setLoading(false));
  }, [search, page, status, sort]);

  useEffect(load, [load]);

  async function addRep(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.post('/reps', {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        areaIds: form.areaId ? [form.areaId] : undefined,
      });
      setAddOpen(false);
      setForm({ fullName: '', email: '', phone: '', areaId: '' });
      load();
    } catch (err) {
      const e2 = err as { response?: { data?: { message?: string | string[] } } };
      const m = e2.response?.data?.message;
      setFormError(Array.isArray(m) ? m.join(', ') : m ?? 'Could not create rep.');
    } finally {
      setSaving(false);
    }
  }

  async function suspendRep() {
    if (!suspending) return;
    const next = suspending.status === 'suspended' ? 'active' : 'suspended';
    try {
      await api.patch(`/reps/${suspending.id}`, { status: next });
      setSuspending(null);
      load();
    } catch {
      setSuspending(null);
    }
  }

  function openAssign(rep: Rep) {
    setAssignAreaId(rep.areaIds[0] ?? '');
    setAssigning(rep);
  }

  async function saveAssign() {
    if (!assigning) return;
    setAssignSaving(true);
    try {
      await api.patch(`/reps/${assigning.id}`, { areaIds: assignAreaId ? [assignAreaId] : [] });
      setAssigning(null);
      load();
    } catch {
      /* keep modal open on failure */
    } finally {
      setAssignSaving(false);
    }
  }

  async function clearFlag(rep: Rep) {
    try {
      await api.post(`/reps/${rep.id}/clear-flag`);
      load();
    } catch {
      /* ignore */
    }
  }

  const availableCount = reps.filter((r) => r.isAvailable).length;
  const flaggedCount = reps.filter((r) => r.flaggedForReview).length;

  const columns: Column<Rep>[] = [
    {
      key: 'name', header: 'Name', sortable: true, value: (r) => r.user?.fullName ?? '',
      render: (r) => (
        <span className="flex items-center gap-2.5 font-medium text-ink">
          <Avatar name={r.user?.fullName ?? '—'} size={28} dot={r.isAvailable} /> {r.user?.fullName ?? '—'}
        </span>
      ),
    },
    {
      key: 'area', header: 'Areas', render: (r) =>
        r.areaIds.length === 0 ? (
          <span className="text-[11px] text-faint">—</span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <span className="rounded-md bg-mint-soft px-2 py-0.5 text-[11px] font-medium text-forest">{areaName(r.areaIds[0])}</span>
            {r.areaIds.length > 1 && <span className="text-[11px] text-faint">+{r.areaIds.length - 1}</span>}
          </span>
        ),
    },
    { key: 'phone', header: 'Phone', render: (r) => <span className="text-ink">{r.user?.phone ?? r.phone ?? '—'}</span> },
    {
      key: 'rating', header: 'Ratings', value: (r) => r.rating,
      render: (r) => (
        <span className="flex items-center gap-1.5">
          <Stars rating={Math.round(r.rating)} /> <span className="text-[11px] text-faint">({r.ratingCount})</span>
        </span>
      ),
    },
    {
      key: 'status', header: 'Status', sortable: true, value: (r) => r.status,
      render: (r) => (
        <span className="flex items-center gap-1.5">
          <Chip>{r.status}</Chip>
          {r.flaggedForReview && <Chip tone="warn">Flagged</Chip>}
        </span>
      ),
    },
    {
      key: 'menu', header: '', render: (r) => (
        <RowMenu
          items={[
            { label: 'View Details', icon: <ArrowUpRight size={14} />, onClick: () => router.push(`/reps/${r.id}`) },
            { label: 'Assign area', icon: <MapPin size={14} />, onClick: () => openAssign(r) },
            ...(r.flaggedForReview ? [{ label: 'Clear Flag', icon: <ShieldCheck size={14} />, onClick: () => clearFlag(r) }] : []),
            {
              label: r.status === 'suspended' ? 'Reactivate Rep' : 'Suspend Rep',
              icon: <TriangleAlert size={14} />,
              danger: r.status !== 'suspended',
              onClick: () => setSuspending(r),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi
        icon={<UserRound size={16} />}
        iconClass="bg-primary text-white"
        label="Total Reps"
        value={String(reps.length)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Available now" value={String(availableCount)} hint="On duty" />
        <StatBlock label="Flagged for review" value={String(flaggedCount)} hint="Low rating" />
      </div>

      {error ? (
        <p className="py-12 text-center text-sm text-danger">{error}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={reps}
          loading={loading}
          searchPlaceholder="Search by name, email or phone"
          onSearch={(q) => { setSearch(q); setPage(1); }}
          serverPagination={{ page, pageSize: 20, total, onPageChange: setPage }}
          onSort={(by, dir) => { setSort({ by, dir: dir === 1 ? 'ASC' : 'DESC' }); setPage(1); }}
          onFilter={(label, v) => { if (label === 'Status') { setStatus(v); setPage(1); } }}
          filters={[{ label: 'Status', options: ['active', 'inactive', 'suspended'] }]}
          pageSize={10}
          emptyText="No reps yet. Add your first rep to get started."
          headerExtra={
            <button
              onClick={() => setAddOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
            >
              <Plus size={14} /> Add Rep
            </button>
          }
        />
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Rep">
        <form className="space-y-4" onSubmit={addRep}>
          <Input
            label="Full Name" required placeholder="e.g. Emeka Obi"
            value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          />
          <Input
            label="Email" required type="email" placeholder="you@company.com" leftIcon={<Mail size={15} />}
            value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Phone number" required placeholder="+2348012345678"
            value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <SelectField
            label="Area" value={form.areaId}
            onChange={(e) => setForm((f) => ({ ...f, areaId: e.target.value }))}
          >
            <option value="">Select area (optional)</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </SelectField>
          {formError && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{formError}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>Add Rep</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!assigning} onClose={() => setAssigning(null)} title={`Assign area — ${assigning?.user?.fullName ?? 'Rep'}`}>
        <div className="space-y-4">
          <p className="text-sm text-body">Set the service area this rep is broadcast orders for.</p>
          <SelectField label="Area" value={assignAreaId} onChange={(e) => setAssignAreaId(e.target.value)}>
            <option value="">No area</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </SelectField>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAssigning(null)}>Cancel</Button>
            <Button type="button" className="flex-1" loading={assignSaving} onClick={saveAssign}>Save</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!suspending}
        onClose={() => setSuspending(null)}
        onConfirm={suspendRep}
        icon={<TriangleAlert size={20} />}
        danger={suspending?.status !== 'suspended'}
        title={suspending?.status === 'suspended' ? `Reactivate ${suspending?.user?.fullName ?? 'Rep'}?` : `Suspend ${suspending?.user?.fullName ?? 'Rep'}?`}
        body={
          suspending?.status === 'suspended'
            ? 'Reactivating this rep makes them eligible for pickup and delivery assignments again.'
            : 'Suspending this rep removes them from new pickup and delivery assignments immediately. Their history and earnings remain intact.'
        }
        confirmLabel={suspending?.status === 'suspended' ? 'Reactivate' : 'Suspend Rep'}
      />
    </div>
  );
}
