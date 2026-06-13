'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TriangleAlert, ArrowUp, Plus, Mail } from 'lucide-react';
import { EntityHero, HeroTabs } from '@/components/ui/EntityHero';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, SelectField } from '@/components/ui/Input';
import { Section, Panel } from '@/components/ui/Section';
import { COMPANIES_DATA, USERS, ORDERS, TIERS, PlatformUser, Order } from '@/lib/mock-data';

const WP_SUMMARY = [
  { label: 'Total Purchased', value: '18,462 pts', hint: '≈ ₦92,250' },
  { label: 'Total Used', value: '18,462 pts', hint: '≈ ₦92,250' },
  { label: 'Points Lost', value: '18,462 pts', hint: '≈ ₦92,250' },
  { label: 'In Circulation', value: '1,200 pts', hint: '≈ ₦92,250' },
];

export default function CompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const company = COMPANIES_DATA.find((c) => c.id === params.id) ?? COMPANIES_DATA[0];
  const [tab, setTab] = useState('Workers');
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [addWorkerOpen, setAddWorkerOpen] = useState(false);

  const workerCols: Column<PlatformUser>[] = [
    {
      key: 'name', header: 'Name', sortable: true, value: (u) => u.name,
      render: (u) => (
        <span className="flex items-center gap-2.5 font-medium text-ink">
          <Avatar name={u.name} size={28} dot /> {u.name}
        </span>
      ),
    },
    {
      key: 'tier', header: 'Tier', render: (u) => (
        <span className="rounded-md border border-line px-2 py-0.5 text-[11px] text-body">
          {(['Basic', 'Standard', 'Premium'] as const)[u.orders % 3]} Tier
        </span>
      ),
    },
    { key: 'balance', header: 'Balance', render: (u) => <span className="text-ink">{u.walletWp.replace(' WP', ' pts')}</span> },
    { key: 'spent', header: 'Spent', render: (u) => <span className="text-ink">-{u.orders * 10} pts</span> },
    { key: 'status', header: 'Status', render: (u) => <Chip>{u.status}</Chip> },
    { key: 'view', header: '', render: () => <button onClick={() => router.push('/orders')} className="cursor-pointer font-medium text-ink underline-offset-2 hover:underline">View Detail</button> },
  ];

  const orderCols: Column<Order>[] = [
    { key: 'trackingId', header: 'Tracking ID', render: (o) => <span className="text-body">{o.trackingId}</span> },
    { key: 'amount', header: 'Amount', render: (o) => <span className="text-ink">{o.amount}</span> },
    { key: 'date', header: 'Date', sortable: true, value: (o) => o.date, render: (o) => <span className="text-body">{o.date}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (o) => o.status, render: (o) => <Chip>{o.status}</Chip> },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <EntityHero
        name={company.name}
        contact={company.email}
        chips={[company.status, `${company.tier} Tier`]}
        onDeactivate={() => setDeactivateOpen(true)}
        infoRow={[
          { label: 'Total Orders', value: '100' },
          { label: 'Workers', value: String(company.employees) },
          { label: 'Location', value: 'Lagos, Nigeria' },
          { label: 'Date Joined', value: '2026-04-01' },
          { label: 'Contact Person', value: 'Adebayo Johnson' },
        ]}
        tiles={[
          {
            label: 'Wallet Balance',
            value: '₦184,500',
            hint: '≈ 92,250 pts',
            accent: true,
            action: (
              <button
                onClick={() => setGiftOpen(true)}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-forest hover:bg-mint-soft transition-colors"
              >
                <ArrowUp size={13} /> Gift Washpoints
              </button>
            ),
          },
        ]}
      />

      {/* Washpoints Summary — matches Workers.png */}
      <h2 className="mt-7 text-lg font-bold text-ink">Washpoints Summary</h2>
      <Section className="mt-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WP_SUMMARY.map((s) => (
            <Panel key={s.label}>
              <p className="text-[13px] text-body">{s.label}</p>
              <p className="mt-1.5 text-2xl font-bold text-ink">{s.value}</p>
              <p className="mt-1 text-xs text-primary">{s.hint}</p>
            </Panel>
          ))}
        </div>
      </Section>

      <HeroTabs tabs={['Tiers', 'Workers', 'Orders']} active={tab} onChange={setTab} />

      <div className="mt-4">
        {tab === 'Workers' && (
          <DataTable
            columns={workerCols}
            rows={USERS.slice(0, 14)}
            searchPlaceholder="Search by employee"
            filters={[{ label: 'Status', options: [] }, { label: 'Tier', options: [] }]}
            pageSize={5}
            headerExtra={
              <button
                onClick={() => setAddWorkerOpen(true)}
                className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
              >
                <Plus size={14} /> Add Worker
              </button>
            }
          />
        )}
        {tab === 'Orders' && <DataTable columns={orderCols} rows={ORDERS.slice(0, 15)} searchPlaceholder="Search by tracking ID" pageSize={5} />}
        {tab === 'Tiers' && (
          <Section>
            <div className="grid gap-3 sm:grid-cols-3">
              {TIERS.map((t) => (
                <Panel key={t.name}>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-ink">{t.name}</p>
                    <Chip tone={t.name === company.tier ? 'success' : 'neutral'}>
                      {t.name === company.tier ? 'Current' : 'Available'}
                    </Chip>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-ink">{t.monthlyWp}</p>
                  <p className="mt-1 text-xs text-faint">{t.perks}</p>
                  <p className="mt-3 text-sm font-semibold text-primary">{t.price}</p>
                </Panel>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Gift Washpoints */}
      <Modal open={giftOpen} onClose={() => setGiftOpen(false)} title="Gift Washpoints">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setGiftOpen(false); }}>
          <Input label="Amount (WP)" required type="number" placeholder="e.g, 5000" />
          <SelectField label="Reason" required defaultValue="">
            <option value="" disabled>Select reason</option>
            <option>Promotion</option>
            <option>Goodwill / apology</option>
            <option>Contract bonus</option>
          </SelectField>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setGiftOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Gift Points</Button>
          </div>
        </form>
      </Modal>

      {/* Add Worker — matches Add Worker.png */}
      <Modal open={addWorkerOpen} onClose={() => setAddWorkerOpen(false)} title="Add Worker">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setAddWorkerOpen(false); }}>
          <Input label="Full Name" required placeholder="e.g, Adebayo Johnson" />
          <Input label="Email" required type="email" placeholder="you@company.com" leftIcon={<Mail size={15} />} />
          <Input label="Phone number" required placeholder="+234 (555) 000-0000" />
          <SelectField label="Tier" required defaultValue="">
            <option value="" disabled>Select tier</option>
            {TIERS.map((t) => <option key={t.name}>{t.name}</option>)}
          </SelectField>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddWorkerOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Add Worker</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        icon={<TriangleAlert size={20} />}
        title={`Deactivate ${company.name}?`}
        body="Deactivating this company will pause all employee benefits and block new orders from its teams. Existing orders will continue to completion."
        confirmLabel="Deactivate"
      />
    </div>
  );
}
