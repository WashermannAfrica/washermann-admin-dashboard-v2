'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Building2,
  MapPin,
  UserRound,
  WashingMachine,
  Users,
  Scale,
  Banknote,
  CircleDollarSign,
  ShieldCheck,
  CircleHelp,
  Settings,
  Gift,
  Shirt,
  Mail,
  Newspaper,
  GraduationCap,
  ScrollText,
  Headset,
  FileText,
  ShieldAlert,
  Truck,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}
interface NavGroupDef {
  title: string;
  items: NavItem[];
}

// Single, always-visible item at the top.
const DASHBOARD: NavItem = { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={16} /> };

// Collapsible groups — keeps the nav short instead of one long flat list.
const GROUPS: NavGroupDef[] = [
  {
    title: 'Operations',
    items: [
      { label: 'Orders',       href: '/orders',     icon: <ShoppingBag size={16} /> },
      { label: 'Compliance',   href: '/compliance', icon: <ShieldAlert size={16} /> },
      { label: 'Disputes',     href: '/disputes',   icon: <Scale size={16} /> },
      { label: 'Live Support', href: '/support',    icon: <Headset size={16} /> },
      { label: 'Areas',        href: '/areas',      icon: <MapPin size={16} /> },
    ],
  },
  {
    title: 'People & Partners',
    items: [
      { label: 'Customers',      href: '/users',          icon: <Users size={16} /> },
      { label: 'Companies',      href: '/companies',      icon: <Building2 size={16} /> },
      { label: 'Washerman',      href: '/washerman',      icon: <WashingMachine size={16} /> },
      { label: 'Reps',           href: '/reps',           icon: <UserRound size={16} /> },
      { label: 'Rep onboarding', href: '/rep-onboarding', icon: <GraduationCap size={16} /> },
      { label: 'Referrals',      href: '/referrals',      icon: <Gift size={16} /> },
    ],
  },
  {
    title: 'Catalogue & Finance',
    items: [
      { label: 'Catalogue',     href: '/catalogue',     icon: <Shirt size={16} /> },
      { label: 'Transport',     href: '/transport',     icon: <Truck size={16} /> },
      { label: 'Financials',    href: '/financials',    icon: <Banknote size={16} /> },
      { label: 'Washer-points', href: '/washer-points', icon: <CircleDollarSign size={16} /> },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Blog',           href: '/blog',      icon: <Newspaper size={16} /> },
      { label: 'Templates',      href: '/templates', icon: <Mail size={16} /> },
      { label: 'Legal Policies', href: '/policies',  icon: <FileText size={16} /> },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Admins & Staff', href: '/staff',    icon: <ShieldCheck size={16} /> },
      { label: 'Audit Log',      href: '/audit',    icon: <ScrollText size={16} /> },
      { label: 'Settings',       href: '/settings', icon: <Settings size={16} /> },
      { label: 'Help',           href: '/help',     icon: <CircleHelp size={16} /> },
    ],
  },
];

const LS_COLLAPSED = 'wm_nav_collapsed';

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
        active ? 'bg-mint-soft font-semibold text-forest' : 'text-body hover:bg-section hover:text-ink',
      )}
    >
      <span className={active ? 'text-forest' : 'text-faint'}>{item.icon}</span>
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const hydrated = useRef(false);

  // Restore collapsed groups once.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = localStorage.getItem(LS_COLLAPSED);
      if (raw) setCollapsed(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
  }, []);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  function toggle(title: string) {
    setCollapsed((c) => {
      const next = { ...c, [title]: !c[title] };
      try { localStorage.setItem(LS_COLLAPSED, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  return (
    <aside className="flex h-screen w-52 shrink-0 flex-col border-r border-line bg-white">
      {/* Logo mark */}
      <div className="flex h-16 items-center px-4">
        <Link href="/">
          <Image src="/logo-mark.png" alt="Washermann" width={34} height={31} priority />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 pt-2">
        {/* Dashboard — always visible */}
        <ul className="mb-3 space-y-0.5">
          <li><NavLink item={DASHBOARD} active={isActive(DASHBOARD.href)} /></li>
        </ul>

        {GROUPS.map((group) => {
          const hasActive = group.items.some((it) => isActive(it.href));
          // A group with the current page stays open regardless of the saved state.
          const open = hasActive || !collapsed[group.title];
          return (
            <div key={group.title} className="mb-1.5">
              <button
                type="button"
                onClick={() => toggle(group.title)}
                aria-expanded={open}
                className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-faint transition-colors hover:text-body"
              >
                <span>{group.title}</span>
                <ChevronDown size={13} className={cn('transition-transform duration-200', open ? '' : '-rotate-90')} />
              </button>
              {open && (
                <ul className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <NavLink item={item} active={isActive(item.href)} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
