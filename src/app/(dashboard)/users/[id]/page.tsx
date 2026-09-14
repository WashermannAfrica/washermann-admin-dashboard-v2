'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RotateCw, TriangleAlert, Trash2 } from 'lucide-react';
import { EntityHero, HeroTabs } from '@/components/ui/EntityHero';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip, statusTone } from '@/components/ui/Chip';
import { Section, Panel } from '@/components/ui/Section';
import { ConfirmModal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDate } from '@/lib/utils';
import type { ApiResponse } from '@/types';
import type { UserDetail } from '@/types/ops';

const naira = (n: number | null) => `₦${Number(n ?? 0).toLocaleString()}`;
const pretty = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const ROLE_LABEL: Record<string, string> = {
  user: 'Customer', vendor: 'Vendor', rep: 'Wash Rep', sales_rep: 'Sales Rep',
  admin: 'Admin', finance: 'Finance', company_owner: 'Company Owner', company_admin: 'Company Admin',
  dispute_resolver: 'Dispute Resolver', washerman: 'Washerman',
};

type OrderRow = UserDetail['orders'][number];

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Orders');
  const [confirm, setConfirm] = useState<'suspend' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api
      .get<ApiResponse<UserDetail>>(`/users/${params.id}/detail`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(load, [load]);

  async function act() {
    if (!confirm || !data) return;
    setBusy(true);
    try {
      if (confirm === 'suspend') {
        const next = data.user.status === 'suspended' ? 'active' : 'suspended';
        await api.patch(`/users/${params.id}/status`, { status: next });
        setConfirm(null);
        setLoading(true);
        load();
      } else {
        await api.delete(`/users/${params.id}`);
        router.push('/users');
      }
    } catch (err) {
      setError(apiErr(err));
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="flex justify-center py-24 text-primary"><Spinner size="lg" /></div>;
  if (error) return <p className="py-12 text-center text-sm text-danger">{error}</p>;
  if (!data) return null;

  const { user, wallet, stats, orders, memberships } = data;
  const roleLabel = user.roles[0] ? (ROLE_LABEL[user.roles[0]] ?? user.roles[0]) : 'User';
  const suspended = user.status === 'suspended';
  const deleted = user.status === 'deactivated';
  const heroBtn = 'flex h-9 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-colors';

  const orderCols: Column<OrderRow>[] = [
    { key: 'reference', header: 'Tracking ID', render: (o) => <span className="font-mono text-xs text-ink">{o.reference}</span> },
    { key: 'service', header: 'Service', value: (o) => o.serviceType, render: (o) => <span className="capitalize text-body">{o.serviceType.replace('_', ' & ')}</span> },
    { key: 'amount', header: 'Amount', render: (o) => <span className="text-ink">{o.totalWP} WP <span className="text-xs text-faint">({naira(o.nairaEquivalentSnapshot)})</span></span> },
    { key: 'date', header: 'Date', sortable: true, value: (o) => o.createdAt, render: (o) => <span className="text-body">{formatDate(o.createdAt)}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (o) => o.status, render: (o) => <Chip tone={statusTone(o.status)}>{pretty(o.status)}</Chip> },
    { key: 'view', header: '', render: () => <button onClick={() => router.push('/orders')} className="cursor-pointer font-medium text-ink underline-offset-2 hover:underline">View Detail</button> },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <EntityHero
        name={user.fullName}
        contact={[user.email, user.phone].filter(Boolean).join(', ') || '—'}
        chips={[user.status, roleLabel, `${stats.totalOrders} orders`]}
        tiles={[
          { label: 'Wallet Balance', value: `${wallet.balanceWP.toLocaleString()} WP`, hint: `≈ ${naira(wallet.fiatKobo / 100)}`, accent: true },
          { label: 'Total Spent', value: naira(stats.totalSpentNaira), hint: `${stats.completedOrders} completed` },
        ]}
        extraActions={
          deleted ? undefined : (
            <>
              <button
                className={`${heroBtn} ${suspended ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-white/10 text-white hover:bg-white/20'}`}
                onClick={() => setConfirm('suspend')}
              >
                <TriangleAlert size={13} /> {suspended ? 'Reactivate' : 'Suspend'}
              </button>
              <button className={`${heroBtn} bg-danger text-white hover:bg-[#b53a2e]`} onClick={() => setConfirm('delete')}>
                <Trash2 size={13} /> Delete
              </button>
            </>
          )
        }
      />

      <HeroTabs tabs={['Orders', 'Company / Teams']} active={tab} onChange={setTab} />

      <div className="mt-4">
        {tab === 'Orders' && (
          <DataTable columns={orderCols} rows={orders} searchPlaceholder="Search by tracking ID" pageSize={8} emptyText="This user has no orders yet." />
        )}
        {tab === 'Company / Teams' && (
          <Section>
            {memberships.length === 0 ? (
              <Panel><p className="py-6 text-center text-sm text-faint">Not a member of any company.</p></Panel>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {memberships.map((m) => (
                  <Panel key={m.id}>
                    <div className="flex items-center justify-between border-b border-dashed border-line pb-3">
                      <span className="flex items-baseline gap-2">
                        <span className="font-bold text-ink">{m.companyName ?? '—'}</span>
                        <span className="text-xs text-faint">{m.tierName ?? 'No tier'}</span>
                      </span>
                      <button
                        onClick={() => router.push(`/companies/${m.companyId}`)}
                        className="cursor-pointer text-[13px] font-semibold text-ink underline underline-offset-2"
                      >
                        View Company
                      </button>
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-faint">
                      <RotateCw size={12} /> Membership
                    </p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[13px] text-faint">Status</span>
                      <Chip tone={statusTone(m.status)}>{pretty(m.status)}</Chip>
                    </div>
                  </Panel>
                ))}
              </div>
            )}
          </Section>
        )}
      </div>

      <ConfirmModal
        open={confirm === 'suspend'}
        onClose={() => setConfirm(null)}
        onConfirm={act}
        icon={<TriangleAlert size={20} />}
        danger={!suspended}
        title={suspended ? `Reactivate ${user.fullName}?` : `Suspend ${user.fullName}?`}
        body={suspended
          ? 'Reactivating restores the customer’s access — they can sign in and place orders again.'
          : 'Suspending blocks the customer from signing in immediately. Their wallet, orders and history are preserved.'}
        confirmLabel={busy ? 'Saving…' : suspended ? 'Reactivate' : 'Suspend'}
      />
      <ConfirmModal
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={act}
        icon={<Trash2 size={20} />}
        danger
        title={`Delete ${user.fullName}?`}
        body="This permanently deletes the account: personal data is anonymised and all sessions are revoked. Financial and order history is retained (attributed to an anonymised id). Blocked if the wallet has a balance, an order is in progress, or a dispute is open."
        confirmLabel={busy ? 'Deleting…' : 'Delete account'}
      />
    </div>
  );
}
