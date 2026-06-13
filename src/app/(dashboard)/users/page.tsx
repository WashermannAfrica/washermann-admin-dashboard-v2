'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users as UsersIcon, Plus, ArrowUpRight, TriangleAlert, Mail } from 'lucide-react';
import { PageKpi } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { RowMenu } from '@/components/ui/RowMenu';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, SelectField } from '@/components/ui/Input';
import { USERS, COMPANIES_DATA, PlatformUser } from '@/lib/mock-data';

export default function UsersPage() {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [suspending, setSuspending] = useState<PlatformUser | null>(null);

  const columns: Column<PlatformUser>[] = [
    {
      key: 'name', header: 'Name', sortable: true, value: (u) => u.name,
      render: (u) => (
        <span className="flex items-center gap-2.5 font-medium text-ink">
          <Avatar name={u.name} size={28} dot /> {u.name}
        </span>
      ),
    },
    {
      key: 'company', header: 'Company', render: (u) => {
        const c = COMPANIES_DATA[u.orders % COMPANIES_DATA.length];
        return (
          <span className="flex items-center gap-2.5 font-medium text-ink">
            <Avatar name={c.name} size={28} /> {c.name}
          </span>
        );
      },
    },
    {
      key: 'tier', header: 'Tier', render: (u) => (
        <span className="rounded-md border border-line px-2 py-0.5 text-[11px] text-body">
          {(['Basic', 'Standard', 'Premium'] as const)[u.orders % 3]} Tier
        </span>
      ),
    },
    {
      key: 'wallet', header: 'Wallet', render: (u) => (
        <span>
          <span className="block font-semibold text-ink">₦{(parseInt(u.walletWp.replace(/,/g, '')) * 115).toLocaleString()}</span>
          <span className="text-xs text-faint">{u.walletWp.replace(' WP', ' pts')}</span>
        </span>
      ),
    },
    { key: 'status', header: 'Status', sortable: true, value: (u) => u.status, render: (u) => <Chip>{u.status}</Chip> },
    {
      key: 'view', header: '', render: (u) => (
        <span className="flex items-center gap-1">
          <span
            onClick={() => router.push(`/users/${u.id}`)}
            className="cursor-pointer font-medium text-ink underline-offset-2 hover:underline"
          >
            View Detail
          </span>
          <RowMenu
            items={[
              { label: 'View Details', icon: <ArrowUpRight size={14} />, onClick: () => router.push(`/users/${u.id}`) },
              { label: 'Suspend User', icon: <TriangleAlert size={14} />, danger: true, onClick: () => setSuspending(u) },
            ]}
          />
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi
        icon={<UsersIcon size={16} />}
        iconClass="bg-[#E5177E] text-white"
        label="Total Users"
        value="150"
        delta="+6 over the last 7 days"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-2xl bg-section px-5 py-4">
          <div>
            <p className="text-[13px] text-body">Best Performing</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-ink">Tunde Bakare</p>
            <p className="mt-1.5 text-xs text-faint">180 orders</p>
          </div>
          <button className="h-8 rounded-full bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-dark">
            Gift user
          </button>
        </div>
        <div className="rounded-2xl bg-section px-5 py-4">
          <p className="text-[13px] text-body">Active Users</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-ink">30</p>
          <p className="mt-1.5 text-xs text-faint">Across board</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={USERS}
        searchPlaceholder="Search"
        filters={[{ label: 'Status', options: [] }, { label: 'Tier', options: [] }]}
        pageSize={5}
        headerExtra={
          <button
            onClick={() => setAddOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
          >
            <Plus size={14} /> Add Users
          </button>
        }
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add User">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setAddOpen(false); }}>
          <Input label="Full Name" required placeholder="e.g, Tunde Bakare" />
          <Input label="Email" required type="email" placeholder="you@company.com" leftIcon={<Mail size={15} />} />
          <Input label="Phone number" required placeholder="+234 (555) 000-0000" />
          <SelectField label="Type" required defaultValue="">
            <option value="" disabled>Select type</option>
            <option>Individual</option>
            <option>Employee</option>
            <option>Team member</option>
          </SelectField>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Add User</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!suspending}
        onClose={() => setSuspending(null)}
        icon={<TriangleAlert size={20} />}
        title={`Suspend ${suspending?.name ?? 'User'}?`}
        body="Suspending this user blocks logins and new orders. Their wallet balance is preserved and restored on reactivation."
        confirmLabel="Suspend User"
      />
    </div>
  );
}
