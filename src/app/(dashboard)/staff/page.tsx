'use client';

import { useState } from 'react';
import { ShieldCheck, Plus, Mail, ArrowUpRight, KeyRound, TriangleAlert } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { RowMenu } from '@/components/ui/RowMenu';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, SelectField } from '@/components/ui/Input';
import { ADMINS, ACTIVITY_LOG, Admin } from '@/lib/mock-data';

export default function StaffPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [transferring, setTransferring] = useState<Admin | null>(null);
  const [deactivating, setDeactivating] = useState<Admin | null>(null);

  const columns: Column<Admin>[] = [
    {
      key: 'name', header: 'Name', sortable: true, value: (a) => a.name,
      render: (a) => (
        <span className="flex items-center gap-2.5 font-medium text-ink">
          <Avatar name={a.name} size={28} dot /> {a.name}
        </span>
      ),
    },
    { key: 'email', header: 'Email', render: (a) => <span className="text-body">{a.email}</span> },
    { key: 'role', header: 'Role', render: (a) => <span className="rounded-md border border-line px-2 py-0.5 text-[11px] text-body">{a.role}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (a) => a.status, render: (a) => <Chip>{a.status}</Chip> },
    { key: 'date', header: 'Date', sortable: true, value: (a) => a.date, render: (a) => <span className="text-body">{a.date}</span> },
    {
      key: 'menu', header: '', render: (a) => (
        <RowMenu
          items={[
            { label: 'View Activity Log', icon: <ArrowUpRight size={14} />, onClick: () => setLogOpen(true) },
            { label: 'Transfer Ownership', icon: <KeyRound size={14} />, onClick: () => setTransferring(a) },
            { label: 'Deactivate Admin', icon: <TriangleAlert size={14} />, danger: true, onClick: () => setDeactivating(a) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi
        icon={<ShieldCheck size={16} />}
        iconClass="bg-primary text-white"
        label="Total Admins"
        value="50"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Staff Members" value="40" hint="Active staff across all operational roles" />
        <StatBlock label="Dispute Resolvers" value="30" hint="Orders successfully resolved by support team" />
      </div>

      <DataTable
        columns={columns}
        rows={ADMINS}
        searchPlaceholder="Search"
        filters={[{ label: 'Status', options: [] }, { label: 'Type', options: [] }, { label: 'Date', options: [] }]}
        pageSize={5}
        headerExtra={
          <button
            onClick={() => setInviteOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
          >
            <Plus size={14} /> Invite Admin
          </button>
        }
      />

      {/* Invite Admin — matches Invite Admin.png */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Admin">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setInviteOpen(false); }}>
          <Input label="Name" required placeholder="e.g, John Doe" />
          <Input label="Email" required type="email" placeholder="you@company.com" leftIcon={<Mail size={15} />} />
          <Input label="Phone number" required placeholder="+234 (555) 000-0000" />
          <SelectField label="Role" required defaultValue="">
            <option value="" disabled>Select role</option>
            <option>Super Admin</option>
            <option>Staff</option>
            <option>Dispute Resolver</option>
            <option>Finance</option>
          </SelectField>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Send Invite</Button>
          </div>
        </form>
      </Modal>

      {/* Activity Log — matches Activity Log.png */}
      <Modal open={logOpen} onClose={() => setLogOpen(false)} title="Activity Log">
        <div className="divide-y divide-line rounded-2xl border border-line px-4">
          {ACTIVITY_LOG.slice(0, 5).map((e) => (
            <div key={e.action + e.time} className="py-3">
              <p className="text-[13px] font-semibold text-ink">{e.action}: {e.target}</p>
              <p className="mt-0.5 text-xs text-faint">{e.actor} · {e.time}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setLogOpen(false)}>Cancel</Button>
          <Button className="flex-1" onClick={() => setLogOpen(false)}>Done</Button>
        </div>
      </Modal>

      {/* Transfer Ownership — matches Transfer Ownership.png */}
      <ConfirmModal
        open={!!transferring}
        onClose={() => setTransferring(null)}
        icon={<KeyRound size={20} />}
        danger={false}
        title={`Transfer ownership to ${transferring?.name ?? 'admin'}?`}
        body="This admin becomes the platform owner with full control, and your account is downgraded to Super Admin. This action requires email confirmation."
        confirmLabel="Transfer"
      />

      {/* Deactivate admin — matches Deactivate [Entity Name]_.png */}
      <ConfirmModal
        open={!!deactivating}
        onClose={() => setDeactivating(null)}
        icon={<TriangleAlert size={20} />}
        title={`Deactivate ${deactivating?.name ?? 'Admin'}?`}
        body="Deactivating this admin revokes dashboard access immediately. Their action history is preserved for audit."
        confirmLabel="Deactivate"
      />
    </div>
  );
}
