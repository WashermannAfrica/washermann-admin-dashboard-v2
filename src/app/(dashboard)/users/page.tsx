'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users as UsersIcon } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDate } from '@/lib/utils';
import type { Paginated, User } from '@/types';

const ROLE_LABEL: Record<string, string> = {
  user: 'Customer', vendor: 'Vendor', rep: 'Wash Rep', sales_rep: 'Sales Rep',
  admin: 'Admin', finance: 'Finance', company_owner: 'Company Owner', company_admin: 'Company Admin',
  dispute_resolver: 'Dispute Resolver', washerman: 'Washerman',
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ by: string; dir: 'ASC' | 'DESC' } | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (sort) { params.set('sortBy', sort.by); params.set('sortDir', sort.dir); }
    api
      .get<Paginated<User>>(`/users?${params.toString()}`)
      .then((res) => { setUsers(res.data.data); setTotal(res.data.meta.total); })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, [search, page, status, sort]);

  const activeCount = users.filter((u) => u.status === 'active').length;

  const columns: Column<User>[] = [
    {
      key: 'name', header: 'Name', sortable: true, value: (u) => u.fullName,
      render: (u) => <span className="flex items-center gap-2.5 font-medium text-ink"><Avatar name={u.fullName} size={28} dot={u.status === 'active'} /> {u.fullName}</span>,
    },
    { key: 'contact', header: 'Contact', render: (u) => <span className="text-body">{u.email ?? u.phone ?? '—'}</span> },
    {
      key: 'roles', header: 'Roles', value: (u) => u.roles.join(','),
      render: (u) => <span className="flex flex-wrap gap-1">{u.roles.map((r) => <Badge key={r} variant="blue">{ROLE_LABEL[r] ?? r}</Badge>)}</span>,
    },
    { key: 'joined', header: 'Joined', sortable: true, value: (u) => u.createdAt, render: (u) => <span className="text-body">{formatDate(u.createdAt)}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (u) => u.status, render: (u) => <Chip>{u.status}</Chip> },
    {
      key: 'view', header: '', render: (u) => (
        <span onClick={() => router.push(`/users/${u.id}`)} className="cursor-pointer font-medium text-ink underline-offset-2 hover:underline">View Detail</span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi icon={<UsersIcon size={16} />} iconClass="bg-[#E5177E] text-white" label="Total Users" value={String(total)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Active Users" value={String(activeCount)} hint="On the platform" />
        <StatBlock label="Loaded" value={String(users.length)} hint={`of ${total}`} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>
      ) : error ? (
        <p className="py-12 text-center text-sm text-danger">{error}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={users}
          searchPlaceholder="Search by name or contact"
          onSearch={(q) => { setSearch(q); setPage(1); }}
          serverPagination={{ page, pageSize: 20, total, onPageChange: setPage }}
          onSort={(by, dir) => { setSort({ by, dir: dir === 1 ? 'ASC' : 'DESC' }); setPage(1); }}
          onFilter={(label, v) => { if (label === 'Status') { setStatus(v); setPage(1); } }}
          filters={[{ label: 'Status', options: ['active', 'pending', 'suspended', 'deactivated'] }]}
          pageSize={10}
          emptyText="No users yet."
        />
      )}
    </div>
  );
}
