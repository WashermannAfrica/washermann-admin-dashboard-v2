'use client';

import { useState } from 'react';
import { Banknote, ChevronRight, Check } from 'lucide-react';
import { Section, Panel } from '@/components/ui/Section';
import { LineChart } from '@/components/ui/LineChart';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { TRANSACTIONS, DISPUTES_SERIES, Txn } from '@/lib/mock-data';

const SCANS = [
  { name: 'Full Scan', desc: 'All ledgers and reconciliations' },
  { name: 'Wallet Scan', desc: 'User wallet balance integrity' },
  { name: 'Escrow Scan', desc: 'Held funds vs commitments' },
  { name: 'Payout Scan', desc: 'Vendor disbursement matches' },
  { name: 'Revenue Scan', desc: 'Fees, commissions, taxes' },
];

export default function FinancialsPage() {
  const [scanStep, setScanStep] = useState<0 | 1 | 2 | 3>(0);
  const [scanType, setScanType] = useState('Full Scan');

  function runScan(name: string) {
    setScanType(name);
    setScanStep(2);
    setTimeout(() => setScanStep(3), 1800);
  }

  const columns: Column<Txn>[] = [
    { key: 'type', header: 'Type', sortable: true, value: (t) => t.type, render: (t) => <span className="font-medium text-ink">{t.type}</span> },
    {
      key: 'from', header: 'From', render: (t) => (
        <span className="flex items-center gap-2.5 font-medium text-ink">
          <Avatar name={t.from} size={28} /> {t.from}
        </span>
      ),
    },
    { key: 'amount', header: 'Amount', render: (t) => <span className="font-medium text-ink">{t.amount}</span> },
    { key: 'date', header: 'Date', sortable: true, value: (t) => t.date, render: (t) => <span className="text-body">{t.date}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (t) => t.status, render: (t) => <Chip>{t.status}</Chip> },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header KPI + actions — matches Financials.png */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
            <Banknote size={16} />
          </span>
          <p className="mt-3 text-[13px] text-body">Company Fundings</p>
          <p className="mt-1 text-5xl font-bold tracking-tight text-ink">₦350,000</p>
          <p className="mt-2 text-xs font-medium text-success">↗ + 245,000 wash points</p>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => setScanStep(1)}>Run Discrepancy Check</Button>
          <Button>Pay All Vendors (₦171,700)</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-section px-5 py-4">
          <p className="text-[13px] text-body">Escrows</p>
          <p className="mt-1 text-2xl font-bold text-ink">₦1,850,000</p>
          <p className="mt-1.5 text-xs text-faint">≈ 18.1M wash points</p>
        </div>
        <div className="rounded-2xl bg-section px-5 py-4">
          <p className="text-[13px] text-body">Payouts</p>
          <p className="mt-1 text-2xl font-bold text-ink">₦4,320,000</p>
          <p className="mt-1.5 text-xs text-faint">≈ 42.3M wash points paid out</p>
        </div>
        <div className="rounded-2xl bg-section px-5 py-4">
          <p className="text-[13px] text-body">User Fundings (top-ups by users)</p>
          <p className="mt-1 text-2xl font-bold text-ink">₦6,750,000</p>
          <p className="mt-1.5 text-xs text-faint">≈ 66.1M wash-points purchased</p>
        </div>
      </div>

      <div className="grid gap-4 border-b border-line pb-6 sm:grid-cols-2">
        <div>
          <p className="text-[13px] text-body">Revenue</p>
          <p className="mt-1 text-2xl font-bold text-ink">₦985,000</p>
          <p className="mt-1 text-xs text-faint">Platform earnings this month</p>
        </div>
        <div>
          <p className="text-[13px] text-body">Current Conversion rate</p>
          <p className="mt-1 text-2xl font-bold text-ink">₦100 = 980 wash points</p>
          <p className="mt-1 text-xs text-faint">Current rate</p>
        </div>
      </div>

      {/* Disputes per month chart */}
      <Section>
        <Panel>
          <p className="text-[13px] text-body">Disputes per Month by Status</p>
          <div className="mt-2">
            <LineChart
              legend
              rangeLabel="12 Months"
              series={[
                { name: 'Credits', color: '#13C490', data: DISPUTES_SERIES.credits },
                { name: 'Payouts', color: '#0FA97D', data: DISPUTES_SERIES.payouts },
                { name: 'Escrows', color: '#7BD7BC', data: DISPUTES_SERIES.escrows },
              ]}
            />
          </div>
        </Panel>
      </Section>

      <DataTable
        columns={columns}
        rows={TRANSACTIONS}
        searchPlaceholder="Search"
        filters={[{ label: 'Status', options: [] }, { label: 'Type', options: [] }, { label: 'Date', options: [] }]}
        pageSize={5}
      />

      {/* Financial Integrity Scanner — matches Financial Integrity Scanner.png */}
      <Modal open={scanStep > 0} onClose={() => setScanStep(0)} title="Financial Integrity Scanner">
        {scanStep === 1 && (
          <div className="space-y-2.5">
            {SCANS.map((s) => (
              <button
                key={s.name}
                onClick={() => runScan(s.name)}
                className="flex w-full items-center justify-between rounded-2xl bg-section px-5 py-4 text-left transition-colors hover:bg-mint-soft"
              >
                <span>
                  <span className="block text-[13px] font-semibold text-ink">{s.name}</span>
                  <span className="mt-0.5 block text-xs text-faint">{s.desc}</span>
                </span>
                <ChevronRight size={16} className="text-faint" />
              </button>
            ))}
            <div className="flex gap-3 pt-3">
              <Button variant="outline" className="flex-1" onClick={() => setScanStep(0)}>Cancel</Button>
              <Button className="flex-1" onClick={() => runScan('Full Scan')}>Proceed</Button>
            </div>
          </div>
        )}
        {scanStep === 2 && (
          <div className="flex flex-col items-center py-10">
            <Spinner size="lg" />
            <p className="mt-5 text-sm font-medium text-ink">Running {scanType}…</p>
            <p className="mt-1 text-xs text-faint">Checking ledgers, balances and reconciliations</p>
          </div>
        )}
        {scanStep === 3 && (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mint-soft text-primary">
              <Check size={26} strokeWidth={3} />
            </span>
            <h3 className="text-lg font-bold text-ink">{scanType} complete</h3>
            <p className="mt-2 max-w-xs text-sm text-body">
              No discrepancies found. All ledger entries reconcile with wallet, escrow and payout balances.
            </p>
            <Button className="mt-6 w-full" onClick={() => setScanStep(0)}>Done</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
