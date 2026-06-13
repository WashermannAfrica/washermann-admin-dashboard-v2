import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  accent?: string; // Tailwind bg class for icon container
}

export function StatCard({ label, value, sub, icon, trend, accent = 'bg-[#1a1a2e]/5' }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-5 flex gap-4 items-start">
      {icon && (
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', accent)}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900 leading-none">{value}</p>
        {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        {trend && (
          <p className={cn('mt-1 text-xs font-medium', trend.positive ? 'text-emerald-600' : 'text-red-600')}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
