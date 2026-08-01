'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EllipsisVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Kebab menu on table rows (View Details / Suspend …).
 *
 * The dropdown is rendered in a portal with fixed positioning computed from the
 * trigger's rect — otherwise the table's `overflow-x-auto` scroll container clips
 * it, so the menu only appears after scrolling. Anchored to the button's right
 * edge; flips upward if it would overflow the viewport bottom.
 */
export function RowMenu({
  items,
}: {
  items: { label: string; icon?: React.ReactNode; danger?: boolean; onClick?: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      const r = btnRef.current!.getBoundingClientRect();
      const estHeight = items.length * 42 + 10;
      const opensUp = r.bottom + estHeight > window.innerHeight && r.top > estHeight;
      setPos({
        top: opensUp ? r.top - estHeight : r.bottom + 4,
        right: window.innerWidth - r.right,
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, items.length]);

  return (
    <span className="relative inline-block">
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="flex h-7 w-7 items-center justify-center rounded-full text-faint hover:bg-section hover:text-ink"
      >
        <EllipsisVertical size={15} />
      </button>
      {open && pos && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[61] w-44 overflow-hidden rounded-2xl border border-line bg-white py-1 shadow-xl"
            style={{ top: pos.top, right: pos.right }}
          >
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
          </div>
        </>,
        document.body,
      )}
    </span>
  );
}
