'use client';

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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const OVERVIEW: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={16} /> },
];

const MAIN: NavItem[] = [
  { label: 'Orders',        href: '/orders',        icon: <ShoppingBag size={16} /> },
  { label: 'Companies',     href: '/companies',     icon: <Building2 size={16} /> },
  { label: 'Areas',         href: '/areas',         icon: <MapPin size={16} /> },
  { label: 'Reps',          href: '/reps',          icon: <UserRound size={16} /> },
  { label: 'Rep onboarding', href: '/rep-onboarding', icon: <GraduationCap size={16} /> },
  { label: 'Referrals',     href: '/referrals',     icon: <Gift size={16} /> },
  { label: 'Washerman',     href: '/washerman',     icon: <WashingMachine size={16} /> },
  { label: 'Catalogue',     href: '/catalogue',     icon: <Shirt size={16} /> },
  { label: 'Users',         href: '/users',         icon: <Users size={16} /> },
  { label: 'Disputes',      href: '/disputes',      icon: <Scale size={16} /> },
  { label: 'Financials',    href: '/financials',    icon: <Banknote size={16} /> },
  { label: 'Washer-points', href: '/washer-points', icon: <CircleDollarSign size={16} /> },
  { label: 'Admins & Staff', href: '/staff',        icon: <ShieldCheck size={16} /> },
  { label: 'Templates',     href: '/templates',     icon: <Mail size={16} /> },
  { label: 'Blog',          href: '/blog',          icon: <Newspaper size={16} /> },
];

const OTHERS: NavItem[] = [
  { label: 'Help',     href: '/help',     icon: <CircleHelp size={16} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={16} /> },
];

function NavGroup({ title, items, pathname }: { title: string; items: NavItem[]; pathname: string }) {
  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }
  return (
    <div className="mb-5">
      <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-widest text-faint">{title}</p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
                  active
                    ? 'bg-mint-soft font-semibold text-forest'
                    : 'text-body hover:bg-section hover:text-ink',
                )}
              >
                <span className={active ? 'text-forest' : 'text-faint'}>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-52 shrink-0 flex-col border-r border-line bg-white">
      {/* Logo mark */}
      <div className="flex h-16 items-center px-4">
        <Link href="/">
          <Image src="/logo-mark.png" alt="Washermann" width={34} height={31} priority />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 pt-2">
        <NavGroup title="Overview" items={OVERVIEW} pathname={pathname} />
        <NavGroup title="Main" items={MAIN} pathname={pathname} />
        <div className="mx-3 mb-5 border-t border-line" />
        <NavGroup title="Others" items={OTHERS} pathname={pathname} />
      </nav>
    </aside>
  );
}
