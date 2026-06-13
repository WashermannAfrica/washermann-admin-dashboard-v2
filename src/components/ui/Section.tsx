import { cn } from '@/lib/utils';

/** The light-grey rounded wrapper panel that frames chart/table cards in the designs. */
export function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-3xl bg-section p-3 sm:p-4', className)}>{children}</div>;
}

/** White inner card. */
export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl bg-white p-4 sm:p-5', className)}>{children}</div>;
}
