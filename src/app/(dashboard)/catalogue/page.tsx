'use client';

import { useCallback, useEffect, useState } from 'react';
import { Shirt, Plus, Pencil, FolderPlus } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { Section, Panel } from '@/components/ui/Section';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, SelectField, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import type { ApiResponse } from '@/types';
import type { CatalogueCategory, CatalogueItem } from '@/types/ops';

const naira = (n: number | null) => (n == null ? '—' : `₦${Number(n).toLocaleString()}`);

export default function CataloguePage() {
  const [categories, setCategories] = useState<CatalogueCategory[]>([]);
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [catModal, setCatModal] = useState<{ open: boolean; edit?: CatalogueCategory }>({ open: false });
  const [catForm, setCatForm] = useState({ name: '', description: '', sortOrder: '' });
  const [itemModal, setItemModal] = useState<{ open: boolean; edit?: CatalogueItem; categoryId?: string }>({ open: false });
  const [itemForm, setItemForm] = useState({ name: '', categoryId: '', isEveryday: false });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<ApiResponse<CatalogueCategory[]>>('/catalogue/categories'),
      api.get<ApiResponse<CatalogueItem[]>>('/catalogue/items'),
    ])
      .then(([c, i]) => {
        setCategories((Array.isArray(c.data.data) ? c.data.data : []).slice().sort((a, b) => a.sortOrder - b.sortOrder));
        setItems(Array.isArray(i.data.data) ? i.data.data : []);
      })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // ─── category modal ──────────────────────────────────────────────────────────
  function openCat(edit?: CatalogueCategory) {
    setCatForm({ name: edit?.name ?? '', description: edit?.description ?? '', sortOrder: edit ? String(edit.sortOrder) : '' });
    setFormError('');
    setCatModal({ open: true, edit });
  }
  async function saveCat(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    const body = { name: catForm.name.trim(), description: catForm.description.trim() || undefined, sortOrder: catForm.sortOrder ? Number(catForm.sortOrder) : undefined };
    try {
      if (catModal.edit) await api.patch(`/catalogue/categories/${catModal.edit.id}`, body);
      else await api.post('/catalogue/categories', body);
      setCatModal({ open: false });
      load();
    } catch (err) { setFormError(apiErr(err)); } finally { setSaving(false); }
  }
  async function toggleCat(c: CatalogueCategory) {
    const next = !c.isActive;
    setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: next } : x)));
    try {
      await api.patch(`/catalogue/categories/${c.id}`, { isActive: next });
    } catch (err) {
      setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: c.isActive } : x)));
      setError(apiErr(err));
    }
  }

  // ─── item modal ──────────────────────────────────────────────────────────────
  function openItem(opts: { edit?: CatalogueItem; categoryId?: string }) {
    setItemForm({ name: opts.edit?.name ?? '', categoryId: opts.edit?.categoryId ?? opts.categoryId ?? categories[0]?.id ?? '', isEveryday: opts.edit?.isEveryday ?? false });
    setFormError('');
    setItemModal({ open: true, edit: opts.edit, categoryId: opts.categoryId });
  }
  async function saveItem(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    const body = { categoryId: itemForm.categoryId, name: itemForm.name.trim(), isEveryday: itemForm.isEveryday };
    try {
      if (itemModal.edit) await api.patch(`/catalogue/items/${itemModal.edit.id}`, body);
      else await api.post('/catalogue/items', body);
      setItemModal({ open: false });
      load();
    } catch (err) { setFormError(apiErr(err)); } finally { setSaving(false); }
  }
  async function toggleItem(it: CatalogueItem) {
    const next = !it.isActive;
    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, isActive: next } : x)));
    try {
      await api.patch(`/catalogue/items/${it.id}`, { isActive: next });
    } catch (err) {
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, isActive: it.isActive } : x)));
      setError(apiErr(err));
    }
  }

  const activeItems = items.filter((i) => i.isActive).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageKpi icon={<Shirt size={16} />} iconClass="bg-violet text-white" label="Catalogue items" value={String(items.length)} />
      <p className="-mt-3 text-sm text-body">These are the laundry items vendors set prices for and customers order. Changes here flow straight to the vendor pricing screen and the customer catalogue.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Categories" value={String(categories.length)} hint={`${categories.filter((c) => c.isActive).length} active`} />
        <StatBlock label="Active items" value={String(activeItems)} hint={`of ${items.length}`} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => openCat()}><FolderPlus size={15} /> Add category</Button>
        <Button variant="outline" onClick={() => openItem({})} disabled={categories.length === 0}><Plus size={15} /> Add item</Button>
      </div>

      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>
      ) : categories.length === 0 ? (
        <p className="py-12 text-center text-sm text-faint">No categories yet. Add your first category to start building the catalogue.</p>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.categoryId === cat.id);
            return (
              <Section key={cat.id}>
                <Panel>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-ink">{cat.name}</h3>
                      {!cat.isActive && <Badge variant="neutral">Hidden</Badge>}
                      <span className="text-xs text-faint">{catItems.length} item{catItems.length === 1 ? '' : 's'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleCat(cat)} className="text-xs text-body hover:text-ink">{cat.isActive ? 'Hide' : 'Show'}</button>
                      <Button size="sm" variant="ghost" onClick={() => openCat(cat)}><Pencil size={13} /> Edit</Button>
                      <Button size="sm" variant="soft" onClick={() => openItem({ categoryId: cat.id })}><Plus size={13} /> Item</Button>
                    </div>
                  </div>

                  {catItems.length === 0 ? (
                    <p className="mt-3 text-sm text-faint">No items in this category yet.</p>
                  ) : (
                    <div className="mt-3 divide-y divide-line">
                      {catItems.map((it) => (
                        <div key={it.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${it.isActive ? 'text-ink' : 'text-faint line-through'}`}>{it.name}</span>
                            {it.isEveryday && <Badge variant="blue">Everyday</Badge>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-faint">{naira(it.priceNgn)}</span>
                            <button onClick={() => toggleItem(it)} className={`h-5 w-9 rounded-full transition-colors ${it.isActive ? 'bg-primary' : 'bg-line'}`}>
                              <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${it.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                            <Button size="sm" variant="ghost" onClick={() => openItem({ edit: it })}><Pencil size={13} /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </Section>
            );
          })}
        </div>
      )}

      {/* category modal */}
      <Modal open={catModal.open} onClose={() => setCatModal({ open: false })} title={catModal.edit ? 'Edit category' : 'Add category'}>
        <form className="space-y-4" onSubmit={saveCat}>
          <Input label="Name" required placeholder="e.g. Tops" value={catForm.name} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))} />
          <Textarea label="Description" placeholder="Optional" value={catForm.description} onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))} />
          <Input label="Sort order" type="number" placeholder="10" value={catForm.sortOrder} onChange={(e) => setCatForm((f) => ({ ...f, sortOrder: e.target.value }))} />
          {formError && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{formError}</p>}
          <div className="flex gap-3 pt-1"><Button type="button" variant="outline" className="flex-1" onClick={() => setCatModal({ open: false })}>Cancel</Button><Button type="submit" className="flex-1" loading={saving}>Save</Button></div>
        </form>
      </Modal>

      {/* item modal */}
      <Modal open={itemModal.open} onClose={() => setItemModal({ open: false })} title={itemModal.edit ? 'Edit item' : 'Add item'}>
        <form className="space-y-4" onSubmit={saveItem}>
          <Input label="Item name" required placeholder="e.g. Dress Shirt" value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} />
          <SelectField label="Category" required value={itemForm.categoryId} onChange={(e) => setItemForm((f) => ({ ...f, categoryId: e.target.value }))}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
          <label className="flex items-center gap-3 text-sm text-ink">
            <input type="checkbox" checked={itemForm.isEveryday} onChange={(e) => setItemForm((f) => ({ ...f, isEveryday: e.target.checked }))} className="h-4 w-4 rounded border-line accent-[#13C490]" />
            Eligible for Wash &amp; Fold bags (everyday item)
          </label>
          {formError && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{formError}</p>}
          <div className="flex gap-3 pt-1"><Button type="button" variant="outline" className="flex-1" onClick={() => setItemModal({ open: false })}>Cancel</Button><Button type="submit" className="flex-1" loading={saving}>Save</Button></div>
        </form>
      </Modal>
    </div>
  );
}
