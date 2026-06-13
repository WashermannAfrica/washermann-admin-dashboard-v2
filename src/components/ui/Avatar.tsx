import { cn } from '@/lib/utils';

/* Deterministic pastel pairs for initials avatars — matches the design's
   multicolour initial circles (green/amber/violet/blue/pink). */
const PAIRS = [
  'bg-success-bg text-success',
  'bg-warn-bg text-warn',
  'bg-violet-bg text-violet',
  'bg-info-bg text-info',
  'bg-danger-bg text-danger',
  'bg-mint-soft text-forest',
];

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export function Avatar({
  name,
  size = 32,
  dot = false,
  className,
}: {
  name: string;
  size?: number;
  dot?: boolean;
  className?: string;
}) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const pair = PAIRS[Math.abs(hash) % PAIRS.length];

  return (
    <span className={cn('relative inline-flex shrink-0', className)} style={{ width: size, height: size }}>
      <span
        className={cn('flex items-center justify-center rounded-full font-semibold', pair)}
        style={{ width: size, height: size, fontSize: Math.max(10, size * 0.34) }}
      >
        {initials(name)}
      </span>
      {dot && (
        <span className="absolute -right-0 -bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary" />
      )}
    </span>
  );
}
