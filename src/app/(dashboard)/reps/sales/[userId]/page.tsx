'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowUpCircle, TriangleAlert, Trash2 } from 'lucide-react';
import { EntityHero, HeroTabs } from '@/components/ui/EntityHero';
import { Section, Panel } from '@/components/ui/Section';
import { Chip, statusTone } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { ApiResponse } from '@/types';
import type { SalesRepDetail } from '@/types/ops';

const naira = (n: number | null | undefined) => `₦${Number(n ?? 0).toLocaleString()}`;
const pretty = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function SalesRepDetailPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const [data, setData] = useState<SalesRepDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('References');
  const [confirm, setConfirm] = useState<'suspend' | 'delete' | 'upgrade' | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<ApiResponse<SalesRepDetail>>(`/sales-rep/${params.userId}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, [params.userId]);

  useEffect(load, [load]);

  async function act() {
    if (!confirm || !data) return;
    setBusy(true);
    try {
      if (confirm === 'suspend') {
        const reactivating = data.profile.status === 'suspended';
        await api.post(`/sales-rep/${params.userId}/${reactivating ? 'reactivate' : 'suspend'}`);
        setConfirm(null);
        load();
      } else if (confirm === 'upgrade') {
        await api.post(`/sales-rep/${params.userId}/upgrade-to-wash-rep`);
        setConfirm(null);
        load();
      } else if (confirm === 'delete') {
        await api.delete(`/sales-rep/${params.userId}`);
        router.push('/reps');
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

  const { user, profile, referral, payouts } = data;
  const suspended = profile.status === 'suspended';
  const name = user?.fullName ?? 'Sales Rep';

  const actionBtn = 'flex h-9 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-colors';

  return (
    <div className="mx-auto max-w-6xl">
      <EntityHero
        name={name}
        contact={[user?.email, user?.phone].filter(Boolean).join(', ') || '—'}
        chips={[
          profile.status,
          profile.assessmentPassed ? `Passed · ${profile.bestScorePct}%` : `Best ${profile.bestScorePct}%`,
          ...(profile.upgradedToRepAt ? ['Wash Rep'] : []),
        ]}
        tiles={[
          { label: 'Available (due)', value: naira(referral.payout.available), accent: true },
          { label: 'Pending', value: naira(referral.payout.pending) },
          { label: 'Paid out', value: naira(referral.payout.paid) },
        ]}
        infoRow={[
          { label: 'Referral code', value: referral.code ?? '—' },
          { label: 'Referrals', value: String(referral.referrals.length) },
          { label: 'Joined', value: formatDate(profile.createdAt) },
        ]}
        extraActions={
          <>
            {!profile.upgradedToRepAt && (
              <button className={`${actionBtn} bg-white/10 text-white hover:bg-white/20`} onClick={() => setConfirm('upgrade')}>
                <ArrowUpCircle size={13} /> Upgrade
              </button>
            )}
            <button
              className={`${actionBtn} ${suspended ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-white/10 text-white hover:bg-white/20'}`}
              onClick={() => setConfirm('suspend')}
            >
              <TriangleAlert size={13} /> {suspended ? 'Reactivate' : 'Suspend'}
            </button>
            <button className={`${actionBtn} bg-danger text-white hover:bg-[#b53a2e]`} onClick={() => setConfirm('delete')}>
              <Trash2 size={13} /> Delete
            </button>
          </>
        }
      />

      <HeroTabs tabs={['References', 'Payouts', 'Details']} active={tab} onChange={setTab} />

      <div className="mt-4">
        {tab === 'References' && (
          <Section>
            <Panel className="p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-section text-left text-xs uppercase tracking-wide text-faint">
                  <tr>
                    <th className="px-4 py-2.5">Referred</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Reward</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {referral.referrals.map((r) => (
                    <tr key={r.id} className="bg-white">
                      <td className="px-4 py-2.5">
                        <span className="block font-medium text-ink">{r.referredName ?? '—'}</span>
                        <span className="text-xs text-faint">{r.referredEmail ?? ''}</span>
                      </td>
                      <td className="px-4 py-2.5 capitalize text-body">{r.referredType}</td>
                      <td className="px-4 py-2.5 text-ink">{r.rewardAmount != null ? naira(r.rewardAmount) : '—'}</td>
                      <td className="px-4 py-2.5"><Chip tone={statusTone(r.status)}>{pretty(r.status)}</Chip></td>
                      <td className="px-4 py-2.5 text-body">{formatDate(r.createdAt)}</td>
                    </tr>
                  ))}
                  {referral.referrals.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-faint">No referrals yet.</td></tr>
                  )}
                </tbody>
              </table>
            </Panel>
          </Section>
        )}

        {tab === 'Payouts' && (
          <Section>
            <Panel className="p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-section text-left text-xs uppercase tracking-wide text-faint">
                  <tr>
                    <th className="px-4 py-2.5">Reference</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Requested</th>
                    <th className="px-4 py-2.5">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {payouts.map((p) => (
                    <tr key={p.id} className="bg-white">
                      <td className="px-4 py-2.5 font-mono text-xs text-ink">{p.reference ?? p.id.slice(0, 8) + '…'}</td>
                      <td className="px-4 py-2.5 font-semibold text-ink">{naira(p.amountNaira)}</td>
                      <td className="px-4 py-2.5"><Chip tone={statusTone(p.status)}>{pretty(p.status)}</Chip></td>
                      <td className="px-4 py-2.5 text-body">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-2.5 text-body">{p.completedAt ? formatDateTime(p.completedAt) : '—'}</td>
                    </tr>
                  ))}
                  {payouts.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-faint">No payouts yet.</td></tr>
                  )}
                </tbody>
              </table>
            </Panel>
          </Section>
        )}

        {tab === 'Details' && (
          <Section>
            <div className="grid gap-3 sm:grid-cols-2">
              <Panel>
                <p className="text-sm font-semibold text-ink">Payout account</p>
                {profile.bank.accountName ? (
                  <dl className="mt-2 space-y-1.5 text-sm">
                    <div className="flex justify-between"><dt className="text-faint">Account name</dt><dd className="font-medium text-ink">{profile.bank.accountName}</dd></div>
                    <div className="flex justify-between"><dt className="text-faint">Account number</dt><dd className="font-medium text-ink">{profile.bank.accountNumber}</dd></div>
                    <div className="flex justify-between"><dt className="text-faint">Bank</dt><dd className="font-medium text-ink">{profile.bank.bankCode}</dd></div>
                  </dl>
                ) : (
                  <p className="mt-2 text-sm text-faint">Not set yet.</p>
                )}
              </Panel>
              <Panel>
                <p className="text-sm font-semibold text-ink">Profile</p>
                <dl className="mt-2 space-y-1.5 text-sm">
                  <div className="flex justify-between"><dt className="text-faint">Status</dt><dd><Chip tone={statusTone(profile.status)}>{pretty(profile.status)}</Chip></dd></div>
                  <div className="flex justify-between"><dt className="text-faint">Assessment</dt><dd>{profile.assessmentPassed ? <Badge variant="success">Passed · {profile.bestScorePct}%</Badge> : <Badge variant="neutral">Best {profile.bestScorePct}%</Badge>}</dd></div>
                  <div className="flex justify-between"><dt className="text-faint">Passed at</dt><dd className="text-body">{profile.passedAt ? formatDate(profile.passedAt) : '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-faint">Upgraded</dt><dd className="text-body">{profile.upgradedToRepAt ? formatDate(profile.upgradedToRepAt) : '—'}</dd></div>
                </dl>
              </Panel>
            </div>
          </Section>
        )}
      </div>

      <ConfirmModal
        open={confirm === 'upgrade'}
        onClose={() => setConfirm(null)}
        onConfirm={act}
        icon={<ArrowUpCircle size={20} />}
        title="Upgrade to Wash Rep?"
        body="This grants the sales rep the field wash-rep role. They keep their referral code and earnings."
        confirmLabel={busy ? 'Upgrading…' : 'Upgrade'}
      />
      <ConfirmModal
        open={confirm === 'suspend'}
        onClose={() => setConfirm(null)}
        onConfirm={act}
        icon={<TriangleAlert size={20} />}
        danger={!suspended}
        title={suspended ? `Reactivate ${name}?` : `Suspend ${name}?`}
        body={suspended
          ? 'Reactivating restores the sales rep to active — they can request payouts again.'
          : 'Suspending freezes the sales rep. They cannot request payouts while suspended. Referrals and earnings are preserved.'}
        confirmLabel={busy ? 'Saving…' : suspended ? 'Reactivate' : 'Suspend'}
      />
      <ConfirmModal
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={act}
        icon={<Trash2 size={20} />}
        danger
        title={`Delete ${name}?`}
        body="This archives the sales rep and removes them from the list. Their referral and payout history is preserved and can be restored by reactivating them."
        confirmLabel={busy ? 'Deleting…' : 'Delete'}
      />
    </div>
  );
}
