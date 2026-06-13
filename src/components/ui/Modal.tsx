'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={cn(
          'relative max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl',
          wide ? 'max-w-2xl' : 'max-w-md',
        )}
      >
        {title && (
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-body hover:bg-section">
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/** Destructive confirmation modal matching “Deactivate …?” designs:
    icon, centred title + copy, outline Cancel + danger/primary action. */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  icon,
  title,
  body,
  confirmLabel,
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  icon?: React.ReactNode;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center px-2 py-2 text-center">
        {icon && (
          <span className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-full', danger ? 'bg-danger-bg text-danger' : 'bg-mint-soft text-forest')}>
            {icon}
          </span>
        )}
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-body">{body}</p>
        <div className="mt-6 flex w-full gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} className="flex-1" onClick={() => { onConfirm?.(); onClose(); }}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
