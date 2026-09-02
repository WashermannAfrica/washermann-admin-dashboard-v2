'use client';

import { useCallback, useEffect, useState } from 'react';
import { Scale, X, Check } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip, statusTone } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, SelectField } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { ApiResponse, Paginated } from '@/types';
import type { DisputeListItem, DisputeDetail, DisputeCounts } from '@/types/ops';

const pretty = (s: string) => s.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const OPEN_STATUSES = ['reported', 'under_review', 'investigating'];

export default function DisputesPage() {
  const [rows, setRows] = useState<DisputeListItem[]>([]);
  const [counts, setCounts] = useState<DisputeCounts>({ total: 0, open: 0, investigating: 0, closed: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [group, setGroup] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [selected, setSelected] = useState<DisputeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ outcome: 'refund', refundWP: '', note: '', reject: false });

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) p.set('search', search);
    if (status) p.set('status', status);
    else if (group) p.set('group', group);
    api
      .get<Paginated<DisputeListItem> & { counts: DisputeCounts }>(`/disputes?${p.toString()}`)
      .then((res) => {
        setRows(res.data.data);
        setTotal(res.data.meta.total);
        if (res.data.counts) setCounts(res.data.counts);
      })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, [page, search, group, status]);

  useEffect(load, [load]);

  function openDetail(id: string) {
    setDetailLoading(true);
    setSelected(null);
    api
      .get<ApiResponse<DisputeDetail>>(`/disputes/${id}`)
      .then((res) => setSelected(res.data.data))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setDetailLoading(false));
  }

  async function advance(next: 'under_review' | 'investigating') {
    if (!selected) return;
    setBusy(true);
    try {
      await api.patch(`/disputes/${selected.id}/status`, { status: next });
      openDetail(selected.id);
      load();
    } catch (err) { setError(apiErr(err)); } finally { setBusy(false); }
  }

  async function submitResolve(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      await api.post(`/disputes/${selected.id}/resolve`, {
        reject: form.reject,
        ...(form.reject ? {} : { outcome: form.outcome }),
        ...(form.note.trim() ? { note: form.note.trim() } : {}),
        ...(!form.reject && form.refundWP ? { refundWP: Number(form.refundWP) } : {}),
      });
      setResolveOpen(false);
      setForm({ outcome: 'refund', refundWP: '', note: '', reject: false });
      openDetail(selected.id);
      load();
    } catch (err) { setError(apiErr(err)); } finally { setBusy(false); }
  }

  const isOpen = selected && OPEN_STATUSES.includes(selected.status);

  const columns: Column<DisputeListItem>[] = [
    { key: 'reference', header: 'Dispute ID', render: (d) => <span className="font-mono text-xs text-ink">{d.reference}</span> },
    { key: 'order', header: 'Order', render: (d) => <span className="font-mono text-xs text-body">{d.orderRef ?? d.orderId.slice(0, 8) + '…'}</span> },
    { key: 'issue', header: 'Reason', value: (d) => d.issueType, render: (d) => <span className="font-medium text-ink">{pretty(d.issueType)}</span> },
    { key: 'items', header: 'Items', render: (d) => <span className="text-body">{d.affectedItems.map((i) => `${i.label}×${i.qty}`).join(', ') || '—'}</span> },
    { key: 'date', header: 'Date', sortable: true, value: (d) => d.createdAt, render: (d) => <span className="text-body">{formatDate(d.createdAt)}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (d) => d.status, render: (d) => <Chip tone={statusTone(d.status)}>{pretty(d.status)}</Chip> },
    { key: 'view', header: '', render: (d) => <button onClick={() => openDetail(d.id)} className="cursor-pointer font-medium text-primary underline-offset-2 hover:underline">View Detail</button> },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi icon={<Scale size={16} />} iconClass="bg-danger text-white" label="Total Disputes" value={String(counts.total)} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatBlock label="Open" value={String(counts.open)} hint="Awaiting resolution" />
        <StatBlock label="Investigating" value={String(counts.investigating)} />
        <StatBlock label="Closed" value={String(counts.closed)} hint="Resolved / rejected" />
      </div>

      {error ? (
        <p className="py-12 text-center text-sm text-danger">{error}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          searchPlaceholder="Search by dispute ID or reason"
          onSearch={(q) => { setSearch(q); setPage(1); }}
          serverPagination={{ page, pageSize: 20, total, onPageChange: setPage }}
          onFilter={(label, v) => {
            if (label === 'Status') { setStatus(v); setGroup(null); }
            if (label === 'Group') { setGroup(v ? v.toLowerCase() : null); setStatus(null); }
            setPage(1);
          }}
          filters={[
            { label: 'Group', options: ['Open', 'Closed'] },
            { label: 'Status', options: ['reported', 'under_review', 'investigating', 'resolved', 'rejected'] },
          ]}
          pageSize={10}
          emptyText="No disputes yet."
        />
      )}

      {/* Detail drawer */}
      {(selected || detailLoading) && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => { setSelected(null); }}>
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6">
              <h2 className="text-lg font-bold text-ink">Dispute Details</h2>
              <button onClick={() => setSelected(null)} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-faint hover:bg-section"><X size={16} /></button>
            </div>

            {detailLoading || !selected ? (
              <div className="flex flex-1 items-center justify-center text-primary"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                  <div>
                    <p className="text-xs text-faint">Dispute ID</p>
                    <p className="text-2xl font-extrabold tracking-tight text-primary">{selected.reference}</p>
                    <p className="mt-1 text-xs text-faint">{formatDateTime(selected.createdAt)}</p>
                  </div>

                  <dl className="space-y-2 border-y border-line py-3 text-sm">
                    <div className="flex justify-between"><dt className="text-faint">Status</dt><dd><Chip tone={statusTone(selected.status)}>{pretty(selected.status)}</Chip></dd></div>
                    <div className="flex justify-between"><dt className="text-faint">Order</dt><dd className="font-mono text-xs text-ink">{selected.orderRef ?? '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-faint">Reason</dt><dd className="font-medium text-ink">{pretty(selected.issueType)}</dd></div>
                    <div className="flex items-start justify-between gap-3"><dt className="text-faint">Affected</dt><dd className="text-right font-medium text-ink">{selected.affectedItems.map((i) => `${i.label} ×${i.qty}`).join(', ')}</dd></div>
                    <div className="flex items-start justify-between gap-3"><dt className="text-faint">Wants</dt><dd className="text-right text-body">{selected.preferredResolutions.map(pretty).join(', ')}</dd></div>
                  </dl>

                  <div className="rounded-2xl bg-section p-4">
                    <p className="text-xs text-faint">Description</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink">{selected.description}</p>
                  </div>

                  {selected.evidenceUrls.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Evidence</p>
                      <div className="flex flex-wrap gap-2">
                        {selected.evidenceUrls.map((u, i) => (
                          <a key={i} href={u} target="_blank" rel="noreferrer" className="block h-16 w-16 overflow-hidden rounded-lg border border-line">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={u} alt="evidence" className="h-full w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.resolution && (
                    <div className="rounded-2xl border border-success/30 bg-success-bg/40 p-4 text-sm">
                      <p className="font-semibold text-ink">Resolution — {pretty(selected.resolution.outcome)}</p>
                      {selected.resolution.refundedWP ? <p className="mt-1 text-body">{selected.resolution.refundedWP} WP credited</p> : null}
                      {selected.resolution.note && <p className="mt-1 text-body">{selected.resolution.note}</p>}
                    </div>
                  )}

                  {/* Timeline */}
                  <div>
                    <p className="mb-2 text-sm font-bold text-ink">Timeline</p>
                    <ol className="space-y-4">
                      {selected.timeline.map((t, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="relative flex flex-col items-center">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"><Check size={12} strokeWidth={3} /></span>
                            {i < selected.timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-ink">{pretty(t.status)}</span>
                            {t.note && <span className="block text-xs text-body">{t.note}</span>}
                            <span className="text-xs text-faint">{formatDateTime(t.at)}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Actions */}
                {isOpen && (
                  <div className="space-y-2 border-t border-line px-6 py-4">
                    <div className="flex gap-2">
                      {selected.status === 'reported' && <Button variant="outline" className="flex-1" loading={busy} onClick={() => advance('under_review')}>Under review</Button>}
                      {selected.status !== 'investigating' && <Button variant="outline" className="flex-1" loading={busy} onClick={() => advance('investigating')}>Investigate</Button>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="danger" className="flex-1" onClick={() => { setForm((f) => ({ ...f, reject: true })); setResolveOpen(true); }}>Reject</Button>
                      <Button className="flex-1" onClick={() => { setForm((f) => ({ ...f, reject: false })); setResolveOpen(true); }}>Resolve</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Resolve / reject modal */}
      <Modal open={resolveOpen} onClose={() => setResolveOpen(false)} title={form.reject ? 'Reject dispute' : 'Resolve dispute'}>
        <form className="space-y-4" onSubmit={submitResolve}>
          {!form.reject && (
            <>
              <SelectField label="Outcome" value={form.outcome} onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}>
                <option value="refund">Refund</option>
                <option value="rewash">Rewash</option>
                <option value="compensation">Compensation</option>
              </SelectField>
              <Input label="Credit WashPoints (optional)" type="number" placeholder="e.g. 500" value={form.refundWP} onChange={(e) => setForm((f) => ({ ...f, refundWP: e.target.value }))} />
              <p className="-mt-2 text-xs text-faint">Credited to the customer&apos;s wallet immediately.</p>
            </>
          )}
          <Textarea label="Note to customer" placeholder={form.reject ? 'Why is this being closed?' : 'What was done?'} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setResolveOpen(false)}>Cancel</Button>
            <Button type="submit" variant={form.reject ? 'danger' : 'primary'} className="flex-1" loading={busy}>{form.reject ? 'Reject' : 'Resolve'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
