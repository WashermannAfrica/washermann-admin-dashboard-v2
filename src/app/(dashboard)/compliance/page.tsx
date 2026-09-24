'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldAlert, Plus, Ban, Check, Play, Gavel, Zap } from 'lucide-react';
import { PageKpi } from '@/components/ui/PageKpi';
import { Tabs } from '@/components/ui/Tabs';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea, SelectField } from '@/components/ui/Input';
import { EntitySearchSelect } from '@/components/ui/EntitySearchSelect';
import { RowMenu } from '@/components/ui/RowMenu';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDate } from '@/lib/utils';
import type { ApiResponse, Paginated } from '@/types';

type Deduction = {
  id: string; vendorId: string; amountWp: number; nairaSnapshot: number | null; reason: string;
  status: 'pending_response' | 'applied' | 'cancelled'; respondBy: string; respondedAt: string | null;
  vendorResponse: string | null; appliedAt: string | null; createdAt: string;
};
type Suspension = {
  id: string; subjectType: 'vendor' | 'rep'; subjectId: string; reason: string;
  status: 'notice' | 'withdrawn' | 'suspended' | 'under_review' | 'reinstated'; immediate: boolean;
  respondBy: string | null; response: string | null; reviewNote: string | null; createdAt: string;
};
type AbandonedOrder = {
  id: string; reference: string; abandonedAt: string | null; disposalMethod: string | null;
  disposalNote: string | null; uncollectedNoticeCount: number; createdAt: string;
};

type VendorLite = { id: string; businessName: string | null; user?: { fullName?: string; email?: string } };
type RepLite = { id: string; phone?: string | null; user?: { fullName?: string; email?: string } };

const day = (s: string | null) => (s ? formatDate(s) : '—');
const wp = (n: number) => `${Number(n || 0).toLocaleString()} WP`;
const vendorLabel = (v: VendorLite) => v.businessName || v.user?.fullName || v.id;
const vendorSub = (v: VendorLite) => (v.businessName && v.user?.fullName ? v.user.fullName : v.user?.email);
const repLabel = (r: RepLite) => r.user?.fullName || r.id;
const repSub = (r: RepLite) => r.phone || r.user?.email || undefined;

export default function CompliancePage() {
  const [tab, setTab] = useState('Deductions');
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi icon={<ShieldAlert size={16} />} iconClass="bg-forest text-white" label="Compliance" value="Earnings & access controls" />
      <Tabs tabs={['Deductions', 'Suspensions', 'Abandoned']} active={tab} onChange={setTab} />
      {tab === 'Deductions' && <DeductionsTab />}
      {tab === 'Suspensions' && <SuspensionsTab />}
      {tab === 'Abandoned' && <AbandonedTab />}
    </div>
  );
}

// ─── Deductions ─────────────────────────────────────────────────────────────────
function DeductionsTab() {
  const [rows, setRows] = useState<Deduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [raise, setRaise] = useState(false);
  const [form, setForm] = useState({ vendorId: '', amountWp: '', reason: '' });

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<Deduction[]>>('/earnings-deductions')
      .then((r) => setRows(r.data.data)).catch((e) => setError(apiErr(e))).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  async function create() {
    setBusy(true); setError('');
    try {
      await api.post('/earnings-deductions', { vendorId: form.vendorId.trim(), amountWp: Number(form.amountWp), reason: form.reason.trim() });
      setRaise(false); setForm({ vendorId: '', amountWp: '', reason: '' }); load();
    } catch (e) { setError(apiErr(e)); } finally { setBusy(false); }
  }
  async function act(id: string, action: 'apply' | 'cancel') {
    setBusy(true); setError('');
    try { await api.post(`/earnings-deductions/${id}/${action}`); load(); }
    catch (e) { setError(apiErr(e)); } finally { setBusy(false); }
  }

  const columns: Column<Deduction>[] = [
    { key: 'vendor', header: 'Vendor', render: (d) => <span className="font-mono text-xs text-ink">{d.vendorId.slice(0, 8)}…</span> },
    { key: 'amount', header: 'Amount', render: (d) => <span className="font-semibold text-ink">{wp(d.amountWp)}</span> },
    { key: 'reason', header: 'Reason', render: (d) => <span className="text-body">{d.reason}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (d) => d.status, render: (d) => <Chip>{d.status.replace('_', ' ')}</Chip> },
    { key: 'respondBy', header: 'Respond by', render: (d) => <span className="text-body">{day(d.respondBy)}</span> },
    { key: 'created', header: 'Raised', render: (d) => <span className="text-body">{day(d.createdAt)}</span> },
    {
      key: 'actions', header: '', render: (d) => d.status === 'pending_response' ? (
        <RowMenu items={[
          { label: 'Apply now', icon: <Check size={14} />, onClick: () => act(d.id, 'apply') },
          { label: 'Cancel', icon: <Ban size={14} />, danger: true, onClick: () => act(d.id, 'cancel') },
        ]} />
      ) : <span className="text-xs text-faint">—</span>,
    },
  ];

  if (loading) return <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>;
  return (
    <div className="space-y-3">
      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}
      <div className="flex justify-end">
        <Button onClick={() => setRaise(true)}><Plus size={14} /> Raise deduction</Button>
      </div>
      <DataTable columns={columns} rows={rows} searchPlaceholder="Search deductions" filters={[{ label: 'Status', options: ['pending_response', 'applied', 'cancelled'] }]} pageSize={10} emptyText="No deductions." />

      <Modal open={raise} onClose={() => setRaise(false)} title="Raise earnings deduction">
        <div className="space-y-4">
          <p className="text-sm text-faint">The vendor is notified and given the response window before the amount is debited. You can also start this from a vendor’s detail page.</p>
          <EntitySearchSelect<VendorLite>
            label="Vendor"
            required
            endpoint="/vendors"
            value={form.vendorId}
            onChange={(id) => setForm((f) => ({ ...f, vendorId: id }))}
            getId={(v) => v.id}
            getLabel={vendorLabel}
            getSub={vendorSub}
            placeholder="Search by business or owner name…"
          />
          <Input label="Amount (WP)" type="number" min={1} value={form.amountWp} onChange={(e) => setForm((f) => ({ ...f, amountWp: e.target.value }))} required />
          <Textarea label="Reason" rows={2} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Substantiated claim detail + order ref" />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setRaise(false)}>Cancel</Button>
            <Button className="flex-1" loading={busy} disabled={!form.vendorId.trim() || !(Number(form.amountWp) > 0) || form.reason.trim().length < 3} onClick={create}>Raise</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Suspensions ────────────────────────────────────────────────────────────────
function SuspensionsTab() {
  const [rows, setRows] = useState<Suspension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [issue, setIssue] = useState(false);
  const [form, setForm] = useState<{ subjectType: 'vendor' | 'rep'; subjectId: string; reason: string; immediate: boolean }>({ subjectType: 'vendor', subjectId: '', reason: '', immediate: false });
  const [review, setReview] = useState<Suspension | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'upheld' | 'overturned'>('overturned');
  const [reviewNote, setReviewNote] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<Suspension[]>>('/suspensions')
      .then((r) => setRows(r.data.data)).catch((e) => setError(apiErr(e))).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  async function create() {
    setBusy(true); setError('');
    try {
      const body = { subjectType: form.subjectType, subjectId: form.subjectId.trim(), reason: form.reason.trim() };
      await api.post(form.immediate ? '/suspensions/immediate' : '/suspensions', body);
      setIssue(false); setForm({ subjectType: 'vendor', subjectId: '', reason: '', immediate: false }); load();
    } catch (e) { setError(apiErr(e)); } finally { setBusy(false); }
  }
  async function act(id: string, action: 'enforce' | 'withdraw') {
    setBusy(true); setError('');
    try { await api.post(`/suspensions/${id}/${action}`); load(); }
    catch (e) { setError(apiErr(e)); } finally { setBusy(false); }
  }
  async function decide() {
    if (!review) return;
    setBusy(true); setError('');
    try {
      await api.post(`/suspensions/${review.id}/review-decision`, { decision: reviewDecision, note: reviewNote.trim() || undefined });
      setReview(null); setReviewNote(''); load();
    } catch (e) { setError(apiErr(e)); } finally { setBusy(false); }
  }

  const columns: Column<Suspension>[] = [
    { key: 'subject', header: 'Subject', render: (s) => <span><Chip>{s.subjectType}</Chip> <span className="ml-1 font-mono text-xs text-ink">{s.subjectId.slice(0, 8)}…</span></span> },
    { key: 'reason', header: 'Reason', render: (s) => <span className="text-body">{s.reason}{s.immediate && <span className="ml-1 text-xs font-semibold text-danger">(immediate)</span>}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (s) => s.status, render: (s) => <Chip>{s.status.replace('_', ' ')}</Chip> },
    { key: 'respondBy', header: 'Respond by', render: (s) => <span className="text-body">{day(s.respondBy)}</span> },
    { key: 'created', header: 'Raised', render: (s) => <span className="text-body">{day(s.createdAt)}</span> },
    {
      key: 'actions', header: '', render: (s) => {
        const items = [];
        if (s.status === 'notice') {
          items.push({ label: 'Enforce suspension', icon: <Zap size={14} />, danger: true, onClick: () => act(s.id, 'enforce') });
          items.push({ label: 'Withdraw notice', icon: <Ban size={14} />, onClick: () => act(s.id, 'withdraw') });
        }
        if (s.status === 'under_review') {
          items.push({ label: 'Decide review', icon: <Gavel size={14} />, onClick: () => { setReview(s); setReviewDecision('overturned'); setReviewNote(''); } });
        }
        return items.length ? <RowMenu items={items} /> : <span className="text-xs text-faint">—</span>;
      },
    },
  ];

  if (loading) return <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>;
  return (
    <div className="space-y-3">
      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}
      <div className="flex justify-end">
        <Button onClick={() => setIssue(true)}><Plus size={14} /> Issue suspension</Button>
      </div>
      <DataTable columns={columns} rows={rows} searchPlaceholder="Search suspensions" filters={[{ label: 'Status', options: ['notice', 'suspended', 'under_review', 'reinstated', 'withdrawn'] }]} pageSize={10} emptyText="No suspension notices." />

      <Modal open={issue} onClose={() => setIssue(false)} title="Issue suspension">
        <div className="space-y-4">
          <SelectField label="Subject type" value={form.subjectType} onChange={(e) => setForm((f) => ({ ...f, subjectType: e.target.value as 'vendor' | 'rep', subjectId: '' }))}>
            <option value="vendor">Vendor</option>
            <option value="rep">Rep</option>
          </SelectField>
          {form.subjectType === 'vendor' ? (
            <EntitySearchSelect<VendorLite>
              label="Vendor"
              required
              endpoint="/vendors"
              value={form.subjectId}
              onChange={(id) => setForm((f) => ({ ...f, subjectId: id }))}
              getId={(v) => v.id}
              getLabel={vendorLabel}
              getSub={vendorSub}
              placeholder="Search by business or owner name…"
            />
          ) : (
            <EntitySearchSelect<RepLite>
              label="Rep"
              required
              endpoint="/reps"
              value={form.subjectId}
              onChange={(id) => setForm((f) => ({ ...f, subjectId: id }))}
              getId={(r) => r.id}
              getLabel={repLabel}
              getSub={repSub}
              placeholder="Search by rep name…"
            />
          )}
          <Textarea label="Reason" rows={2} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-body">
            <input type="checkbox" checked={form.immediate} onChange={(e) => setForm((f) => ({ ...f, immediate: e.target.checked }))} className="h-4 w-4 rounded border-line" />
            Immediate (fraud/safety — suspend now, no response window)
          </label>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIssue(false)}>Cancel</Button>
            <Button variant={form.immediate ? 'danger' : 'primary'} className="flex-1" loading={busy} disabled={!form.subjectId.trim() || form.reason.trim().length < 3} onClick={create}>
              {form.immediate ? 'Suspend now' : 'Issue notice'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!review} onClose={() => setReview(null)} title="Decide internal review">
        <div className="space-y-4">
          <SelectField label="Decision" value={reviewDecision} onChange={(e) => setReviewDecision(e.target.value as 'upheld' | 'overturned')}>
            <option value="overturned">Overturn — reinstate</option>
            <option value="upheld">Uphold — stays suspended</option>
          </SelectField>
          <Textarea label="Note (optional)" rows={2} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setReview(null)}>Cancel</Button>
            <Button className="flex-1" loading={busy} onClick={decide}>Submit decision</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Abandoned orders ───────────────────────────────────────────────────────────
function AbandonedTab() {
  const [rows, setRows] = useState<AbandonedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [disposing, setDisposing] = useState<AbandonedOrder | null>(null);
  const [method, setMethod] = useState('donated');
  const [note, setNote] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get<Paginated<AbandonedOrder>>('/orders?status=abandoned&limit=100')
      .then((r) => setRows(r.data.data)).catch((e) => setError(apiErr(e))).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  async function record() {
    if (!disposing) return;
    setBusy(true); setError('');
    try {
      await api.post(`/orders/${disposing.id}/disposal`, { method, note: note.trim() || undefined });
      setDisposing(null); setNote(''); load();
    } catch (e) { setError(apiErr(e)); } finally { setBusy(false); }
  }

  const columns: Column<AbandonedOrder>[] = [
    { key: 'ref', header: 'Order', render: (o) => <span className="font-mono text-xs text-ink">{o.reference}</span> },
    { key: 'notices', header: 'Notices', render: (o) => <span className="text-body">{o.uncollectedNoticeCount}</span> },
    { key: 'abandoned', header: 'Abandoned', render: (o) => <span className="text-body">{day(o.abandonedAt)}</span> },
    { key: 'disposal', header: 'Disposal', render: (o) => o.disposalMethod && o.disposalMethod !== 'pending' ? <Chip>{o.disposalMethod.replace(/_/g, ' ')}</Chip> : <Chip tone="warn">pending</Chip> },
    {
      key: 'actions', header: '', render: (o) => (
        <div className="flex justify-end"><Button size="sm" variant="outline" onClick={() => { setDisposing(o); setMethod('donated'); setNote(''); }}>Record disposal</Button></div>
      ),
    },
  ];

  if (loading) return <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>;
  return (
    <div className="space-y-3">
      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}
      <DataTable columns={columns} rows={rows} searchPlaceholder="Search by order ref" pageSize={10} emptyText="No abandoned orders." />

      <Modal open={!!disposing} onClose={() => setDisposing(null)} title={`Record disposal · ${disposing?.reference ?? ''}`}>
        <div className="space-y-4">
          <SelectField label="Disposal outcome" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="store_at_cost">Stored at cost</option>
            <option value="donated">Donated</option>
            <option value="sold">Sold</option>
            <option value="disposed">Disposed</option>
          </SelectField>
          <Textarea label="Note (incl. proceeds handling)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDisposing(null)}>Cancel</Button>
            <Button className="flex-1" loading={busy} onClick={record}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
