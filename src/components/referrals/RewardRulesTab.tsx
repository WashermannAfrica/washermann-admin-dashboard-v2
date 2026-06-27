'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { Panel } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { ApiResponse } from '@/types';
import type { RewardRule } from '@/types/ops';

const REFERRER_LABELS: Record<string, string> = {
  sales_rep: 'Sales Rep',
  rep: 'Wash Rep',
  customer: 'Customer',
  vendor: 'Vendor',
};
const currencyOf = (t: string) => (t === 'sales_rep' || t === 'rep' ? '₦ cash' : 'WP');

export function RewardRulesTab() {
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<ApiResponse<RewardRule[]>>('/referrals/rules')
      .then((res) => setRules(Array.isArray(res.data.data) ? res.data.data : []))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  function patch(id: string, p: Partial<RewardRule>) {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  }

  async function save(rule: RewardRule) {
    const key = `${rule.referrerType}:${rule.referredType}`;
    setSavingKey(key);
    setError('');
    try {
      await api.put('/referrals/rules', {
        referrerType: rule.referrerType,
        referredType: rule.referredType,
        kind: rule.kind,
        value: Number(rule.value),
        vendorApprovalBonus: rule.vendorApprovalBonus == null ? undefined : Number(rule.vendorApprovalBonus),
        active: rule.active,
      });
      setSavedKey(key);
      setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1500);
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) return <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-body">
        Reward paid per referral, by who refers and what they bring in. Amounts are the CAC levers —
        changes only affect <span className="font-semibold">future</span> referrals (earned rewards are snapshotted).
      </p>
      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-section text-left text-xs uppercase tracking-wide text-faint">
            <tr>
              <th className="px-4 py-3 font-semibold">Referrer</th>
              <th className="px-4 py-3 font-semibold">Brings</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Value</th>
              <th className="px-4 py-3 font-semibold">Vendor bonus</th>
              <th className="px-4 py-3 font-semibold">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rules.map((r) => {
              const key = `${r.referrerType}:${r.referredType}`;
              return (
                <tr key={r.id} className="bg-white">
                  <td className="px-4 py-3 font-medium text-ink">{REFERRER_LABELS[r.referrerType] ?? r.referrerType}</td>
                  <td className="px-4 py-3 capitalize text-body">{r.referredType}</td>
                  <td className="px-4 py-3">
                    <select
                      value={r.kind}
                      onChange={(e) => patch(r.id, { kind: e.target.value as RewardRule['kind'] })}
                      className="h-9 rounded-lg border border-line bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="percent">Percent</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={r.value}
                        onChange={(e) => patch(r.id, { value: Number(e.target.value) })}
                        className="h-9 w-24 rounded-lg border border-line bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <span className="text-xs text-faint">{r.kind === 'percent' ? '%' : currencyOf(r.referrerType)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {r.referredType === 'vendor' ? (
                      <input
                        type="number"
                        value={r.vendorApprovalBonus ?? ''}
                        placeholder="0"
                        onChange={(e) => patch(r.id, { vendorApprovalBonus: e.target.value === '' ? null : Number(e.target.value) })}
                        className="h-9 w-24 rounded-lg border border-line bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    ) : (
                      <span className="text-xs text-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => patch(r.id, { active: !r.active })}
                      className={`h-6 w-11 rounded-full transition-colors ${r.active ? 'bg-primary' : 'bg-line'}`}
                    >
                      <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${r.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" loading={savingKey === key} onClick={() => save(r)}>
                      {savedKey === key ? <><Check size={14} /> Saved</> : 'Save'}
                    </Button>
                  </td>
                </tr>
              );
            })}
            {rules.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-faint">No reward rules configured.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
