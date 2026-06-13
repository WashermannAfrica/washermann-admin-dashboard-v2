'use client';

import { useState } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Kebab menu on table rows (View Details / Suspend …). */
export function RowMenu({
  items,
}: {
  items: { label: string; icon?: React.ReactNode; danger?: boolean; onClick?: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="flex h-7 w-7 items-center justify-center rounded-full text-faint hover:bg-section hover:text-ink"
      >
        <EllipsisVertical size={15} />
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <span className="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-2xl border border-line bg-white py-1 shadow-xl">
            {items.map((it) => (
              <button
                key={it.label}
                onClick={() => { setOpen(false); it.onClick?.(); }}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px]',
                  it.danger ? 'text-danger hover:bg-danger-bg' : 'text-body hover:bg-section',
                )}
              >
                {it.icon} {it.label}
              </button>
            ))}
          </span>
        </>
      )}
    </span>
  );
}
