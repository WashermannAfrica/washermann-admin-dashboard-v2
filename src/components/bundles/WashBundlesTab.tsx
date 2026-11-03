'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Eye, Pencil, Power, PowerOff, Trash2 } from 'lucide-react';
import { StatBlock } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { RowMenu } from '@/components/ui/RowMenu';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDate } from '@/lib/utils';
import type { SelectOption } from '../ui/MultiSearchSelect';
import { SearchSelect } from '../ui/SearchSelect';
import { Bundle, BundleLine } from '@/types/ops';

/** Move these to '@/types/ops' if you prefer to keep types together. */


interface CatalogueItem { id: string; name: string }
interface CatalogueCategory { id: string; name: string; items: CatalogueItem[] }

type Mode = 'create' | 'view' | 'edit';

interface LineForm {
  key: string;
  lineType: 'item' | 'category';
  targetId: string;
  quantity: string;
}

interface FormState {
  name: string;
  description: string;
  imageUrl: string;
  lines: LineForm[];
  isPromo: boolean;
  promoType: 'percentage' | 'fixed';
  promoValue: string;
  expiresAt: string; // datetime-local value
  sortOrder: string;
}

let keySeq = 0;
const newLine = (over: Partial<LineForm> = {}): LineForm => ({
  key: `l${++keySeq}`,
  lineType: 'item',
  targetId: '',
  quantity: '1',
  ...over,
});

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  imageUrl: '',
  lines: [newLine()],
  isPromo: false,
  promoType: 'percentage',
  promoValue: '',
  expiresAt: '',
  sortOrder: '0',
});

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toForm = (b: Bundle): FormState => ({
  name: b.name,
  description: b.description ?? '',
  imageUrl: b.imageUrl ?? '',
  lines: [...b.lines]
    .sort((a, c) => a.sortOrder - c.sortOrder)
    .map((l) =>
      newLine({
        lineType: l.lineType,
        targetId: (l.lineType === 'item' ? l.itemId : l.categoryId) ?? '',
        quantity: String(l.quantity),
      }),
    ),
  isPromo: b.isPromo,
  promoType: b.promoType ?? 'percentage',
  promoValue: b.promoValue != null ? String(b.promoValue) : '',
  expiresAt: toLocalInput(b.expiresAt),
  sortOrder: String(b.sortOrder),
});

const naira = (n: number) => `₦${Number(n).toLocaleString('en-NG')}`;
const fmtDateTime = (s?: string | null) => (s ? new Date(s).toLocaleString() : '—');
const promoText = (b: Bundle) =>
  b.isPromo && b.promoValue != null
    ? b.promoType === 'percentage'
      ? `${b.promoValue}% off`
      : `${naira(b.promoValue)} off`
    : '—';

const fieldCls =
  'h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-primary';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-[12px] text-faint">{label}</span>
      <span className="max-w-[65%] break-words text-right text-sm font-medium text-ink">{children}</span>
    </div>
  );
}

/** Wash bundles — list, add, view, edit, activate/deactivate. */
export function WashBundlesTab() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [categories, setCategories] = useState<CatalogueCategory[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('create');
  const [active, setActive] = useState<Bundle | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [toggling, setToggling] = useState<Bundle | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .get<{ success: boolean; data: Bundle[] }>('/bundles/all')
      .then((r) => setBundles(r.data.data))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    setCatalogueLoading(true);
    api
      .get<{ success: boolean; data: CatalogueCategory[] }>('/catalogue')
      .then((r) => setCategories(r.data.data))
      .catch(() => setCategories([]))
      .finally(() => setCatalogueLoading(false));
  }, []);

  const itemOptions = useMemo<SelectOption[]>(
    () => categories.flatMap((c) => c.items.map((i) => ({ id: i.id, label: i.name, hint: c.name }))),
    [categories],
  );
  const categoryOptions = useMemo<SelectOption[]>(
    () => categories.map((c) => ({ id: c.id, label: c.name, hint: `${c.items.length} items` })),
    [categories],
  );
  const itemNames = useMemo(
    () => new Map(categories.flatMap((c) => c.items.map((i) => [i.id, `${i.name} (${c.name})`] as const))),
    [categories],
  );
  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const lineLabel = (l: BundleLine) => {
    if (l.lineType === 'item') return itemNames.get(l.itemId ?? '') ?? `Item ${(l.itemId ?? '').slice(0, 8)}…`;
    return `${categoryNames.get(l.categoryId ?? '') ?? `Category ${(l.categoryId ?? '').slice(0, 8)}…`} (category)`;
  };

  function openCreate() {
    setActive(null);
    setForm(emptyForm());
    setFormError('');
    setMode('create');
    setModalOpen(true);
  }
  function openView(b: Bundle) {
    setActive(b);
    setForm(toForm(b));
    setFormError('');
    setMode('view');
    setModalOpen(true);
  }
  function openEdit(b: Bundle) {
    setActive(b);
    setForm(toForm(b));
    setFormError('');
    setMode('edit');
    setModalOpen(true);
  }

  const updateLine = (key: string, patch: Partial<LineForm>) =>
    setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));
  const removeLine = (key: string) =>
    setForm((f) => ({ ...f, lines: f.lines.filter((l) => l.key !== key) }));
  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, newLine()] }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) return setFormError('Name is required.');
    if (form.lines.length === 0) return setFormError('Add at least one line.');
    for (const [i, l] of form.lines.entries()) {
      const q = Number(l.quantity);
      if (!l.targetId) return setFormError(`Line ${i + 1}: choose an ${l.lineType}.`);
      if (!Number.isInteger(q) || q < 1) return setFormError(`Line ${i + 1}: quantity must be a whole number of at least 1.`);
    }
    const order = Number(form.sortOrder);
    if (!Number.isFinite(order)) return setFormError('Sort order must be a number.');

    let promoValue: number | undefined;
    if (form.isPromo) {
      promoValue = Number(form.promoValue);
      if (!Number.isFinite(promoValue) || promoValue <= 0) return setFormError('Enter a promo value greater than 0.');
      if (form.promoType === 'percentage' && promoValue > 100) return setFormError('A percentage promo cannot exceed 100.');
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      lines: form.lines.map((l) => ({
        lineType: l.lineType,
        ...(l.lineType === 'item' ? { itemId: l.targetId } : { categoryId: l.targetId }),
        quantity: Number(l.quantity),
      })),
      isPromo: form.isPromo,
      promoType: form.isPromo ? form.promoType : undefined,
      promoValue: form.isPromo ? promoValue : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      sortOrder: order,
    };

    setSaving(true);
    try {
      if (mode === 'edit' && active) {
        // Assumes PATCH /bundles/:id accepts the same body as create.
        await api.patch(`/bundles/${active.id}`, payload);
      } else {
        await api.post('/bundles', payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(apiErr(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmToggle() {
    if (!toggling) return;
    setBusy(true);
    try {
      // Assumes PATCH /bundles/:id { isActive }. Swap for a dedicated endpoint if you have one.
      await api.patch(`/bundles/${toggling.id}`, { isActive: !toggling.isActive });
      setToggling(null);
      load();
    } catch (err) {
      setError(apiErr(err));
      setToggling(null);
    } finally {
      setBusy(false);
    }
  }

  const activeCount = bundles.filter((b) => b.isActive).length;
  const promoCount = bundles.filter((b) => b.isActive && b.isPromo).length;

  const columns: Column<Bundle>[] = [
    {
      key: 'name', header: 'Bundle', sortable: true, value: (b) => b.name,
      render: (b) => (
        <button onClick={() => openView(b)} className="text-left">
          <span className="block font-medium text-ink hover:underline">{b.name}</span>
          <span className="text-[11px] text-faint">{b.slug}</span>
        </button>
      ),
    },
    {
      key: 'contents', header: 'Contents', value: (b) => b.lines.length,
      render: (b) => {
        const pcs = b.lines.reduce((s, l) => s + l.quantity, 0);
        return <span className="text-ink">{b.lines.length} line{b.lines.length === 1 ? '' : 's'} · {pcs} pcs</span>;
      },
    },
    {
      key: 'price', header: 'Price (NGN)', sortable: true, value: (b) => b.effectivePriceNgn,
      render: (b) =>
        b.isPromo && b.effectivePriceNgn !== b.priceNgn ? (
          <span className="flex flex-col">
            <span className="font-medium text-ink">{naira(b.effectivePriceNgn)}</span>
            <span className="text-[11px] text-faint line-through">{naira(b.priceNgn)}</span>
          </span>
        ) : (
          <span className="text-ink">{naira(b.priceNgn)}</span>
        ),
    },
    {
      key: 'promo', header: 'Promo',
      render: (b) => (b.isPromo ? <Badge variant="blue">{promoText(b)}</Badge> : <span className="text-[11px] text-faint">—</span>),
    },
    {
      key: 'expires', header: 'Expires', value: (b) => b.expiresAt ?? '',
      render: (b) => <span className="text-body">{b.expiresAt ? formatDate(b.expiresAt) : 'Never'}</span>,
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
            { label: 'Edit Bundle', icon: <Pencil size={14} />, onClick: () => openEdit(b) },
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
    mode === 'create' ? 'Add Bundle' : mode === 'edit' ? `Edit — ${active?.name ?? 'Bundle'}` : active?.name ?? 'Bundle details';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatBlock label="Total bundles" value={String(bundles.length)} hint="All bundles" />
        <StatBlock label="Active" value={String(activeCount)} hint="Visible to customers" />
        <StatBlock label="On promo" value={String(promoCount)} hint="Active with a promo" />
      </div>

      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

      <DataTable
        columns={columns}
        rows={bundles}
        loading={loading}
        searchPlaceholder="Search bundles"
        filters={[{ label: 'Status', options: ['active', 'inactive'] }]}
        pageSize={10}
        emptyText="No bundles yet. Add your first bundle to get started."
        headerExtra={
          <button
            onClick={openCreate}
            className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
          >
            <Plus size={14} /> Add Bundle
          </button>
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={title}>
        {mode === 'view' && active ? (
          <div className="space-y-4">
            <div>
              <DetailRow label="Name">{active.name}</DetailRow>
              <DetailRow label="Slug">{active.slug}</DetailRow>
              <DetailRow label="Description">{active.description || '—'}</DetailRow>
              <DetailRow label="Image URL">{active.imageUrl || '—'}</DetailRow>
              <DetailRow label="Status"><Chip>{active.isActive ? 'active' : 'inactive'}</Chip></DetailRow>
              <DetailRow label="Base price">
                {naira(active.priceNgn)} · {active.priceWp.toLocaleString()} WP
              </DetailRow>
              <DetailRow label="Promo">{promoText(active)}</DetailRow>
              {active.isPromo && (
                <DetailRow label="Effective price">
                  {naira(active.effectivePriceNgn)} · {active.effectivePriceWp.toLocaleString()} WP
                </DetailRow>
              )}
              <DetailRow label="Expires">{fmtDateTime(active.expiresAt)}</DetailRow>
              <DetailRow label="Sort order">{active.sortOrder}</DetailRow>
              <DetailRow label="Price computed">{fmtDateTime(active.priceComputedAt)}</DetailRow>
              <DetailRow label="Created">{fmtDateTime(active.createdAt)}</DetailRow>
              <DetailRow label="Last updated">{fmtDateTime(active.updatedAt)}</DetailRow>
            </div>

            <div>
              <p className="mb-1 text-[13px] font-semibold text-ink">Contents</p>
              <div className="rounded-xl border border-line px-3">
                {[...active.lines].sort((a, b) => a.sortOrder - b.sortOrder).map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-3 border-b border-line py-2 text-sm last:border-0">
                    <span className="text-ink">{lineLabel(l)}</span>
                    <span className="font-medium text-forest">× {l.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Close</Button>
              <Button type="button" className="flex-1" onClick={() => setMode('edit')}>Edit</Button>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={submit}>
            <Input
              label="Name" required placeholder="e.g. Family Pack"
              value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Description" placeholder="Optional"
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Input
              label="Image URL" placeholder="https://… (optional)"
              value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-ink">Contents *</span>
                <button
                  type="button" onClick={addLine}
                  className="flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
                >
                  <Plus size={12} /> Add line
                </button>
              </div>
              {form.lines.map((l) => (
                <div key={l.key} className="flex items-start gap-2">
                  <select
                    value={l.lineType}
                    onChange={(e) => updateLine(l.key, { lineType: e.target.value as 'item' | 'category', targetId: '' })}
                    className={`${fieldCls} w-28 shrink-0`}
                    aria-label="Line type"
                  >
                    <option value="item">Item</option>
                    <option value="category">Category</option>
                  </select>
                  <div className="min-w-0 flex-1">
                    <SearchSelect
                      loading={catalogueLoading}
                      options={l.lineType === 'item' ? itemOptions : categoryOptions}
                      value={l.targetId}
                      onChange={(id) => updateLine(l.key, { targetId: id })}
                      placeholder={l.lineType === 'item' ? 'Search items…' : 'Search categories…'}
                    />
                  </div>
                  <input
                    type="number" min={1} aria-label="Quantity"
                    value={l.quantity}
                    onChange={(e) => updateLine(l.key, { quantity: e.target.value })}
                    className={`${fieldCls} w-16 shrink-0 text-center`}
                  />
                  <button
                    type="button" onClick={() => removeLine(l.key)} aria-label="Remove line"
                    disabled={form.lines.length === 1}
                    className="flex h-10 w-9 shrink-0 items-center justify-center rounded-xl text-faint hover:bg-section hover:text-danger disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-xl border border-line p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox" checked={form.isPromo}
                  onChange={(e) => setForm((f) => ({ ...f, isPromo: e.target.checked }))}
                />
                This bundle is on promo
              </label>
              {form.isPromo && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink">
                    Promo type
                    <select
                      value={form.promoType}
                      onChange={(e) => setForm((f) => ({ ...f, promoType: e.target.value as 'percentage' | 'fixed' }))}
                      className={fieldCls}
                    >
                      <option value="percentage">Percentage off</option>
                      <option value="fixed">Fixed amount off (₦)</option>
                    </select>
                  </label>
                  <Input
                    label={form.promoType === 'percentage' ? 'Percent off' : 'Amount off (₦)'}
                    type="number" min={0} placeholder={form.promoType === 'percentage' ? '10' : '500'}
                    value={form.promoValue} onChange={(e) => setForm((f) => ({ ...f, promoValue: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Expires at" type="datetime-local"
                value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              />
              <Input
                label="Sort order" type="number" placeholder="0"
                value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>

            <p className="text-[11px] text-faint">Prices are computed automatically by the server from the bundle contents.</p>
            {formError && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{formError}</p>}
            <div className="flex gap-3 pt-2">
              <Button
                type="button" variant="outline" className="flex-1"
                onClick={() => (mode === 'edit' && active ? openView(active) : setModalOpen(false))}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" loading={saving}>
                {mode === 'edit' ? 'Save changes' : 'Add Bundle'}
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
            ? 'Deactivating hides this bundle from customers so it can no longer be purchased. You can reactivate it at any time.'
            : 'Activating makes this bundle visible and purchasable by customers again.'
        }
        confirmLabel={busy ? 'Saving…' : toggling?.isActive ? 'Deactivate' : 'Activate'}
      />
    </div>
  );
}