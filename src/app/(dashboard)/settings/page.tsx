'use client';

import Link from 'next/link';
import { Briefcase, Lock, Bell, TriangleAlert, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { initials } from '@/components/ui/Avatar';

interface SettingsLink {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  danger?: boolean;
}

const GROUPS: { group: string; items: SettingsLink[] }[] = [
  {
    group: 'Account',
    items: [
      { href: '/settings/profile', icon: <Briefcase size={18} />, title: 'Company Information', desc: 'Update company details' },
      { href: '/settings/security', icon: <Lock size={18} />, title: 'Security', desc: 'Protect your account' },
    ],
  },
  {
    group: 'Preferences',
    items: [
      { href: '/settings/notifications', icon: <Bell size={18} />, title: 'Notifications', desc: 'Control notification preferences' },
    ],
  },
  {
    group: 'Advanced',
    items: [
      { href: '/settings/danger-zone', icon: <TriangleAlert size={18} />, title: 'Danger Zone', desc: 'Permanent account actions', danger: true },
    ],
  },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const name = user?.fullName ?? 'Acmecorp';
  const email = user?.email ?? 'help@acmecorp.com';

  return (
    <div className="mx-auto max-w-2xl">
      {/* Profile summary */}
      <div className="flex flex-col items-center pt-2 text-center">
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-mint-soft text-lg font-bold text-forest">
          {initials(name)}
          <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-2 border-white bg-violet" />
        </span>
        <h1 className="mt-3 text-2xl font-bold text-ink">{name}</h1>
        <p className="mt-0.5 text-[13px] text-body">{email}</p>
      </div>

      {/* Grouped nav rows */}
      <div className="mt-10 space-y-8">
        {GROUPS.map((g) => (
          <div key={g.group}>
            <h2 className="mb-3 text-base font-bold text-ink">{g.group}</h2>
            <div className="space-y-3">
              {g.items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="flex items-center gap-4 rounded-2xl bg-section px-5 py-4 transition-colors hover:bg-line/60"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-white ${it.danger ? 'text-danger' : 'text-ink'}`}>
                    {it.icon}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-ink">{it.title}</p>
                    <p className="mt-0.5 text-xs text-faint">{it.desc}</p>
                  </div>
                  <ChevronRight size={18} className="text-faint" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
