// ─── Number formatting ────────────────────────────────────────────────────────

export function formatWP(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M WP`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K WP`;
  return `${value.toLocaleString()} WP`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}

// ─── Date formatting ──────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

// ─── Role display helpers ─────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  user: 'User',
  company_owner: 'Company Owner',
  company_admin: 'Company Admin',
  team_owner: 'Team Owner',
  washerman: 'Washerman',
  admin: 'Admin',
  dispute_resolver: 'Dispute Resolver',
  finance: 'Finance',
};

export function labelRole(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export function primaryRole(roles: string[]): string {
  const priority = ['admin', 'finance', 'dispute_resolver', 'company_owner', 'company_admin', 'washerman', 'team_owner', 'user'];
  for (const r of priority) {
    if (roles.includes(r)) return labelRole(r);
  }
  return roles[0] ?? '—';
}

// ─── Status color helpers ─────────────────────────────────────────────────────

export function userStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'success';
    case 'pending': return 'warning';
    case 'suspended': return 'danger';
    case 'deactivated': return 'neutral';
    default: return 'neutral';
  }
}

export function ledgerTypeColor(type: string): string {
  return type === 'credit' ? 'success' : 'danger';
}

// ─── Class name helper ────────────────────────────────────────────────────────

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
