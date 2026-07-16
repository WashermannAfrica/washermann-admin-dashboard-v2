'use client';

import { useState } from 'react';
import { Search, Bell, Plus, ChevronDown, RefreshCw, LogOut, UserRound, Settings as SettingsIcon, ShoppingBag, Building2, WashingMachine, ShieldCheck, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmModal } from '@/components/ui/Modal';

const QUICK_ACTIONS = [
  { label: 'New Order', icon: <ShoppingBag size={15} />, href: '/orders' },
  { label: 'Add Company', icon: <Building2 size={15} />, href: '/companies' },
  { label: 'Add Washerman', icon: <WashingMachine size={15} />, href: '/washerman' },
  { label: 'Create Coupon', icon: <Ticket size={15} />, href: '/washer-points' },
  { label: 'Invite Admin', icon: <ShieldCheck size={15} />, href: '/staff' },
];

const NOTIFICATIONS = [
  { title: 'New dispute raised', detail: 'DSP-906 · Damaged item', time: '5m ago' },
  { title: 'Payout completed', detail: '₦120,900 to 39 vendors', time: '1h ago' },
  { title: 'KYC submitted', detail: 'WSH-312 awaiting review', time: '3h ago' },
];

export function Topbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);

  function handleLogout() {
    logout();
    document.cookie = 'wm-admin-token=; path=/; max-age=0';
    window.location.href = '/login';
  }

  function handleRefresh() {
    setSpinning(true);
    router.refresh();
    setTimeout(() => setSpinning(false), 700);
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line bg-white px-6">
      {/* Search */}
      <div className="relative w-72 max-w-full">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
        <input
          placeholder="Search for anything"
          className="h-10 w-full rounded-full bg-section pl-10 pr-4 text-[13px] placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Quick actions */}
        <div className="relative">
          <button
            onClick={() => setQuickOpen((o) => !o)}
            className="flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            <Plus size={15} /> Quick Actions <ChevronDown size={14} />
          </button>
          {quickOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setQuickOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-2xl border border-line bg-white py-1.5 shadow-xl">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => { setQuickOpen(false); router.push(a.href); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-body hover:bg-section"
                  >
                    <span className="text-faint">{a.icon}</span> {a.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleRefresh}
          className="flex h-9 w-9 items-center justify-center rounded-full text-body transition-colors hover:bg-section"
          title="Refresh"
        >
          <RefreshCw size={15} className={spinning ? 'animate-spin' : ''} />
        </button>

        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => setBellOpen((o) => !o)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-body transition-colors hover:bg-section"
          >
            <Bell size={16} />
            <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-danger" />
          </button>
          {bellOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setBellOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <p className="text-[13px] font-bold text-ink">Notifications</p>
                  <span className="text-xs text-primary">{NOTIFICATIONS.length} new</span>
                </div>
                {NOTIFICATIONS.map((n) => (
                  <div key={n.title} className="border-b border-line px-4 py-3 last:border-0 hover:bg-section">
                    <p className="text-[13px] font-semibold text-ink">{n.title}</p>
                    <p className="mt-0.5 text-xs text-faint">{n.detail} · {n.time}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Avatar + menu */}
        <div className="relative">
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center">
            <Avatar name={user?.fullName ?? 'Admin User'} size={36} dot />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-2xl border border-line bg-white py-1.5 shadow-xl">
                <div className="border-b border-line px-4 py-2.5">
                  <p className="truncate text-[13px] font-semibold text-ink">{user?.fullName ?? 'Admin User'}</p>
                  <p className="truncate text-xs text-faint">{user?.email ?? 'admin@washermann.com'}</p>
                </div>
                <button onClick={() => { setMenuOpen(false); router.push('/settings'); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-body hover:bg-section">
                  <UserRound size={15} /> Profile
                </button>
                <button onClick={() => { setMenuOpen(false); router.push('/settings'); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-body hover:bg-section">
                  <SettingsIcon size={15} /> Settings
                </button>
                <button onClick={() => { setMenuOpen(false); setLogoutOpen(true); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-danger hover:bg-danger-bg">
                  <LogOut size={15} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Logout confirm — matches Logout_.png */}
      <ConfirmModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        icon={<LogOut size={20} />}
        title="Logout?"
        body="You are about to log out of the Washermann Admin. Any unsaved changes will be lost."
        confirmLabel="Logout"
      />
    </header>
  );
}
