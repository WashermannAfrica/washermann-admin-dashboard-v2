'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TriangleAlert, Banknote, FileText, Check, Eye, ShieldAlert } from 'lucide-react';
import { EntityHero, HeroTabs } from '@/components/ui/EntityHero';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Stars } from '@/components/ui/Stars';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Section, Panel } from '@/components/ui/Section';
import { Spinner } from '@/components/ui/Spinner';
import { WASHERMEN, ORDERS, DISPUTES, TRANSACTIONS, Order, Dispute, Txn } from '@/lib/mock-data';

const KYC_DOCS = [
  { name: 'Government ID', file: 'Passport - John_Okafor.pdf', date: 'Jan 14, 2026' },
  { name: 'Selfie with ID', file: 'selfie_with_id.jpg', date: 'Jan 14, 2026' },
  { name: 'Utility Bill', file: 'Electricity_Bill_Dec.pdf', date: 'Jan 14, 2026' },
  { name: 'Bank Statement', file: 'GTBank_Statement.pdf', date: 'Jan 14, 2026' },
];

const TABS = ['Orders', 'Disputes', 'Payouts', 'Pricing & Services', 'Reviews'];

/* Price matrix — matches the Pricing & Services tab design */
interface PriceRow {
  clothe: string;
  washOnly: string;
  washIron: string;
  dryCleaning: string;
  [key: string]: unknown;
}
const PRICE_MATRIX: PriceRow[] = [
  { clothe: 'Turtle neck sweater', washOnly: '₦1,201,849.78', washIron: '₦1,850,820.32', dryCleaning: '₦1,055,230.79' },
  { clothe: 'Sweater Vest', washOnly: '₦1,089,649.04', washIron: '₦451,430.94', dryCleaning: '₦1,990,983.12' },
  { clothe: 'Fanny sweater', washOnly: '₦1,080,000.20', washIron: '₦1,537,874.53', dryCleaning: '₦123,554.29' },
  { clothe: 'Acrylic sweater', washOnly: '₦544,831.13', washIron: '₦59,166.40', dryCleaning: '₦51,333.32' },
  { clothe: 'Shawl collar sweater', washOnly: '₦1,575,242.83', washIron: '₦1,201,743.17', dryCleaning: '₦1,949,290.97' },
];
const priceCols: Column<PriceRow>[] = [
  { key: 'clothe', header: 'Clothe Type', render: (r) => <span className="font-medium text-ink">{r.clothe}</span> },
  { key: 'washOnly', header: 'Wash Only', render: (r) => <span className="text-ink">{r.washOnly}</span> },
  { key: 'washIron', header: 'Wash & Iron', render: (r) => <span className="text-ink">{r.washIron}</span> },
  { key: 'dryCleaning', header: 'Dry Cleaning', render: (r) => <span className="text-ink">{r.dryCleaning}</span> },
];

export default function WashermanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const w = WASHERMEN.find((x) => x.id === params.id) ?? WASHERMEN[0];
  const [tab, setTab] = useState('Orders');
  const [kycOpen, setKycOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [payStep, setPayStep] = useState<0 | 1 | 2 | 3>(0); // 0 closed, 1 summary, 2 processing, 3 done

  function startProcessing() {
    setPayStep(2);
    setTimeout(() => setPayStep(3), 1600);
  }

  const orderCols: Column<Order>[] = [
    { key: 'trackingId', header: 'Tracking ID', render: (o) => <span className="text-body">{o.trackingId}</span> },
    {
      key: 'name', header: 'Name', sortable: true, value: (o) => o.name,
      render: (o) => (
        <span className="flex items-center gap-2.5 font-medium text-ink">
          <Avatar name={o.name} size={28} /> {o.name}
        </span>
      ),
    },
    { key: 'amount', header: 'Amount', render: (o) => <span className="text-ink">{o.amount}</span> },
    { key: 'date', header: 'Date', sortable: true, value: (o) => o.date, render: (o) => <span className="text-body">{o.date}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (o) => o.status, render: (o) => <Chip>{o.status}</Chip> },
    { key: 'view', header: '', render: () => <button onClick={() => router.push('/orders')} className="cursor-pointer font-medium text-ink underline-offset-2 hover:underline">View Detail</button> },
  ];

  const disputeCols: Column<Dispute>[] = [
    { key: 'id', header: 'Dispute ID', render: (d) => <span className="text-body">{d.id}</span> },
    { key: 'category', header: 'Category', render: (d) => <span className="font-medium text-ink">{d.category}</span> },
    { key: 'amount', header: 'Amount', render: (d) => <span className="text-ink">{d.amount}</span> },
    { key: 'status', header: 'Status', render: (d) => <Chip>{d.status}</Chip> },
  ];

  const payoutCols: Column<Txn>[] = [
    { key: 'type', header: 'Type', render: (t) => <span className="font-medium text-ink">{t.type}</span> },
    { key: 'amount', header: 'Amount', render: (t) => <span className="text-ink">{t.amount}</span> },
    { key: 'date', header: 'Date', render: (t) => <span className="text-body">{t.date}</span> },
    { key: 'status', header: 'Status', render: (t) => <Chip>{t.status}</Chip> },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <EntityHero
        name={w.name}
        contact={`${w.email}, ${w.phone}`}
        chips={[w.status, 'KYC Verified', 'Contract']}
        onChipClick={(c) => c === 'KYC Verified' && setKycOpen(true)}
        onDeactivate={() => setDeactivateOpen(true)}
        extraActions={
          <button
            onClick={() => setPayStep(1)}
            className="flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            <Banknote size={13} /> Process Pay
          </button>
        }
        infoRow={[
          { label: 'Avg. Rating', value: w.rating.toFixed(1) },
          { label: 'Total Orders', value: '1,284' },
          { label: 'Active Disputes', value: '02' },
          { label: 'Location', value: 'Lagos, Nigeria' },
          { label: 'Last Active', value: '12 min ago' },
        ]}
        tiles={[
          { label: 'Total Earnings', value: '245,000 pts', hint: '≈ ₦64,200', accent: true },
          { label: 'Escrow Balance', value: '1,284', hint: '≈ 245,000 wash points' },
          { label: 'Pending Payouts', value: w.pendingPayout, hint: '1 pending' },
        ]}
      />

      <HeroTabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="mt-4">
        {tab === 'Orders' && <DataTable columns={orderCols} rows={ORDERS.slice(0, 15)} searchPlaceholder="Search by tracking ID" pageSize={5} />}
        {tab === 'Disputes' && <DataTable columns={disputeCols} rows={DISPUTES.slice(0, 6)} searchPlaceholder="Search disputes" pageSize={5} />}
        {tab === 'Payouts' && <DataTable columns={payoutCols} rows={TRANSACTIONS.filter((t) => t.type === 'Payout')} searchPlaceholder="Search payouts" pageSize={5} />}
        {tab === 'Pricing & Services' && (
          <DataTable
            columns={priceCols}
            rows={PRICE_MATRIX}
            searchPlaceholder="Search"
            filters={[{ label: 'Status', options: [] }, { label: 'Date', options: [] }]}
            pageSize={5}
          />
        )}
        {tab === 'Reviews' && (
          <Section>
            <div className="space-y-3">
              {ORDERS.slice(0, 4).map((o, i) => (
                <Panel key={o.trackingId}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2.5 font-medium text-ink">
                      <Avatar name={o.name} size={28} /> {o.name}
                    </span>
                    <Stars rating={5 - (i % 2)} />
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-body">
                    Great service — clothes came back fresh and neatly folded. Pickup and delivery were right on time.
                  </p>
                  <p className="mt-2 text-xs text-faint">{o.date}</p>
                </Panel>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* KYC Verified Documents — matches KYC Verified Documents.png */}
      <Modal open={kycOpen} onClose={() => setKycOpen(false)} title="KYC Verified Documents">
        <div className="space-y-2.5">
          {KYC_DOCS.map((d) => (
            <div key={d.name} className="flex items-center gap-3 rounded-2xl border border-line p-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-bg text-danger">
                <FileText size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ink">{d.name}</p>
                <p className="truncate text-xs text-faint">{d.file} · {d.date}</p>
              </div>
              <span className="flex items-center gap-2 text-faint">
                <Eye size={14} className="cursor-pointer hover:text-ink" />
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success-bg text-success">
                  <Check size={11} strokeWidth={3} />
                </span>
              </span>
            </div>
          ))}
        </div>
      </Modal>

      {/* Process Washerman Payment — matches the 3 Process Washerman Payment screens */}
      <Modal open={payStep > 0} onClose={() => setPayStep(0)} title="Process Washerman Payment">
        {payStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2 rounded-2xl border border-line p-4">
              {[
                ['Total Vendors', '42'],
                ['Failed Accounts', '3'],
                ['Total Amount', '₦130,500'],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between">
                  <span className="text-[13px] text-faint">{l}</span>
                  <span className="text-[13px] font-bold text-ink">{v}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-line pt-2">
                <span className="text-[13px] text-faint">Net Payable</span>
                <span className="text-[13px] font-bold text-primary">₦120,900</span>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-section p-4">
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-danger" />
              <p className="text-[13px] leading-relaxed text-body">
                Validated balance, duplicates, discrepancies, and account integrity.
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setPayStep(0)}>Cancel</Button>
              <Button className="flex-1" onClick={startProcessing}>Proceed</Button>
            </div>
          </div>
        )}
        {payStep === 2 && (
          <div className="flex flex-col items-center py-10">
            <Spinner size="lg" />
            <p className="mt-5 text-sm font-medium text-ink">Processing payments…</p>
            <p className="mt-1 text-xs text-faint">Disbursing ₦120,900 to 39 vendor accounts</p>
          </div>
        )}
        {payStep === 3 && (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mint-soft text-primary">
              <Check size={26} strokeWidth={3} />
            </span>
            <h3 className="text-lg font-bold text-ink">Payment Successful</h3>
            <p className="mt-2 max-w-xs text-sm text-body">₦120,900 disbursed to 39 vendors. 3 failed accounts have been queued for retry.</p>
            <Button className="mt-6 w-full" onClick={() => setPayStep(0)}>Done</Button>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        icon={<TriangleAlert size={20} />}
        title={`Deactivate ${w.name}?`}
        body="Deactivating this washerman removes them from all order assignments. Escrowed funds remain held until the open orders complete."
        confirmLabel="Deactivate"
      />
    </div>
  );
}
