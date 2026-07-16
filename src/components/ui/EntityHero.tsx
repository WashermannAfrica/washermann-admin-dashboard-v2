'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { initials } from './Avatar';

/** Dark forest-green profile hero from the entity detail designs:
    back button above, avatar + name + contact, chips, actions, stat tiles. */
export function EntityHero({
  name,
  contact,
  chips,
  onDeactivate,
  tiles,
  infoRow,
  extraActions,
  onChipClick,
}: {
  name: string;
  contact: string;
  chips: string[];
  onDeactivate?: () => void;
  tiles: { label: string; value: string; hint?: string; accent?: boolean; action?: React.ReactNode }[];
  infoRow?: { label: string; value: string }[];
  extraActions?: React.ReactNode;
  onChipClick?: (chip: string) => void;
}) {
  const router = useRouter();
  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-section text-ink hover:bg-line transition-colors"
      >
        <ArrowLeft size={17} />
      </button>

      <div className="rounded-3xl bg-forest-deep p-5 text-white">
        <div className="flex flex-wrap items-center gap-4 px-1 pb-5 pt-1">
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-base font-bold text-forest">
            {initials(name)}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#F7C948] text-[9px]">✦</span>
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">{name}</h1>
            <p className="mt-0.5 truncate text-[13px] text-white/70">{contact}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {chips.map((c, i) => (
                <span
                  key={c}
                  onClick={onChipClick ? () => onChipClick(c) : undefined}
                  className={cn(
                    'rounded-md px-2 py-0.5 text-[11px] font-medium',
                    i === 0 ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/80',
                    onChipClick && 'cursor-pointer hover:bg-white/20',
                  )}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button className="flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-dark transition-colors">
              <Mail size={13} /> Send email
            </button>
            {extraActions}
            {onDeactivate && (
              <button
                onClick={onDeactivate}
                className="flex h-9 items-center gap-2 rounded-full bg-danger px-4 text-xs font-semibold text-white hover:bg-[#b53a2e] transition-colors"
              >
                <TriangleAlert size={13} /> Deactivate
              </button>
            )}
          </div>
        </div>

        {infoRow && (
          <div className="mb-4 grid grid-cols-2 gap-y-4 border-t border-white/10 px-1 pt-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
            {infoRow.map((r, i) => (
              <div key={r.label} className={i > 0 ? 'sm:border-l sm:border-white/10 sm:pl-6' : ''}>
                <p className="text-[11px] text-white/55">{r.label}</p>
                <p className="mt-0.5 text-[15px] font-bold">{r.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className={cn('grid gap-3', tiles.length === 1 ? 'grid-cols-1' : tiles.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
          {tiles.map((t) => (
            <div
              key={t.label}
              className={cn(
                'flex items-end justify-between gap-4 rounded-2xl p-5',
                t.accent ? 'bg-primary text-white' : 'bg-white/5 text-white',
              )}
            >
              <div>
                <p className={cn('text-xs', t.accent ? 'text-white/85' : 'text-white/60')}>{t.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight">{t.value}</p>
                {t.hint && <p className={cn('mt-2 text-xs', t.accent ? 'text-white/85' : 'text-white/60')}>{t.hint}</p>}
              </div>
              {t.action}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Full-width pill tab bar (Orders | Disputes | Company / Teams). */
export function HeroTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
}) {
  return (
    <div className="mt-6 flex rounded-full bg-section p-1">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            'flex-1 rounded-full px-4 py-2.5 text-[13px] font-medium transition-colors',
            t === active ? 'bg-white text-ink shadow-sm' : 'text-body hover:text-ink',
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
