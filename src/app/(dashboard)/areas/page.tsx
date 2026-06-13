'use client';

import { useState } from 'react';
import { MapPin, Plus, Download, Search, ChevronDown, Users, WashingMachine, TriangleAlert } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { Section, Panel } from '@/components/ui/Section';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, SelectField } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { cn } from '@/lib/utils';
import { AREAS, Area } from '@/lib/mock-data';

const TOWNS: Record<string, string[]> = {
  'Victoria Island': ['VI', 'Oniru'],
  'Lekki Phase 1': ['Lekki Phase 1', 'chevron'],
  'Ikeja GRA': ['GRA', 'Alausa'],
  Yaba: ['Akoka', 'Sabo'],
  Surulere: ['Aguda', 'Ijesha'],
  'Victoria Island 2': ['Old Ikoyi', 'Banana Island'],
  Gbagada: ['Phase 1', 'Phase 2'],
  Ajah: ['Sangotedo', 'Abraham Adesanya'],
  Magodo: ['Phase 1', 'Shangisha'],
  'Ikoyi': ['Old Ikoyi', 'Banana Island'],
};

function AreaCard({ area, onDeactivate }: { area: Area; onDeactivate: () => void }) {
  const towns = TOWNS[area.name] ?? ['Central', 'North'];
  return (
    <Panel className="cursor-pointer transition-shadow hover:shadow-md" >
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-ink">{area.name}</h3>
        <button onClick={onDeactivate}><Chip>{area.status}</Chip></button>
      </div>
      <p className="mt-1.5 flex items-center gap-1 text-xs text-faint">
        <MapPin size={12} /> {area.city}, Lagos&nbsp;&nbsp;Target: {area.activeOrders * 50} users
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {towns.map((t) => (
          <span key={t} className="rounded-md border border-line px-2 py-0.5 text-[11px] text-body">{t}</span>
        ))}
        <span className="rounded-md border border-line px-2 py-0.5 text-[11px] text-body">+3</span>
      </div>
      <div className="mt-4 flex items-center gap-4 border-t border-dashed border-line pt-3 text-xs text-faint">
        <span className="flex items-center gap-1"><Users size={12} /> {area.reps} reps</span>
        <span className="flex items-center gap-1"><WashingMachine size={12} /> {area.washermen} vendors</span>
      </div>
    </Panel>
  );
}

export default function AreasPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<Area | null>(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const filtered = AREAS.filter(
    (a) =>
      a.name.toLowerCase().includes(q.toLowerCase()) &&
      (!statusFilter || a.status === statusFilter),
  );

  function exportCSV() {
    const head = 'Name,City,Reps,Washermen,Active Orders,Status';
    const body = filtered.map((a) => `"${a.name}","${a.city}",${a.reps},${a.washermen},${a.activeOrders},"${a.status}"`).join('\n');
    const blob = new Blob([head + '\n' + body], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'washermann-areas.csv';
    link.click();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi
        icon={<MapPin size={16} />}
        iconClass="bg-violet text-white"
        label="Total Areas"
        value={String(AREAS.length)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Towns Covered" value="05" />
        <StatBlock label="Reps Deployed" value="06" />
      </div>

      <Section>
        {/* toolbar */}
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

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <AreaCard key={a.id} area={a} onDeactivate={() => setDeactivating(a)} />
          ))}
        </div>
      </Section>

      {/* Add Area — matches Add Area.png */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Area">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setAddOpen(false); }}>
          <Input label="Area Name" required placeholder="e.g, Lekki North" />
          <SelectField label="City" required defaultValue="">
            <option value="" disabled>Select City</option>
            <option>Lagos</option>
            <option>Abuja</option>
            <option>Port Harcourt</option>
          </SelectField>
          <SelectField label="State" required defaultValue="">
            <option value="" disabled>Select State</option>
            <option>Lagos</option>
            <option>FCT</option>
            <option>Rivers</option>
          </SelectField>
          <Input label="Target Users" required type="number" placeholder="50" />
          <Input label="Towns" required placeholder="Type town names and press enter" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Add Area</Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Area — matches Deactivate Area_.png */}
      <ConfirmModal
        open={!!deactivating}
        onClose={() => setDeactivating(null)}
        icon={<TriangleAlert size={20} />}
        title={`Deactivate ${deactivating?.name ?? 'Area'}?`}
        body="Deactivating this area will hide it from new orders and pause rep assignments. Vendors and reps in this area keep their accounts."
        confirmLabel="Deactivate"
      />
    </div>
  );
}
