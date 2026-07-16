'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Plus, Download, Search, ChevronDown, Users, WashingMachine, Bus } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { Section, Panel } from '@/components/ui/Section';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, SelectField, Textarea } from '@/components/ui/Input';
import { AreaMapEditor, DraftLocation } from '@/components/areas/AreaMapEditor';
import { Chip } from '@/components/ui/Chip';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Paginated } from '@/types';
import type { Area } from '@/types/ops';

const NG_STATES = ['Lagos', 'FCT', 'Rivers', 'Oyo', 'Kano'];

function AreaCard({ area }: { area: Area }) {
  const [expanded, setExpanded] = useState(false);
  const locs = area.locations ?? [];
  const shown = expanded ? locs : locs.slice(0, 3);
  const extra = locs.length - 3;
  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((x) => !x);
  };
  return (
    <Link href={`/areas/${area.id}`} className="block">
      <Panel className="cursor-pointer transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-ink">{area.name}</h3>
          <Chip tone={area.isActive ? 'success' : 'neutral'}>{area.isActive ? 'Active' : 'Inactive'}</Chip>
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-faint">
          <MapPin size={12} /> {area.lga ? `${area.lga}, ` : ''}{area.state}&nbsp;&nbsp;Target: {area.targetUsers} users
        </p>
        <div className="mt-3 flex min-h-[1.75rem] flex-wrap items-center gap-1.5">
          {shown.map((l) => (
            <span key={l.id} className="rounded-md border border-line px-2 py-0.5 text-[11px] text-body">{l.name}</span>
          ))}
          {extra > 0 && (
            <button
              onClick={toggle}
              className="rounded-md border border-primary/40 bg-mint-soft px-2 py-0.5 text-[11px] font-medium text-forest hover:bg-primary/10"
            >
              {expanded ? 'show less' : `+${extra} more`}
            </button>
          )}
          {locs.length === 0 && <span className="text-[11px] text-faint">No locations yet</span>}
        </div>
        <div className="mt-4 flex items-center gap-4 border-t border-dashed border-line pt-3 text-xs text-faint">
          <span className="flex items-center gap-1"><Users size={12} /> {area.repsCount ?? 0} reps</span>
          <span className="flex items-center gap-1"><WashingMachine size={12} /> {area.vendorsCount ?? 0} vendors</span>
          <span className="flex items-center gap-1"><Bus size={12} /> {area.transportFeeWP} WP</span>
        </div>
      </Panel>
    </Link>
  );
}

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const [form, setForm] = useState({ name: '', state: 'Lagos', targetUsers: '', transportFeeWP: '', description: '' });
  const [draftLocs, setDraftLocs] = useState<DraftLocation[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<Paginated<Area>>('/areas?limit=100')
      .then((res) => setAreas(res.data.data))
      .catch((err) => setError(err?.response?.data?.message ?? 'Failed to load areas.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const filtered = areas.filter(
    (a) =>
      a.name.toLowerCase().includes(q.toLowerCase()) &&
      (!statusFilter || (statusFilter === 'Active' ? a.isActive : !a.isActive)),
  );
  const townsCovered = areas.reduce((n, a) => n + (a.locations?.length ?? 0), 0);
  const repsDeployed = areas.reduce((n, a) => n + (a.repsCount ?? 0), 0);

  async function addArea(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.post('/areas', {
        name: form.name.trim(),
        state: form.state.trim(),
        description: form.description.trim() || undefined,
        transportFeeWP: Number(form.transportFeeWP || 0),
        targetUsers: Number(form.targetUsers || 0),
        locations: draftLocs.map((l) => ({
          name: l.name.trim(),
          centerLat: l.centerLat,
          centerLng: l.centerLng,
          radiusKm: l.radiusKm,
        })),
      });
      setAddOpen(false);
      setForm({ name: '', state: 'Lagos', targetUsers: '', transportFeeWP: '', description: '' });
      setDraftLocs([]);
      load();
    } catch (err) {
      const e2 = err as { response?: { data?: { message?: string | string[] } } };
      const m = e2.response?.data?.message;
      setFormError(Array.isArray(m) ? m.join(', ') : m ?? 'Could not create area.');
    } finally {
      setSaving(false);
    }
  }

  function exportCSV() {
    const head = 'Name,State,Target Users,Locations,Transport Fee (WP),Status';
    const body = filtered
      .map((a) => `"${a.name}","${a.state}",${a.targetUsers},"${(a.locations ?? []).map((l) => l.name).join('; ')}",${a.transportFeeWP},"${a.isActive ? 'Active' : 'Inactive'}"`)
      .join('\n');
    const blob = new Blob([head + '\n' + body], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'washermann-areas.csv';
    link.click();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi icon={<MapPin size={16} />} iconClass="bg-violet text-white" label="Total Areas" value={String(areas.length)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Towns Covered" value={String(townsCovered)} />
        <StatBlock label="Reps Deployed" value={String(repsDeployed)} />
      </div>

      <Section>
        <div className="flex flex-wrap items-center gap-2 pb-3">
          <div className="relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by area"
              className="h-9 w-52 rounded-full border border-line bg-white pl-10 pr-4 text-[13px] placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <span className="relative">
            <button
              onClick={() => setStatusOpen((o) => !o)}
              className={cn(
                'flex h-9 items-center gap-1.5 rounded-full border px-4 text-[13px] transition-colors',
                statusFilter ? 'border-primary bg-mint-soft text-forest' : 'border-line bg-white text-body hover:bg-section',
              )}
            >
              {statusFilter ?? 'Status'} <ChevronDown size={14} className={statusFilter ? 'text-forest' : 'text-faint'} />
            </button>
            {statusOpen && (
              <>
                <span className="fixed inset-0 z-30" onClick={() => setStatusOpen(false)} />
                <span className="absolute left-0 z-40 mt-1 w-40 overflow-hidden rounded-2xl border border-line bg-white py-1 shadow-xl">
                  {['All', 'Active', 'Inactive'].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s === 'All' ? null : s); setStatusOpen(false); }}
                      className="block w-full px-4 py-2 text-left text-[13px] text-ink hover:bg-section"
                    >
                      {s}
                    </button>
                  ))}
                </span>
              </>
            )}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setAddOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
            >
              <Plus size={14} /> Add Area
            </button>
            <button onClick={exportCSV} className="flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-medium text-white hover:bg-black">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>
        ) : error ? (
          <p className="py-12 text-center text-sm text-danger">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-faint">No areas found. Add your first area to get started.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => <AreaCard key={a.id} area={a} />)}
          </div>
        )}
      </Section>

      {/* Add Area */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Area" wide>
        <form className="space-y-4" onSubmit={addArea}>
          <Input
            label="Area Name" required placeholder="e.g. Lekki North"
            value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <SelectField
            label="State" required value={form.state}
            onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
          >
            {NG_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </SelectField>
          <Input
            label="Target Users" type="number" placeholder="500"
            value={form.targetUsers} onChange={(e) => setForm((f) => ({ ...f, targetUsers: e.target.value }))}
          />
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Towns & coverage</label>
            <p className="mb-2 text-xs text-faint">Search each town to drop a pin, then size its radius — the circles together form this area&apos;s coverage region.</p>
            <AreaMapEditor locations={draftLocs} onChange={setDraftLocs} height="18rem" />
          </div>
          <Input
            label="Transport Fee (WP)" required type="number" placeholder="150"
            value={form.transportFeeWP} onChange={(e) => setForm((f) => ({ ...f, transportFeeWP: e.target.value }))}
          />
          <Textarea
            label="Description" placeholder="Optional notes about this area"
            value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          {formError && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{formError}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>Add Area</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
