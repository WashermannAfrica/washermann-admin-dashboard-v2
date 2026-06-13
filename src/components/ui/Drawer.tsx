'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Right-hand slide-over panel used for detail views (e.g. Order Details). */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className={cn('fixed inset-0 z-50', open ? '' : 'pointer-events-none')}>
      <div
        className={cn('absolute inset-0 bg-black/30 transition-opacity', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 sm:rounded-l-3xl',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-body hover:bg-section">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/** Label/value row inside drawers. */
export function DrawerRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-[13px] text-faint">{label}</span>
      <span className="text-right text-[13px] font-medium text-ink">{children}</span>
    </div>
  );
}
