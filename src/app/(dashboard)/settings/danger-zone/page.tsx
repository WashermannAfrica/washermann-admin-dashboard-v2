'use client';

import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { SettingsSubPage } from '@/components/ui/SettingsShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmModal } from '@/components/ui/Modal';

export default function DangerZoneSettingsPage() {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const rows = [
    { label: 'Export Data', hint: 'Download a copy of your data as JSON', action: <Button variant="outline" size="sm">Export Data</Button> },
    { label: 'Transfer Ownership', hint: 'Hand this account to another admin', action: <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}>Transfer</Button> },
    { label: 'Deactivate', hint: 'Temporarily disable your account', action: <Button variant="danger" size="sm" onClick={() => setDeactivateOpen(true)}>Deactivate</Button> },
    { label: 'Delete Account', hint: 'Permanently delete your account and all data', action: <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>Delete</Button> },
  ];

  return (
    <SettingsSubPage title="Danger Zone" description="Permanent account actions — proceed with caution">
      <div className="space-y-7">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-ink">{r.label}</p>
              <p className="mt-0.5 text-[13px] text-faint">{r.hint}</p>
            </div>
            {r.action}
          </div>
        ))}
      </div>

      {/* Delete Account — matches Delete Account.png */}
      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setConfirmText(''); }} title="Delete Account?">
        <div className="flex h-40 items-center justify-center rounded-2xl bg-danger">
          <TriangleAlert size={48} className="text-white" />
        </div>
        <p className="mt-5 text-center text-sm leading-relaxed text-body">
          This action is permanent and cannot be reversed. All your data, billing history, and integrations will be permanently deleted.
        </p>
        <form className="mt-5" onSubmit={(e) => { e.preventDefault(); setDeleteOpen(false); setConfirmText(''); }}>
          <Input
            label="Type DELETE to confirm"
            required
            placeholder="DELETE"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
          <div className="mt-5 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setDeleteOpen(false); setConfirmText(''); }}>Cancel</Button>
            <Button type="submit" variant="danger" className="flex-1" disabled={confirmText !== 'DELETE'}>Schedule delete</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        icon={<TriangleAlert size={20} />}
        title="Deactivate account?"
        body="Your account will be temporarily disabled and you'll be signed out of all devices. You can reactivate by logging back in."
        confirmLabel="Deactivate"
      />

      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer Ownership">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setTransferOpen(false); }}>
          <Input label="New owner's email" required type="email" placeholder="admin@company.com" />
          <p className="text-xs leading-relaxed text-faint">
            The new owner will receive full access. You will be downgraded to a standard admin. This can only be undone by the new owner.
          </p>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setTransferOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Send transfer</Button>
          </div>
        </form>
      </Modal>
    </SettingsSubPage>
  );
}
