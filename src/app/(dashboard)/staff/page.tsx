'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Plus, Mail, KeyRound, TriangleAlert } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { RowMenu } from '@/components/ui/RowMenu';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, SelectField } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDate } from '@/lib/utils';
import type { Paginated } from '@/types';
import type { StaffMember } from '@/types/ops';

const STAFF_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'finance', label: 'Finance' },
  { value: 'dispute_resolver', label: 'Dispute Resolver' },
];
const roleLabel = (r: string) => STAFF_ROLES.find((x) => x.value === r)?.label ?? r;

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ fullName: '', email: '', role: 'admin' });
  const [changing, setChanging] = useState<StaffMember | null>(null);
  const [newRole, setNewRole] = useState('admin');
  const [deactivating, setDeactivating] = useState<StaffMember | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<Paginated<StaffMember>>('/admin/staff?limit=100')
      .then((res) => { setStaff(res.data.data); setTotal(res.data.meta.total); })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function doInvite(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setBusy(true);
    try {
      await api.post('/admin/staff', { fullName: invite.fullName.trim(), email: invite.email.trim(), role: invite.role });
      setInviteOpen(false);
      setInvite({ fullName: '', email: '', role: 'admin' });
      load();
    } catch (err) {
      setFormError(apiErr(err));
    } finally {
      setBusy(false);
    }
  }

  async function changeRole() {
    if (!changing) return;
    setBusy(true);
    try {
      await api.patch(`/admin/staff/${changing.id}/role`, { role: newRole });
      setChanging(null);
      load();
    } catch (err) {
      setError(apiErr(err));
      setChanging(null);
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    if (!deactivating) return;
    setBusy(true);
    try {
      await api.delete(`/admin/staff/${deactivating.id}`);
      setDeactivating(null);
      load();
    } catch (err) {
      setError(apiErr(err));
      setDeactivating(null);
    } finally {
      setBusy(false);
    }
  }

  const adminCount = staff.filter((s) => s.roles.includes('admin')).length;

  const columns: Column<StaffMember>[] = [
    { key: 'name', header: 'Name', sortable: true, value: (s) => s.fullName, render: (s) => <span className="flex items-center gap-2.5 font-medium text-ink"><Avatar name={s.fullName} size={28} dot={s.status === 'active'} /> {s.fullName}</span> },
    { key: 'email', header: 'Email', render: (s) => <span className="text-body">{s.email ?? '—'}</span> },
    { key: 'roles', header: 'Roles', render: (s) => <span className="flex flex-wrap gap-1">{s.roles.filter((r) => STAFF_ROLES.some((x) => x.value === r)).map((r) => <Badge key={r} variant="blue">{roleLabel(r)}</Badge>)}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (s) => s.status, render: (s) => <Chip>{s.status}</Chip> },
    { key: 'joined', header: 'Joined', render: (s) => <span className="text-body">{formatDate(s.createdAt)}</span> },
    {
      key: 'menu', header: '', render: (s) => (
        <RowMenu
          items={[
            { label: 'Change role', icon: <KeyRound size={14} />, onClick: () => { setChanging(s); setNewRole(s.roles.find((r) => STAFF_ROLES.some((x) => x.value === r)) ?? 'admin'); } },
            { label: 'Deactivate', icon: <TriangleAlert size={14} />, danger: true, onClick: () => setDeactivating(s) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi icon={<ShieldCheck size={16} />} iconClass="bg-forest text-white" label="Total Staff" value={String(total)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Admins" value={String(adminCount)} hint="Full access" />
        <StatBlock label="Other staff" value={String(staff.length - adminCount)} hint="Finance · Disputes" />
      </div>

      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>
      ) : (
        <DataTable
          columns={columns}
          rows={staff}
          searchPlaceholder="Search staff"
          filters={[{ label: 'Status', options: [] }]}
          pageSize={10}
          emptyText="No staff yet."
          headerExtra={
            <button onClick={() => setInviteOpen(true)} className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark">
              <Plus size={14} /> Invite staff
            </button>
          }
        />
      )}

      {/* Invite */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite staff">
        <form className="space-y-4" onSubmit={doInvite}>
          <Input label="Full Name" required placeholder="e.g. John Doe" value={invite.fullName} onChange={(e) => setInvite((f) => ({ ...f, fullName: e.target.value }))} />
          <Input label="Email" required type="email" placeholder="staff@washermann.com" leftIcon={<Mail size={15} />} value={invite.email} onChange={(e) => setInvite((f) => ({ ...f, email: e.target.value }))} />
          <SelectField label="Role" required value={invite.role} onChange={(e) => setInvite((f) => ({ ...f, role: e.target.value }))}>
            {STAFF_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </SelectField>
          {formError && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{formError}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={busy}>Send invite</Button>
          </div>
        </form>
      </Modal>

      {/* Change role */}
      <Modal open={!!changing} onClose={() => setChanging(null)} title={`Change role · ${changing?.fullName ?? ''}`}>
        <div className="space-y-4">
          <SelectField label="Role" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
            {STAFF_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </SelectField>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setChanging(null)}>Cancel</Button>
            <Button className="flex-1" loading={busy} onClick={changeRole}>Save role</Button>
          </div>
        </div>
      </Modal>

      {/* Deactivate */}
      <ConfirmModal
        open={!!deactivating}
        onClose={() => setDeactivating(null)}
        onConfirm={deactivate}
        danger
        icon={<TriangleAlert size={20} />}
        title={`Deactivate ${deactivating?.fullName ?? ''}?`}
        body="This removes their platform staff access. They can be re-invited later."
        confirmLabel={busy ? 'Removing…' : 'Deactivate'}
      />
    </div>
  );
}
