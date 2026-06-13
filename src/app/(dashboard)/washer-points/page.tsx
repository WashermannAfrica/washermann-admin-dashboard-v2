'use client';

import { useState } from 'react';
import { Gift, Plus, Trash2 } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { HeroTabs } from '@/components/ui/EntityHero';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Drawer, DrawerRow } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, SelectField } from '@/components/ui/Input';

interface VaultRow {
  name: string;
  totalPoints: string;
  available: string;
  expires: string;
  status: 'Active' | 'Matured' | 'Expired';
  [key: string]: unknown;
}
const VAULT_ROWS: VaultRow[] = [
  { name: 'Promo Vault Q2', totalPoints: '10,000', available: '7,200', expires: '2026-06-30', status: 'Active' },
  { name: 'Main Vault', totalPoints: '50,000', available: '34,200', expires: '2026-06-30', status: 'Active' },
  { name: 'Legacy Vault', totalPoints: '20,000', available: '0', expires: '2026-03-31', status: 'Expired' },
  { name: 'Q1 2026 Vault', totalPoints: '50,000', available: '34,200', expires: '2026-06-30', status: 'Active' },
  { name: 'Corporate Vault', totalPoints: '120,000', available: '98,000', expires: '2026-12-31', status: 'Active' },
];

interface CouponRow {
  code: string;
  type: '%' | 'Fixed';
  value: string;
  usage: string;
  status: 'Redeemed' | 'Active' | 'Expired';
  [key: string]: unknown;
}
const COUPON_ROWS: CouponRow[] = [
  { code: 'WF-ABC12345', type: '%', value: '10%', usage: '100/100', status: 'Redeemed' },
  { code: 'WF-DEF67890', type: 'Fixed', value: '₦500', usage: '100/100', status: 'Active' },
  { code: 'WF-GHJ24680', type: '%', value: '20%', usage: '100/100', status: 'Expired' },
];

interface GiftRow {
  code: string;
  valueWp: string;
  buyer: string;
  recipient: string;
  status: 'Redeemed' | 'Active' | 'Expired';
  date: string;
  [key: string]: unknown;
}
const GIFT_ROWS: GiftRow[] = [
  { code: 'GC-7000', valueWp: '1,000 WP', buyer: 'Arlene McCoy', recipient: 'Esther Howard', status: 'Active', date: '14 May 2026' },
  { code: 'GC-7137', valueWp: '2,000 WP', buyer: 'Floyd Miles', recipient: 'Jenny Wilson', status: 'Redeemed', date: '15 May 2026' },
  { code: 'GC-7274', valueWp: '4,000 WP', buyer: 'Savannah Nguyen', recipient: 'Jacob Jones', status: 'Active', date: '16 May 2026' },
  { code: 'GC-7411', valueWp: '1,000 WP', buyer: 'Kathryn Murphy', recipient: 'Robert Fox', status: 'Expired', date: '17 May 2026' },
];

const TABS = ['Washpoint Vaults', 'Coupons', 'Gift Cards'];

export default function WasherPointsPage() {
  const [tab, setTab] = useState('Coupons');
  const [vault, setVault] = useState<VaultRow | null>(null);
  const [createCouponOpen, setCreateCouponOpen] = useState(false);
  const [addVaultOpen, setAddVaultOpen] = useState(false);

  const couponTone = (s: string): 'info' | 'success' | 'warn' =>
    s === 'Redeemed' ? 'info' : s === 'Active' ? 'success' : 'warn';

  const vaultCols: Column<VaultRow>[] = [
    {
      key: 'name', header: 'Vault Name', sortable: true, value: (v) => v.name,
      render: (v) => (
        <button onClick={() => setVault(v)} className="font-medium text-ink underline-offset-2 hover:underline">
          {v.name}
        </button>
      ),
    },
    { key: 'totalPoints', header: 'Total Points', render: (v) => <span className="text-ink">{v.totalPoints}</span> },
    { key: 'available', header: 'Available', render: (v) => <span className="text-ink">{v.available}</span> },
    { key: 'expires', header: 'Expires', render: (v) => <span className="text-body">{v.expires}</span> },
    { key: 'status', header: 'Status', render: (v) => <Chip>{v.status}</Chip> },
  ];

  const couponCols: Column<CouponRow>[] = [
    { key: 'code', header: 'Code', render: (c) => <span className="font-semibold text-ink">{c.code}</span> },
    { key: 'type', header: 'Type', render: (c) => <span className="text-body">{c.type}</span> },
    { key: 'value', header: 'Value', render: (c) => <span className="text-ink">{c.value}</span> },
    { key: 'usage', header: 'Usage', render: (c) => <span className="text-body">{c.usage}</span> },
    { key: 'status', header: 'Status', render: (c) => <Chip tone={couponTone(c.status)}>{c.status}</Chip> },
    { key: 'del', header: '', render: () => <Trash2 size={15} className="cursor-pointer text-danger hover:opacity-70" /> },
  ];

  const giftCols: Column<GiftRow>[] = [
    { key: 'code', header: 'Code', render: (g) => <span className="font-semibold text-ink">{g.code}</span> },
    { key: 'valueWp', header: 'Value', render: (g) => <span className="text-ink">{g.valueWp}</span> },
    {
      key: 'buyer', header: 'Buyer', render: (g) => (
        <span className="flex items-center gap-2.5 font-medium text-ink">
          <Avatar name={g.buyer} size={28} /> {g.buyer}
        </span>
      ),
    },
    { key: 'recipient', header: 'Recipient', render: (g) => <span className="text-body">{g.recipient}</span> },
    { key: 'date', header: 'Date', render: (g) => <span className="text-body">{g.date}</span> },
    { key: 'status', header: 'Status', render: (g) => <Chip tone={couponTone(g.status)}>{g.status}</Chip> },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi
        icon={<Gift size={16} />}
        iconClass="bg-primary text-white"
        label="Active Vaults"
        value="05"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Active Coupons" value="03" hint="180 orders" />
        <StatBlock label="Gift Cards" value="04" hint="Across board" />
      </div>

      <HeroTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'Washpoint Vaults' && (
        <DataTable
          columns={vaultCols}
          rows={VAULT_ROWS}
          searchPlaceholder="Search by tracking ID"
          pageSize={5}
          headerExtra={
            <button
              onClick={() => setAddVaultOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
            >
              <Plus size={14} /> Add Vault
            </button>
          }
        />
      )}
      {tab === 'Coupons' && (
        <DataTable
          columns={couponCols}
          rows={COUPON_ROWS}
          searchPlaceholder="Search..."
          pageSize={5}
          headerExtra={
            <button
              onClick={() => setCreateCouponOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
            >
              <Plus size={14} /> Create Coupons
            </button>
          }
        />
      )}
      {tab === 'Gift Cards' && (
        <DataTable columns={giftCols} rows={GIFT_ROWS} searchPlaceholder="Search..." pageSize={5} />
      )}

      {/* Vault detail drawer — matches Q1 2026 Vault.png */}
      <Drawer
        open={!!vault}
        onClose={() => setVault(null)}
        title={vault?.name ?? 'Vault'}
        footer={
          <>
            <Button variant="outline" onClick={() => setVault(null)}>Cancel</Button>
            <Button onClick={() => setVault(null)}>Add Vault</Button>
          </>
        }
      >
        {vault && (
          <div className="space-y-1 divide-y divide-line [&>div]:py-2.5">
            <DrawerRow label="Total Points">{vault.totalPoints}</DrawerRow>
            <DrawerRow label="Available Points">{vault.available}</DrawerRow>
            <DrawerRow label="Conversion Rate">—</DrawerRow>
            <DrawerRow label="Threshold">—</DrawerRow>
            <DrawerRow label="On Threshold">—</DrawerRow>
            <DrawerRow label="Status"><Chip>{vault.status}</Chip></DrawerRow>
            <DrawerRow label="Expires">{vault.expires}</DrawerRow>
            <DrawerRow label="Description">Main vault for Q1 customer conversions</DrawerRow>
            <div>
              <div className="mt-2 h-2 w-full rounded-full bg-section">
                <div className="h-2 rounded-full bg-primary" style={{ width: '62%' }} />
              </div>
              <p className="mt-1.5 text-right text-xs text-faint">12/500 used</p>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Coupon — matches Add Coupon.png */}
      <Modal open={createCouponOpen} onClose={() => setCreateCouponOpen(false)} title="Create Coupon">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setCreateCouponOpen(false); }}>
          <Input label="Coupon Code" required placeholder="e.g, WF-ABC12345" />
          <SelectField label="Type" required defaultValue="">
            <option value="" disabled>Select type</option>
            <option>Percentage (%)</option>
            <option>Fixed (₦)</option>
          </SelectField>
          <Input label="Value" required placeholder="e.g, 10" />
          <Input label="Max Uses" required type="number" placeholder="100" />
          <Input label="Expiry Date" required type="date" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateCouponOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Create Coupon</Button>
          </div>
        </form>
      </Modal>

      {/* Add Vault — matches Add Vault.png */}
      <Modal open={addVaultOpen} onClose={() => setAddVaultOpen(false)} title="Add Vault">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setAddVaultOpen(false); }}>
          <Input label="Vault Name" required placeholder="e.g, Q3 2026 Vault" />
          <Input label="Total Points" required type="number" placeholder="50,000" />
          <Input label="Expiry Date" required type="date" />
          <Textarea label="Description" placeholder="What is this vault for?" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddVaultOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Add Vault</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
