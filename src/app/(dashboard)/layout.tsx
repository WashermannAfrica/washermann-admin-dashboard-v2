'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { IdleTimeout } from '@/components/layout/IdleTimeout';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    // Only decide once the persisted session has been read — otherwise the very
    // first render (isAuthenticated=false, pre-hydration) bounces to /login and
    // flashes the login page before the real session loads.
    if (hasHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Render nothing until hydrated (and while unauthenticated) — no login flash.
  if (!hasHydrated || !isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-page">
      <IdleTimeout />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
