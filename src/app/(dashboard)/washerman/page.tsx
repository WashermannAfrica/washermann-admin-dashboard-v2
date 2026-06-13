'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WashingMachine, Plus, ArrowUpRight, TriangleAlert, Mail } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Stars } from '@/components/ui/Stars';
import { RowMenu } from '@/components/ui/RowMenu';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, SelectField } from '@/components/ui/Input';
import { WASHERMEN, Washerman } from '@/lib/mock-data';

export default function WashermanPage() {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [suspending, setSuspending] = useState<Washerman | null>(null);

  const columns: Column<Washerman>[] = [
    {
      key: 'name', header: 'Name', sortable: true, value: (w) => w.name,
      render: (w) => (
        <span className="flex items-center gap-2.5 font-medium text-ink">
          <Avatar name={w.name} size={28} dot /> {w.name}
        </span>
      ),
    },
    { key: 'orders', header: 'Orders', render: (w) => <span className="text-ink">{w.completedOrders}</span> },
    { key: 'earnings', header: 'Earnings', render: (w) => <span className="font-medium text-ink">₦{(w.completedOrders * 1234.56).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> },
    { key: 'escrow', header: 'Escrow', render: (w) => <span className="text-ink">{w.pendingPayout}</span> },
    { key: 'rating', header: 'Ratings', render: (w) => <Stars rating={w.rating} /> },
    { key: 'status', header: 'Status', sortable: true, value: (w) => w.status, render: (w) => <Chip>{w.status}</Chip> },
    {
      key: 'menu', header: '', render: (w) => (
        <RowMenu
          items={[
            { label: 'View Details', icon: <ArrowUpRight size={14} />, onClick: () => router.push(`/washerman/${w.id}`) },
            { label: 'Suspend Washerman', icon: <TriangleAlert size={14} />, danger: true, onClick: () => setSuspending(w) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi
        icon={<WashingMachine size={16} />}
        iconClass="bg-[#E5177E] text-white"
        label="Total Washermen"
        value="100"
        delta="+6 over the last 7 days"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Best Performing" value="Ibrahim Musa" hint="180 orders · ⭐ 4.7" />
        <StatBlock label="Areas Covered" value="100/100" hint="Lekki, Victoria Island, Ikoyi…" />
      </div>

      <DataTable
        columns={columns}
        rows={WASHERMEN}
        searchPlaceholder="Search"
        filters={[{ label: 'Status', options: [] }, { label: 'Tier', options: [] }]}
        pageSize={5}
        headerExtra={
          <button
            onClick={() => setAddOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
          >
            <Plus size={14} /> Add Washerman
          </button>
        }
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Washerman">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setAddOpen(false); }}>
          <Input label="Full Name" required placeholder="e.g, Ibrahim Musa" />
          <Input label="Email" required type="email" placeholder="you@company.com" leftIcon={<Mail size={15} />} />
          <Input label="Phone number" required placeholder="+234 (555) 000-0000" />
          <SelectField label="Area" required defaultValue="">
            <option value="" disabled>Select area</option>
            {[...new Set(WASHERMEN.map((w) => w.area))].map((a) => <option key={a}>{a}</option>)}
          </SelectField>
          <Input label="Bank Account" required placeholder="0123456789 — GTBank" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Add Washerman</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!suspending}
        onClose={() => setSuspending(null)}
        icon={<TriangleAlert size={20} />}
        title={`Suspend ${suspending?.name ?? 'Washerman'}?`}
        body="Suspending this washerman removes them from new order assignments immediately. Pending payouts are held until the suspension is lifted."
        confirmLabel="Suspend Washerman"
      />
    </div>
  );
}
