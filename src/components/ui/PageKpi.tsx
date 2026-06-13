import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The big page-level KPI from the designs: coloured icon circle, small grey
    label, a giant number, and a green/red delta line — then an hr below. */
export function PageKpi({
  icon,
  iconClass = 'bg-violet text-white',
  label,
  value,
  delta,
  deltaDown = false,
  className,
}: {
  icon: React.ReactNode;
  iconClass?: string;
  label: string;
  value: string;
  delta?: string;
  deltaDown?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('pb-6 border-b border-line', className)}>
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', iconClass)}>{icon}</span>
      <p className="mt-3 text-[13px] text-body">{label}</p>
      <p className="mt-1 text-5xl font-bold tracking-tight text-ink">{value}</p>
      {delta && (
        <p className={cn('mt-2 flex items-center gap-1 text-xs font-medium', deltaDown ? 'text-danger' : 'text-success')}>
          {deltaDown ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
          {delta}
        </p>
      )}
    </div>
  );
}

/** Smaller stat block used in pairs/rows (grey card with label, number, hint). */
export function StatBlock({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl bg-section px-5 py-4', className)}>
      <p className="text-[13px] text-body">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-faint">{hint}</p>}
    </div>
  );
}
