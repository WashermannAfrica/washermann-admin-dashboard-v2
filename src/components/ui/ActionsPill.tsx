'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Green "+ Actions" pill with a dropdown — used in detail drawers. */
export function ActionsPill({
  actions,
}: {
  actions: { label: string; danger?: boolean; onClick?: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-white hover:bg-primary-dark transition-colors"
      >
        <Plus size={13} /> Actions
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <span className="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-2xl border border-line bg-white py-1 shadow-xl">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={() => { setOpen(false); a.onClick?.(); }}
                className={cn(
                  'block w-full px-4 py-2.5 text-left text-[13px]',
                  a.danger ? 'text-danger hover:bg-danger-bg' : 'text-body hover:bg-section',
                )}
              >
                {a.label}
              </button>
            ))}
          </span>
        </>
      )}
    </span>
  );
}
