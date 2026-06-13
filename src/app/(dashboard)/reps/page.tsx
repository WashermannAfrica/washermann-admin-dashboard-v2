'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRound, Plus, ArrowUpRight, TriangleAlert, Mail } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Stars } from '@/components/ui/Stars';
import { RowMenu } from '@/components/ui/RowMenu';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, SelectField } from '@/components/ui/Input';
import { REPS, Rep } from '@/lib/mock-data';

export default function RepsPage() {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [suspending, setSuspending] = useState<Rep | null>(null);

  const columns: Column<Rep>[] = [
    {
      key: 'name', header: 'Name', sortable: true, value: (r) => r.name,
      render: (r) => (
        <span className="flex items-center gap-2.5 font-medium text-ink">
          <Avatar name={r.name} size={28} dot /> {r.name}
        </span>
      ),
    },
    {
      key: 'area', header: 'Areas', render: (r) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="rounded-md bg-mint-soft px-2 py-0.5 text-[11px] font-medium text-forest">{r.area}</span>
          <span className="text-[11px] text-faint">+4</span>
        </span>
      ),
    },
    { key: 'pickups', header: 'Pickups', render: (r) => <span className="text-ink">{r.ordersHandled}</span> },
    { key: 'delivery', header: 'Delivery', render: (r) => <span className="text-ink">{r.ordersHandled * 2 - 8}</span> },
    { key: 'rating', header: 'Ratings', render: () => <Stars rating={4} /> },
    { key: 'status', header: 'Status', sortable: true, value: (r) => r.status, render: (r) => <Chip>{r.status}</Chip> },
    {
      key: 'menu', header: '', render: (r) => (
        <RowMenu
          items={[
            { label: 'View Details', icon: <ArrowUpRight size={14} />, onClick: () => router.push(`/reps/${r.id}`) },
            { label: 'Suspend Rep', icon: <TriangleAlert size={14} />, danger: true, onClick: () => setSuspending(r) },
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
        value="100"
        delta="+6 over the last 7 days"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Areas Covered" value="15/15" hint="Vi, Ikeja" />
        <StatBlock label="Top Rep" value="Emeka Obi" hint="↘ 55 · Currently working" />
      </div>

      <DataTable
        columns={columns}
        rows={REPS}
        searchPlaceholder="Search by employee"
        filters={[{ label: 'Status', options: [] }, { label: 'Ratings', options: [] }]}
        pageSize={5}
        headerExtra={
          <button
            onClick={() => setAddOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
          >
            <Plus size={14} /> Add Rep
          </button>
        }
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Rep">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setAddOpen(false); }}>
          <Input label="Full Name" required placeholder="e.g, Emeka Obi" />
          <Input label="Email" required type="email" placeholder="you@company.com" leftIcon={<Mail size={15} />} />
          <Input label="Phone number" required placeholder="+234 (555) 000-0000" />
          <SelectField label="Area" required defaultValue="">
            <option value="" disabled>Select area</option>
            {[...new Set(REPS.map((r) => r.area))].map((a) => <option key={a}>{a}</option>)}
          </SelectField>
          <SelectField label="Payment Type" required defaultValue="">
            <option value="" disabled>Select payment type</option>
            <option>Per order</option>
            <option>Monthly salary</option>
          </SelectField>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Add Rep</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!suspending}
        onClose={() => setSuspending(null)}
        icon={<TriangleAlert size={20} />}
        title={`Suspend ${suspending?.name ?? 'Rep'}?`}
        body="Suspending this rep removes them from new pickup and delivery assignments immediately. Their history and earnings remain intact."
        confirmLabel="Suspend Rep"
      />
    </div>
  );
}
