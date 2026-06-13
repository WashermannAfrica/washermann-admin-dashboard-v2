'use client';

import { cn } from '@/lib/utils';

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1 rounded-full bg-section p-1 w-fit', className)}>
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            'rounded-full px-4 py-2 text-[13px] font-medium transition-colors',
            t === active ? 'bg-white text-ink shadow-sm' : 'text-body hover:text-ink',
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
