'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Eye, Pencil, PowerOff, Power } from 'lucide-react';
import { StatBlock } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { RowMenu } from '@/components/ui/RowMenu';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, SelectField } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { Bag, BagCatalogueCategory } from '@/types/ops';
import { MultiSearchSelect, SelectOption } from '../ui/MultiSearchSelect';
import { apiErr } from '@/lib/apiError';

/** Move these to '@/types/ops' if you prefer to keep types together. */

type Mode = 'create' | 'view' | 'edit';

interface FormState {
  name: string;
  description: string;
  allowedItemCount: string;
  eligibleItemIds: string[];
  eligibleCategoryIds: string[];
  sortOrder: string;
  isActive: 'true' | 'false';
}

const emptyForm: FormState = {
  name: '',
  description: '',
  allowedItemCount: '10',
  eligibleItemIds: [],
  eligibleCategoryIds: [],
  sortOrder: '0',
  isActive: 'true',
};

const toForm = (b: Bag): FormState => ({
  name: b.name,
  description: b.description ?? '',
  allowedItemCount: String(b.allowedItemCount),
  eligibleItemIds: [...b.eligibleItemIds],
  eligibleCategoryIds: [...b.eligibleCategoryIds],
  sortOrder: String(b.sortOrder),
  isActive: b.isActive ? 'true' : 'false',
});

const naira = (n: number) => `₦${Number(n).toLocaleString('en-NG')}`;
const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-[12px] text-faint">{label}</span>
      <span className="max-w-[65%] break-words text-right text-sm font-medium text-ink">{children}</span>
    </div>
  );
}

function NameChips({ ids, names, emptyLabel }: { ids: string[]; names: Map<string, string>; emptyLabel: string }) {
  if (ids.length === 0) return <>{emptyLabel}</>;
  return (
    <span className="flex flex-wrap justify-end gap-1.5">
      {ids.map((id) => (
        <span key={id} className="rounded-md bg-mint-soft px-2 py-0.5 text-[11px] font-medium text-forest">
          {names.get(id) ?? `${id.slice(0, 8)}…`}
        </span>
      ))}
    </span>
  );
}

/** Wash bags — list, add, view and edit. */
export function WashBagsTab() {
  const [bags, setBags] = useState<Bag[]>([]);
  const [categories, setCategories] = useState<BagCatalogueCategory[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('create');
  const [active, setActive] = useState<Bag | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [toggling, setToggling] = useState<Bag | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .get<{ success: boolean; data: Bag[] }>('/bags/all')
      .then((r) => setBags(r.data.data))
      .catch((err) => setError(err?.response?.data?.message ?? 'Failed to load bags.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // Catalogue (categories + nested items) powers the eligible item/category pickers.
  useEffect(() => {
    setCatalogueLoading(true);
    api
      .get<{ success: boolean; data: BagCatalogueCategory[] }>('/catalogue')
      .then((r) => setCategories(r.data.data))
      .catch(() => setCategories([]))
      .finally(() => setCatalogueLoading(false));
  }, []);

  const categoryOptions = useMemo<SelectOption[]>(
    () =>
      categories.map((c) => ({
        id: c.id,
        label: c.name,
        hint: `${c.items.length} item${c.items.length === 1 ? '' : 's'}`,
      })),
    [categories],
  );

  const itemOptions = useMemo<SelectOption[]>(
    () =>
      categories.flatMap((c) =>
        c.items.map((i) => ({ id: i.id, label: i.name, hint: c.name })),
      ),
    [categories],
  );

  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const itemNames = useMemo(
    () => new Map(categories.flatMap((c) => c.items.map((i) => [i.id, i.name] as const))),
    [categories],
  );

  function openCreate() {
    setActive(null);
    setForm(emptyForm);
    setFormError('');
    setMode('create');
    setModalOpen(true);
  }

  function openView(b: Bag) {
    setActive(b);
    setForm(toForm(b));
    setFormError('');
    setMode('view');
    setModalOpen(true);
  }

  function openEdit(b: Bag) {
    setActive(b);
    setForm(toForm(b));
    setFormError('');
    setMode('edit');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    const count = Number(form.allowedItemCount);
    const order = Number(form.sortOrder);
    if (!form.name.trim()) return setFormError('Name is required.');
    if (!Number.isInteger(count) || count < 1) return setFormError('Allowed item count must be a whole number of at least 1.');
    if (!Number.isFinite(order)) return setFormError('Sort order must be a number.');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      allowedItemCount: count,
      eligibleItemIds: form.eligibleItemIds,
      eligibleCategoryIds: form.eligibleCategoryIds,
      sortOrder: order,
    };

    setSaving(true);
    try {
      if (mode === 'edit' && active) {
        // Assumes PATCH /bags/:id (same pattern as /reps/:id). isActive is only sent on edit.
        await api.patch(`/bags/${active.id}`, { ...payload, isActive: form.isActive === 'true' });
      } else {
        await api.post('/bags', payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      const e2 = err as { response?: { data?: { message?: string | string[] } } };
      const m = e2.response?.data?.message;
      setFormError(Array.isArray(m) ? m.join(', ') : m ?? 'Could not save bag.');
    } finally {
      setSaving(false);
    }
  }

    async function confirmToggle() {
      if (!toggling) return;
      setBusy(true);
      try {
        // Assumes PATCH /bags/:id { isActive }. Swap for a dedicated endpoint if you have one.
        await api.patch(`/bags/${toggling.id}`, { isActive: !toggling.isActive });
        setToggling(null);
        load();
      } catch (err) {
        setError(apiErr(err));
        setToggling(null);
      } finally {
        setBusy(false);
      }
    }

  const activeCount = bags.filter((b) => b.isActive).length;

  const columns: Column<Bag>[] = [
    {
      key: 'name', header: 'Name', sortable: true, value: (b) => b.name,
      render: (b) => (
        <span className="flex flex-col">
          <span className="font-medium text-ink">{b.name}</span>
          <span className="text-[11px] text-faint">{b.slug}</span>
        </span>
      ),
    },
    {
      key: 'items', header: 'Item capacity', sortable: true, value: (b) => b.allowedItemCount,
      render: (b) => <span className="text-ink">{b.allowedItemCount} items</span>,
    },
    {
      key: 'eligible', header: 'Eligibility',
      render: (b) => {
        const nc = b.eligibleCategoryIds.length;
        const ni = b.eligibleItemIds.length;
        if (nc === 0 && ni === 0) return <span className="text-[11px] text-faint">Everything</span>;
        return (
          <span className="text-[11px] text-ink">
            {nc > 0 && `${nc} categor${nc === 1 ? 'y' : 'ies'}`}
            {nc > 0 && ni > 0 && ' · '}
            {ni > 0 && `${ni} item${ni === 1 ? '' : 's'}`}
          </span>
        );
      },
    },
    {
      key: 'priceNgn', header: 'Price (NGN)', sortable: true, value: (b) => b.priceNgn,
      render: (b) => <span className="text-ink">{naira(b.priceNgn)}</span>,
    },
    {
      key: 'priceWp', header: 'Price (WP)', sortable: true, value: (b) => b.priceWp,
      render: (b) => <span className="text-ink">{b.priceWp.toLocaleString()}</span>,
    },
    {
      key: 'sortOrder', header: 'Order', sortable: true, value: (b) => b.sortOrder,
      render: (b) => <span className="text-faint">{b.sortOrder}</span>,
    },
    {
      key: 'status', header: 'Status', sortable: true, value: (b) => (b.isActive ? 'active' : 'inactive'),
      render: (b) => <Chip>{b.isActive ? 'active' : 'inactive'}</Chip>,
    },
    {
      key: 'menu', header: '', render: (b) => (
        <RowMenu
          items={[
            { label: 'View Details', icon: <Eye size={14} />, onClick: () => openView(b) },
            { label: 'Edit Bag', icon: <Pencil size={14} />, onClick: () => openEdit(b) },
             {
              label: b.isActive ? 'Deactivate' : 'Activate',
              icon: b.isActive ? <PowerOff size={14} /> : <Power size={14} />,
              danger: b.isActive,
              onClick: () => setToggling(b),
            },
          ]}
        />
      ),
    },
  ];

  const title =
    mode === 'create' ? 'Add Bag' : mode === 'edit' ? `Edit — ${active?.name ?? 'Bag'}` : active?.name ?? 'Bag details';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Total bags" value={String(bags.length)} hint="All bag types" />
        <StatBlock label="Active" value={String(activeCount)} hint="Available to customers" />
      </div>

      {error ? (
        <p className="py-12 text-center text-sm text-danger">{error}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={bags}
          loading={loading}
          searchPlaceholder="Search bags"
          pageSize={10}
          emptyText="No bags yet. Add your first bag to get started."
          headerExtra={
            <button
              onClick={openCreate}
              className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
            >
              <Plus size={14} /> Add Bag
            </button>
          }
        />
      )}

      <Modal open={modalOpen} onClose={closeModal} title={title}>
        {mode === 'view' && active ? (
          <div className="space-y-4">
            <div>
              <DetailRow label="Name">{active.name}</DetailRow>
              <DetailRow label="Slug">{active.slug}</DetailRow>
              <DetailRow label="Description">{active.description || '—'}</DetailRow>
              <DetailRow label="Allowed items">{active.allowedItemCount}</DetailRow>
              <DetailRow label="Price (NGN)">{naira(active.priceNgn)}</DetailRow>
              <DetailRow label="Price (WP)">{active.priceWp.toLocaleString()}</DetailRow>
              <DetailRow label="Price computed">{fmtDate(active.priceComputedAt)}</DetailRow>
              <DetailRow label="Sort order">{active.sortOrder}</DetailRow>
              <DetailRow label="Status">
                <Chip>{active.isActive ? 'active' : 'inactive'}</Chip>
              </DetailRow>
              <DetailRow label="Eligible categories">
                <NameChips ids={active.eligibleCategoryIds} names={categoryNames} emptyLabel="All categories" />
              </DetailRow>
              <DetailRow label="Eligible items">
                <NameChips ids={active.eligibleItemIds} names={itemNames} emptyLabel="All items" />
              </DetailRow>
              <DetailRow label="Created">{fmtDate(active.createdAt)}</DetailRow>
              <DetailRow label="Last updated">{fmtDate(active.updatedAt)}</DetailRow>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>Close</Button>
              <Button type="button" className="flex-1" onClick={() => setMode('edit')}>Edit</Button>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={submit}>
            <Input
              label="Name" required placeholder="e.g. Medium Bag"
              value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Description" placeholder="Optional"
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Allowed item count" required type="number" min={1} placeholder="10"
                value={form.allowedItemCount} onChange={(e) => setForm((f) => ({ ...f, allowedItemCount: e.target.value }))}
              />
              <Input
                label="Sort order" type="number" placeholder="0"
                value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>

            <MultiSearchSelect
              label="Eligible categories"
              placeholder="Search categories…"
              helper="Leave empty to allow all categories."
              loading={catalogueLoading}
              options={categoryOptions}
              value={form.eligibleCategoryIds}
              onChange={(ids) => setForm((f) => ({ ...f, eligibleCategoryIds: ids }))}
            />
            <MultiSearchSelect
              label="Eligible items"
              placeholder="Search items by name or category…"
              helper="Leave empty to allow all items."
              loading={catalogueLoading}
              options={itemOptions}
              value={form.eligibleItemIds}
              onChange={(ids) => setForm((f) => ({ ...f, eligibleItemIds: ids }))}
            />

            {mode === 'edit' && (
              <SelectField
                label="Status" value={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value as 'true' | 'false' }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </SelectField>
            )}
            <p className="text-[11px] text-faint">Prices (NGN and WP) are computed automatically by the server.</p>
            {formError && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{formError}</p>}
            <div className="flex gap-3 pt-2">
              <Button
                type="button" variant="outline" className="flex-1"
                onClick={() => (mode === 'edit' && active ? openView(active) : closeModal())}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" loading={saving}>
                {mode === 'edit' ? 'Save changes' : 'Add Bag'}
              </Button>
            </div>
          </form>
        )}
      </Modal>


            <ConfirmModal
              open={!!toggling}
              onClose={() => setToggling(null)}
              onConfirm={confirmToggle}
              icon={toggling?.isActive ? <PowerOff size={20} /> : <Power size={20} />}
              danger={!!toggling?.isActive}
              title={toggling?.isActive ? `Deactivate ${toggling?.name}?` : `Activate ${toggling?.name ?? 'bundle'}?`}
              body={
                toggling?.isActive
                  ? 'Deactivating hides this bag from customers so it can no longer be purchased. You can reactivate it at any time.'
                  : 'Activating makes this bag visible and purchasable by customers again.'
              }
              confirmLabel={busy ? 'Saving…' : toggling?.isActive ? 'Deactivate' : 'Activate'}
            />
    </div>
  );
}