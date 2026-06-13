'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, Mail } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, SelectField } from '@/components/ui/Input';
import { COMPANIES_DATA, Company } from '@/lib/mock-data';

export default function CompaniesPage() {
  const [addOpen, setAddOpen] = useState(false);

  const columns: Column<Company>[] = [
    {
      key: 'name', header: 'Name', sortable: true, value: (c) => c.name,
      render: (c) => (
        <span className="flex items-center gap-2.5 font-medium text-ink">
          <Avatar name={c.name} size={28} /> {c.name}
        </span>
      ),
    },
    { key: 'contact', header: 'Contact Person', render: (c) => <span className="font-medium text-ink">{c.email}</span> },
    { key: 'employees', header: 'Workers', render: (c) => <span className="text-body">{c.employees}</span> },
    {
      key: 'wallet', header: 'Wallet', render: (c) => (
        <span>
          <span className="block font-semibold text-ink">₦{(parseInt(c.walletWp) * 0.115 * 1000).toLocaleString()}</span>
          <span className="text-xs text-faint">{c.walletWp}</span>
        </span>
      ),
    },
    { key: 'status', header: 'Status', sortable: true, value: (c) => c.status, render: (c) => <Chip>{c.status}</Chip> },
    {
      key: 'view', header: '', render: (c) => (
        <Link href={`/companies/${c.id}`} className="font-medium text-ink underline-offset-2 hover:underline">
          View Detail
        </Link>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi
        icon={<Building2 size={16} />}
        iconClass="bg-violet text-white"
        label="Total Companies"
        value="200"
        delta="+6 over the last 7 days"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Best Performing" value="SparkleWash" hint="↗ 610 · 580 orders · ₦3,200,000" />
        <StatBlock label="Active Companies" value="100" hint="↘ 55 · Currently working" />
      </div>

      <DataTable
        columns={columns}
        rows={COMPANIES_DATA}
        searchPlaceholder="Search by employee"
        filters={[{ label: 'Status', options: [] }, { label: 'Tier', options: [] }]}
        pageSize={5}
        headerExtra={
          <button
            onClick={() => setAddOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            <Plus size={14} /> Add Company
          </button>
        }
      />

      {/* Add Company — matches Add Company.png */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Company">
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); setAddOpen(false); }}
        >
          <Input label="Company Name" required placeholder="e.g, ABC Transport" />
          <Input label="Email" required type="email" placeholder="you@company.com" leftIcon={<Mail size={15} />} />
          <Input label="Phone number" required placeholder="+234 (555) 000-0000" />
          <SelectField label="Industry" required defaultValue="">
            <option value="" disabled>Select industry</option>
            <option>Logistics</option>
            <option>Hospitality</option>
            <option>Technology</option>
            <option>Manufacturing</option>
            <option>Other</option>
          </SelectField>
          <Textarea label="Address" placeholder="Enter company's address" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
