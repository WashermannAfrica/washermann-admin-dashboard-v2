import { cn } from '@/lib/utils';

export type ChipTone = 'success' | 'warn' | 'danger' | 'neutral' | 'violet' | 'info';

const tones: Record<ChipTone, string> = {
  success: 'bg-success-bg text-success',
  warn:    'bg-warn-bg text-warn',
  danger:  'bg-danger-bg text-danger',
  neutral: 'bg-section text-body',
  violet:  'bg-violet-bg text-violet',
  info:    'bg-info-bg text-info',
};

/** Map common entity statuses to a chip tone. */
export function statusTone(status: string): ChipTone {
  const s = status.toLowerCase();
  if (['delivered', 'completed', 'active', 'resolved', 'verified', 'paid', 'approved', 'successful'].includes(s)) return 'success';
  if (['pending', 'ongoing', 'in review', 'processing', 'awaiting', 'unverified', 'open'].includes(s)) return 'warn';
  if (['rejected', 'overdue', 'failed', 'suspended', 'deactivated', 'escalated', 'declined'].includes(s)) return 'danger';
  if (['escrow', 'refund'].includes(s)) return 'info';
  return 'neutral';
}

export function Chip({
  tone,
  children,
  className,
}: {
  tone?: ChipTone;
  children: React.ReactNode;
  className?: string;
}) {
  const resolved = tone ?? (typeof children === 'string' ? statusTone(children) : 'neutral');
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium capitalize',
        tones[resolved],
        className,
      )}
    >
      {children}
    </span>
  );
}
