'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, Power, TriangleAlert } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDate } from '@/lib/utils';
import type { Paginated } from '@/types';
import type { Company } from '@/types/ops';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState<Company | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<Paginated<Company>>('/companies?limit=100')
      .then((res) => { setCompanies(res.data.data); setTotal(res.data.meta.total); })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function confirmToggle() {
    if (!toggling) return;
    setBusy(true);
    const next = toggling.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/companies/${toggling.id}/status`, { status: next });
      setToggling(null);
      load();
    } catch (err) {
      setError(apiErr(err));
      setToggling(null);
    } finally {
      setBusy(false);
    }
  }

  const awaiting = companies.filter((c) => c.activationStatus === 'awaiting_approval').length;
  const activeCount = companies.filter((c) => c.status === 'active').length;

  const columns: Column<Company>[] = [
    { key: 'name', header: 'Name', sortable: true, value: (c) => c.name, render: (c) => <span className="flex items-center gap-2.5 font-medium text-ink"><Avatar name={c.name} size={28} /> {c.name}</span> },
    { key: 'owner', header: 'Owner', render: (c) => <span className="text-body">{c.ownerEmail}</span> },
    { key: 'industry', header: 'Industry', render: (c) => <span className="text-body">{c.industry ?? '—'}</span> },
    { key: 'activation', header: 'Activation', value: (c) => c.activationStatus, render: (c) => <Badge variant={c.activationStatus === 'active' ? 'success' : 'warning'}>{c.activationStatus.replace(/_/g, ' ')}</Badge> },
    { key: 'status', header: 'Status', sortable: true, value: (c) => c.status, render: (c) => <Chip>{c.status}</Chip> },
    { key: 'joined', header: 'Joined', render: (c) => <span className="text-body">{formatDate(c.createdAt)}</span> },
    {
      key: 'actions', header: '', render: (c) => (
        <div className="flex justify-end">
          <Button size="sm" variant={c.status === 'active' ? 'outline' : 'soft'} onClick={() => setToggling(c)}>
            <Power size={13} /> {c.status === 'active' ? 'Suspend' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi icon={<Building2 size={16} />} iconClass="bg-info text-white" label="Total Companies" value={String(total)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Active" value={String(activeCount)} hint="Live accounts" />
        <StatBlock label="Awaiting approval" value={String(awaiting)} hint="Need review" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>
      ) : error ? (
        <p className="py-12 text-center text-sm text-danger">{error}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={companies}
          searchPlaceholder="Search by name or owner"
          filters={[{ label: 'Status', options: [] }, { label: 'Activation', options: [] }]}
          pageSize={10}
          emptyText="No companies yet."
        />
      )}

      <ConfirmModal
        open={!!toggling}
        onClose={() => setToggling(null)}
        onConfirm={confirmToggle}
        icon={<TriangleAlert size={20} />}
        danger={toggling?.status === 'active'}
        title={toggling?.status === 'active' ? `Suspend ${toggling?.name}?` : `Activate ${toggling?.name}?`}
        body={
          toggling?.status === 'active'
            ? 'Suspending blocks the company and its employees from placing new orders. Wallet balances are preserved.'
            : 'Activating lets the company and its employees place orders again.'
        }
        confirmLabel={busy ? 'Saving…' : toggling?.status === 'active' ? 'Suspend' : 'Activate'}
      />
    </div>
  );
}
