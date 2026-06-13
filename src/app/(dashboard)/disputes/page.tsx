'use client';

import { useState } from 'react';
import { Scale, Plus, FileImage } from 'lucide-react';
import { ActionsPill } from '@/components/ui/ActionsPill';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { Section, Panel } from '@/components/ui/Section';
import { LineChart } from '@/components/ui/LineChart';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Drawer, DrawerRow } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, SelectField } from '@/components/ui/Input';
import { DISPUTES, Dispute } from '@/lib/mock-data';

const SERIES = [320, 360, 340, 400, 430, 410, 460, 500, 480, 540, 590, 640];

export default function DisputesPage() {
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const columns: Column<Dispute>[] = [
    { key: 'id', header: 'Dispute ID', render: (d) => <span className="font-medium text-ink">#{d.id.replace('DSP-', 'DIS-')}</span> },
    { key: 'orderId', header: 'Order ID', render: (d) => <span className="text-body">#{d.orderId.replace('ORD-2025-', 'WM-882')}</span> },
    { key: 'category', header: 'Reason for Dispute', sortable: true, value: (d) => d.category, render: (d) => <span className="font-medium text-ink">{d.category}</span> },
    { key: 'date', header: 'Date', sortable: true, value: (d) => d.date, render: (d) => <span className="text-body">{d.date}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (d) => d.status, render: (d) => <Chip>{d.status}</Chip> },
    {
      key: 'view', header: '', render: (d) => (
        <button onClick={() => setSelected(d)} className="font-medium text-ink underline-offset-2 hover:underline">
          View Detail
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi
        icon={<Scale size={16} />}
        iconClass="bg-danger text-white"
        label="Total Disputes"
        value="150"
        delta="+6 over the last 7 days"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Open" value="100" />
        <StatBlock label="In review" value="50" />
      </div>

      <Section>
        <Panel>
          <p className="text-[13px] text-body">Disputes per Month by Status</p>
          <div className="mt-3">
            <LineChart series={[{ name: 'Disputes', color: '#D2483B', data: SERIES, fill: true }]} rangeLabel="12 Months" />
          </div>
        </Panel>
      </Section>

      <DataTable
        columns={columns}
        rows={DISPUTES}
        searchPlaceholder="Search by tracking ID"
        pageSize={5}
        headerExtra={
          <button
            onClick={() => setNewOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
          >
            <Plus size={14} /> New Dispute
          </button>
        }
      />

      {/* Dispute Details drawer — matches Dispute details.png */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Dispute Details"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={() => setSelected(null)}>Apply Update</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div>
              <p className="text-xs text-faint">Tracking ID</p>
              <div className="mt-1 flex items-center justify-between">
                <h3 className="text-3xl font-bold text-ink">{selected.id}</h3>
                <ActionsPill
                  actions={[
                    { label: 'Resolve dispute' },
                    { label: 'Escalate' },
                    { label: 'Request more info' },
                    { label: 'Reject claim', danger: true },
                  ]}
                />
              </div>
              <p className="mt-1 text-xs text-faint">{selected.date}, 00:21</p>
            </div>

            <div className="border-y border-line py-3">
              <DrawerRow label="Status"><Chip>{selected.status}</Chip></DrawerRow>
              <DrawerRow label="Order ID"><span className="font-semibold text-primary underline underline-offset-2">{selected.orderId}</span></DrawerRow>
              <DrawerRow label="Amount">₦8,500</DrawerRow>
              <DrawerRow label="WP Used">{selected.amount}</DrawerRow>
            </div>

            <div className="border-b border-line pb-3">
              <DrawerRow label="Dispute Category">{selected.category}</DrawerRow>
              <DrawerRow label="User">{selected.raisedBy}</DrawerRow>
              <DrawerRow label="Company">Dangote Industries</DrawerRow>
              <DrawerRow label="Washerman">{selected.against}</DrawerRow>
              <DrawerRow label="Rep">Ade Banjo</DrawerRow>
              <DrawerRow label="Area">Ikoyi</DrawerRow>
              <DrawerRow label="Attached Media">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-success-bg text-success">
                  <FileImage size={15} />
                </span>
              </DrawerRow>
            </div>

            <div className="rounded-2xl bg-section p-4">
              <p className="text-xs text-faint">Description</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink">{selected.description}</p>
            </div>
          </div>
        )}
      </Drawer>

      {/* New Dispute — matches New Dispute.png */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New Dispute">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setNewOpen(false); }}>
          <Input label="Order ID" required placeholder="e.g, ORD-2025-001" />
          <SelectField label="Dispute Category" required defaultValue="">
            <option value="" disabled>Select category</option>
            <option>Damaged item</option>
            <option>Late delivery</option>
            <option>Missing item</option>
            <option>Wrong order</option>
            <option>Billing issue</option>
          </SelectField>
          <Textarea label="Description" required placeholder="Describe what happened" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Create Dispute</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
