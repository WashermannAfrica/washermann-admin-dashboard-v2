'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { SettingsSubPage } from '@/components/ui/SettingsShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

const SESSIONS = [
  { device: 'MacBook Pro · Lagos, NG', detail: 'Chrome · Current session', current: true },
  { device: 'iPhone 15 · Lagos, NG', detail: 'Safari · 2h ago', current: false },
  { device: 'Windows PC · Abuja, NG', detail: 'Edge · 3d ago', current: false },
];

const LOG = [
  ['Password changed', 'Feb 12, 2026 · 10:34am'],
  ['New device signed in', 'Jan 28, 2026 · 3:15pm'],
  ['Profile updated', 'Jan 20, 2026 · 9:00am'],
  ['Emeka Nwosu added as Admin', 'Jan 5, 2026 · 11:47am'],
  ['Account created', 'Dec 1, 2025 · 8:00am'],
];

export default function SecuritySettingsPage() {
  const [pwOpen, setPwOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const rows = [
    { label: 'Password', hint: 'Last changed 3 months ago', action: 'Change password', onClick: () => setPwOpen(true) },
    { label: 'Login Sessions', hint: '2 active sessions', action: 'Manage sessions', onClick: () => setSessionsOpen(true) },
    { label: 'Activity Log', hint: 'View recent account activity', action: 'View log', onClick: () => setLogOpen(true) },
  ];

  return (
    <SettingsSubPage title="Security" description="Keep your account safe with these settings">
      <div className="space-y-7">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-ink">{r.label}</p>
              <p className="mt-0.5 text-[13px] text-faint">{r.hint}</p>
            </div>
            <Button variant="outline" size="sm" onClick={r.onClick}>{r.action}</Button>
          </div>
        ))}
      </div>

      {/* Change password */}
      <Modal open={pwOpen} onClose={() => setPwOpen(false)} title="Change Password">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setPwOpen(false); }}>
          <Input label="Current Password" required type={showPw ? 'text' : 'password'} placeholder="Enter current password"
            rightIcon={<button type="button" onClick={() => setShowPw((s) => !s)}>{showPw ? <Eye size={16} /> : <EyeOff size={16} />}</button>} />
          <Input label="New Password" required type={showPw ? 'text' : 'password'} placeholder="Enter new password" />
          <Input label="Confirm Password" required type={showPw ? 'text' : 'password'} placeholder="Re-enter new password" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Update Password</Button>
          </div>
        </form>
      </Modal>

      {/* Active sessions */}
      <Modal open={sessionsOpen} onClose={() => setSessionsOpen(false)} title="Active Sessions">
        <div className="space-y-2.5">
          {SESSIONS.map((s) => (
            <div key={s.device} className="flex items-center justify-between rounded-2xl border border-line p-4">
              <div>
                <p className="text-[13px] font-semibold text-ink">{s.device}</p>
                <p className="mt-0.5 text-xs text-faint">{s.detail}</p>
              </div>
              {s.current
                ? <span className="rounded-md bg-success-bg px-2 py-0.5 text-[11px] font-medium text-success">Current</span>
                : <Button variant="outline" size="sm">Revoke</Button>}
            </div>
          ))}
        </div>
        <Button className="mt-5 w-full" onClick={() => setSessionsOpen(false)}>Done</Button>
      </Modal>

      {/* Activity log */}
      <Modal open={logOpen} onClose={() => setLogOpen(false)} title="Activity Log">
        <div className="divide-y divide-line rounded-2xl border border-line px-4">
          {LOG.map(([t, d]) => (
            <div key={t} className="py-3">
              <p className="text-[13px] font-semibold text-ink">{t}</p>
              <p className="mt-0.5 text-xs text-faint">{d}</p>
            </div>
          ))}
        </div>
        <Button className="mt-5 w-full" onClick={() => setLogOpen(false)}>Done</Button>
      </Modal>
    </SettingsSubPage>
  );
}
