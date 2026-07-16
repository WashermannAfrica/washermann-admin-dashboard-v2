/**
 * Environment badge — tells you at a glance which deployment you're looking at.
 *
 * The label is derived from the git branch Railway deployed from; see the
 * branch → env mapping in next.config.ts. Renders NOTHING in production, so real
 * users never see it.
 *
 * Server component by design: the values are inlined at build time, so this ships
 * zero client JS. Styles are inline (not Tailwind classes) so the badge can never
 * be dropped by a CSS purge/build quirk — it must always be visible when it renders.
 */
const ENV = process.env.NEXT_PUBLIC_APP_ENV ?? 'local';
const BRANCH = process.env.NEXT_PUBLIC_GIT_BRANCH ?? '';
const SHA = process.env.NEXT_PUBLIC_GIT_SHA ?? '';

const STYLES: Record<string, { bg: string; label: string }> = {
  local: { bg: '#6b7280', label: 'LOCAL' },
  dev: { bg: '#2563eb', label: 'DEV' },
  staging: { bg: '#d97706', label: 'STAGING' },
};

export default function EnvBadge() {
  // Never badge production.
  if (ENV === 'production') return null;

  const style = STYLES[ENV] ?? { bg: '#6b7280', label: ENV.toUpperCase() };
  const detail = [BRANCH && `branch: ${BRANCH}`, SHA && `commit: ${SHA}`]
    .filter(Boolean)
    .join('  •  ');

  return (
    <div
      title={detail || undefined}
      aria-label={`Environment: ${style.label}`}
      style={{
        position: 'fixed',
        bottom: 10,
        left: 10,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 9px',
        borderRadius: 9999,
        background: style.bg,
        color: '#fff',
        font: '600 10px/1 ui-sans-serif, system-ui, -apple-system, sans-serif',
        letterSpacing: '0.08em',
        boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
        opacity: 0.9,
        userSelect: 'none',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 9999,
          background: '#fff',
          opacity: 0.85,
        }}
      />
      {style.label}
      {BRANCH ? (
        <span style={{ opacity: 0.75, fontWeight: 500, letterSpacing: 0 }}>{BRANCH}</span>
      ) : null}
    </div>
  );
}
