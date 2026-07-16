'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import type { ApiResponse } from '@/types';
import type { Referral } from '@/types/ops';

const fmtAmount = (r: Referral) =>
  r.rewardAmount == null ? '—' : r.rewardCurrency === 'cash' ? `₦${Number(r.rewardAmount).toLocaleString()}` : `${r.rewardAmount} WP`;

export function ReferralsTab() {
  const [rows, setRows] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    // Backend GET /referrals returns the array directly under `data`.
    api
      .get<ApiResponse<Referral[]>>('/referrals')
      .then((res) => setRows(Array.isArray(res.data.data) ? res.data.data : []))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const columns: Column<Referral>[] = [
    { key: 'code', header: 'Code', sortable: true, value: (r) => r.code, render: (r) => <span className="font-mono text-xs font-semibold text-ink">{r.code}</span> },
    {
      key: 'referrer', header: 'Referrer', value: (r) => r.referrerType,
      render: (r) => (
        <span>
          <span className="block text-sm text-ink">{r.referrerName ?? '—'}</span>
          <Badge variant="blue">{r.referrerType.replace('_', ' ')}</Badge>
        </span>
      ),
    },
    {
      key: 'referred', header: 'Referred', value: (r) => r.referredType,
      render: (r) => (
        <span>
          <span className="block text-sm font-medium text-ink">{r.referredName ?? '—'}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-faint">
            <Badge variant="neutral">{r.referredType}</Badge>
            {r.referredEmail ? r.referredEmail.toLowerCase() : ''}
          </span>
        </span>
      ),
    },
    { key: 'amount', header: 'Reward', render: (r) => <span className="text-ink">{fmtAmount(r)}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (r) => r.status, render: (r) => <Chip>{r.status}</Chip> },
    { key: 'created', header: 'Created', render: (r) => <span className="text-body">{formatDate(r.createdAt)}</span> },
  ];

  if (loading) return <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-3">
      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}
      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search by code"
        filters={[{ label: 'Status', options: [] }, { label: 'Referrer', options: [] }, { label: 'Referred', options: [] }]}
        pageSize={12}
        emptyText="No referrals yet."
      />
    </div>
  );
}
