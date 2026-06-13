import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'blue';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  danger:  'bg-red-50 text-red-700 ring-1 ring-red-200',
  neutral: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  info:    'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  blue:    'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
};

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
