'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, X, ShieldCheck, FileText, Tags, Banknote, MessageSquareWarning, Star, ArrowUpRight, ChevronDown } from 'lucide-react';
import { EntityHero, HeroTabs } from '@/components/ui/EntityHero';
import { Panel } from '@/components/ui/Section';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Stars } from '@/components/ui/Stars';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, Column } from '@/components/ui/DataTable';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDate } from '@/lib/utils';
import type { ApiResponse, Paginated } from '@/types';
import type { Vendor, VendorDocument, VendorPricingProposal, VendorPricingItem, PriceItemStatus, VendorWallet, VendorPayout, Order } from '@/types/ops';

const naira = (n: number) => `₦${Number(n || 0).toLocaleString()}`;
const wp = (n?: number) => `${Number(n ?? 0).toLocaleString()} WP`;
const pretty = (s: string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const itemKeyOf = (it: VendorPricingItem) => it.itemId ?? `gt:${it.garmentType}`;

/** Effective per-line status: explicit decision wins; undecided is approved on a live sheet, else pending. */
function itemStatus(p: VendorPricingProposal, it: VendorPricingItem): PriceItemStatus {
  if (it.status) return it.status;
  return p.approvedAt ? 'approved' : 'pending';
}

const TABS = ['Orders', 'Disputes', 'Payouts', 'Pricing & Services', 'Reviews'];

export default function WashermanDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [docs, setDocs] = useState<VendorDocument[]>([]);
  const [pricing, setPricing] = useState<VendorPricingProposal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payouts, setPayouts] = useState<VendorPayout[]>([]);
  const [wallet, setWallet] = useState<VendorWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('Orders');
  const [kycOpen, setKycOpen] = useState(false);
  const [openProposals, setOpenProposals] = useState<Set<string>>(new Set());
  const toggleProposal = (pid: string) =>
    setOpenProposals((prev) => {
      const next = new Set(prev);
      next.has(pid) ? next.delete(pid) : next.add(pid);
      return next;
    });

  const [rejectingVendor, setRejectingVendor] = useState(false);
  const [reason, setReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<{ p: VendorPricingProposal; item?: VendorPricingItem } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<ApiResponse<Vendor>>(`/vendors/${id}`),
      api.get<ApiResponse<VendorDocument[]>>(`/vendors/${id}/documents`).catch(() => ({ data: { data: [] } })),
      api.get<ApiResponse<VendorPricingProposal[]>>(`/vendors/${id}/pricing`).catch(() => ({ data: { data: [] } })),
      api.get<Paginated<Order>>(`/orders?vendorId=${id}&limit=50`).catch(() => ({ data: { data: [] } })),
      api.get<Paginated<VendorPayout>>(`/payouts?vendorId=${id}&limit=50`).catch(() => ({ data: { data: [] } })),
      api.get<ApiResponse<VendorWallet>>(`/vendors/${id}/wallet`).catch(() => ({ data: { data: null } })),
    ])
      .then(([v, d, p, o, py, w]) => {
        setVendor(v.data.data);
        setDocs(Array.isArray(d.data.data) ? d.data.data : []);
        const proposals = Array.isArray(p.data.data) ? p.data.data : [];
        setPricing(proposals);
        // Auto-expand the most actionable proposal: the first still awaiting review, else the latest.
        const focus = proposals.find((pr) => !pr.approvedAt && !pr.rejectedAt) ?? proposals[0];
        if (focus) setOpenProposals(new Set([focus.id]));
        setOrders(Array.isArray((o.data as Paginated<Order>).data) ? (o.data as Paginated<Order>).data : []);
        setPayouts(Array.isArray((py.data as Paginated<VendorPayout>).data) ? (py.data as Paginated<VendorPayout>).data : []);
        setWallet((w.data as ApiResponse<VendorWallet>).data ?? null);
      })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  async function verifyVendor() { setBusy(true); try { await api.post(`/vendors/${id}/verify`, { decision: 'verified' }); load(); } catch (e) { setError(apiErr(e)); } finally { setBusy(false); } }
  async function rejectVendor() { setBusy(true); try { await api.post(`/vendors/${id}/verify`, { decision: 'rejected', rejectionReason: reason.trim() || undefined }); setRejectingVendor(false); setReason(''); load(); } catch (e) { setError(apiErr(e)); } finally { setBusy(false); } }
  async function suspendVendor() { setBusy(true); try { await api.post(`/vendors/${id}/suspend`); load(); } catch (e) { setError(apiErr(e)); } finally { setBusy(false); } }
  const replaceProposal = (u: VendorPricingProposal) => setPricing((prev) => prev.map((p) => (p.id === u.id ? u : p)));

  async function approveItem(p: VendorPricingProposal, it: VendorPricingItem) {
    setBusy(true);
    try {
      const r = await api.post<ApiResponse<VendorPricingProposal>>(`/vendors/pricing/${p.id}/item-decision`, { itemKey: itemKeyOf(it), decision: 'approved' });
      replaceProposal(r.data.data);
    } catch (e) { setError(apiErr(e)); } finally { setBusy(false); }
  }
  async function approveAll(p: VendorPricingProposal) {
    setBusy(true);
    try {
      const r = await api.post<ApiResponse<VendorPricingProposal>>(`/vendors/pricing/${p.id}/approve`, { effectiveFrom: new Date().toISOString() });
      replaceProposal(r.data.data);
    } catch (e) { setError(apiErr(e)); } finally { setBusy(false); }
  }
  async function confirmReject() {
    if (!rejectTarget) return;
    const { p, item } = rejectTarget;
    const text = reason.trim();
    if (!text) { setError('A reason is required to reject.'); return; }
    setBusy(true);
    try {
      const r = await (item
        ? api.post<ApiResponse<VendorPricingProposal>>(`/vendors/pricing/${p.id}/item-decision`, { itemKey: itemKeyOf(item), decision: 'rejected', reason: text })
        : api.post<ApiResponse<VendorPricingProposal>>(`/vendors/pricing/${p.id}/reject`, { reason: text }));
      replaceProposal(r.data.data);
      setRejectTarget(null); setReason('');
    } catch (e) { setError(apiErr(e)); } finally { setBusy(false); }
  }

  if (loading) return <div className="flex justify-center py-24 text-primary"><Spinner size="lg" /></div>;
  if (error && !vendor) return <p className="py-12 text-center text-sm text-danger">{error}</p>;
  if (!vendor) return null;

  const vs = vendor.verificationStatus;
  const kycVerified = docs.length > 0 && vs === 'verified';
  const pendingPayouts = payouts.filter((p) => !['completed', 'paid', 'rejected', 'failed', 'cancelled'].includes(p.status.toLowerCase()));

  const orderCols: Column<Order>[] = [
    { key: 'ref', header: 'Reference', render: (o) => <span className="font-mono text-xs text-ink">{o.reference}</span> },
    { key: 'service', header: 'Service', render: (o) => <span className="capitalize text-body">{o.serviceType.replace('_', ' & ')}</span> },
    { key: 'amount', header: 'Amount', value: (o) => o.totalWP, render: (o) => <span className="text-ink">{o.totalWP} WP</span> },
    { key: 'status', header: 'Status', sortable: true, value: (o) => o.status, render: (o) => <Chip>{o.status.replace(/_/g, ' ')}</Chip> },
    { key: 'date', header: 'Date', render: (o) => <span className="text-body">{formatDate(o.createdAt)}</span> },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <EntityHero
        name={vendor.user?.fullName ?? vendor.businessName ?? '—'}
        contact={`${vendor.user?.email?.toLowerCase() ?? '—'}${vendor.phone ? ` · ${vendor.phone}` : ''}`}
        chips={[vs.replace(/_/g, ' '), kycVerified ? 'KYC Verified' : 'KYC Pending', vendor.businessName ?? 'Vendor']}
        onDeactivate={vs === 'verified' ? suspendVendor : undefined}
        extraActions={
          <>
            <button onClick={() => setKycOpen(true)} className="flex h-9 items-center gap-2 rounded-full bg-white/10 px-4 text-xs font-semibold text-white hover:bg-white/20 transition-colors">
              <FileText size={13} /> KYC Docs
            </button>
            {vs === 'pending_review' && (
              <>
                <button onClick={verifyVendor} disabled={busy} className="flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-dark transition-colors"><Check size={13} /> Verify</button>
                <button onClick={() => setRejectingVendor(true)} disabled={busy} className="flex h-9 items-center gap-2 rounded-full bg-danger px-4 text-xs font-semibold text-white hover:opacity-90 transition-colors"><X size={13} /> Reject</button>
              </>
            )}
            {(vs === 'suspended' || vs === 'rejected') && (
              <button onClick={verifyVendor} disabled={busy} className="flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-dark transition-colors"><ShieldCheck size={13} /> Reinstate</button>
            )}
          </>
        }
        infoRow={[
          { label: 'Avg. Rating', value: `${vendor.rating.toFixed(1)} (${vendor.ratingCount})` },
          { label: 'Total Orders', value: String(vendor.orderCount ?? orders.length) },
          { label: 'Active Disputes', value: '0' },
          { label: 'Areas', value: String(vendor.areaIds.length) },
          { label: 'Joined', value: formatDate(vendor.createdAt) },
        ]}
        tiles={[
          { label: 'Total Earnings', value: wp(wallet?.totalEarned ?? vendor.earnedWp), accent: true },
          { label: 'Available Balance', value: wp(wallet?.balance ?? vendor.balanceWp) },
          { label: 'Pending Payouts', value: String(pendingPayouts.length), hint: pendingPayouts.length === 1 ? '1 pending' : `${pendingPayouts.length} pending` },
        ]}
      />

      {error && <p className="mt-4 rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

      <HeroTabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === 'Orders' && (
          <DataTable columns={orderCols} rows={orders} searchPlaceholder="Search by reference" exportName="vendor-orders" pageSize={10} emptyText="No orders for this vendor yet." />
        )}

        {tab === 'Disputes' && (
          <Panel>
            <EmptyState icon={<MessageSquareWarning size={22} />} title="No disputes" description="Disputes raised against this vendor will appear here." />
          </Panel>
        )}

        {tab === 'Payouts' && (
          <Panel>
            <h2 className="flex items-center gap-2 font-semibold text-ink"><Banknote size={16} /> All payouts</h2>
            {payouts.length === 0 ? (
              <p className="mt-3 text-sm text-faint">No payouts yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-line">
                {payouts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-bg text-success"><ArrowUpRight size={15} /></span>
                      <div>
                        <p className="text-sm font-medium text-ink">Bank transfer</p>
                        <p className="text-xs text-faint">{formatDate(p.createdAt)} · <Chip>{p.status.replace(/_/g, ' ')}</Chip></p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-ink">{p.nairaAmount != null ? naira(p.nairaAmount) : wp(p.amountWP)}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}

        {tab === 'Pricing & Services' && (
          <Panel>
            <h2 className="flex items-center gap-2 font-semibold text-ink"><Tags size={16} /> Pricing proposals</h2>
            {pricing.length === 0 ? (
              <p className="mt-3 text-sm text-faint">No pricing submitted yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {pricing.map((p) => {
                  const finalized = !!p.approvedAt || !!p.rejectedAt;
                  const fullyRejected = !!p.rejectedAt;
                  const stagedApproved = p.items.filter((it) => it.status === 'approved').length;
                  const stagedRejected = p.items.filter((it) => it.status === 'rejected').length;
                  const staged = stagedApproved + stagedRejected;
                  const untouched = p.items.filter((it) => !it.status).length;
                  const approvedCount = p.items.filter((it) => itemStatus(p, it) === 'approved').length;
                  const rejectedCount = p.items.filter((it) => itemStatus(p, it) === 'rejected').length;
                  const headerVariant = fullyRejected ? 'danger' : !finalized ? 'warning' : 'success';
                  const headerLabel = fullyRejected ? 'rejected' : !finalized ? (staged > 0 ? 'in review' : 'pending') : 'reviewed';
                  const open = openProposals.has(p.id);
                  return (
                    <div key={p.id} className="rounded-2xl border border-line">
                      {/* Summary header — click to expand the price list */}
                      <button
                        onClick={() => toggleProposal(p.id)}
                        className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left"
                      >
                        <span className="flex flex-wrap items-center gap-2">
                          <ChevronDown size={16} className={`text-faint transition-transform ${open ? 'rotate-180' : ''}`} />
                          <Badge variant={headerVariant}>{headerLabel}</Badge>
                          <span className="text-sm font-medium text-ink">{formatDate(p.proposedAt)}</span>
                          <span className="text-xs text-faint">
                            {p.items.length} item{p.items.length === 1 ? '' : 's'}
                            {finalized
                              ? ` · ${approvedCount} approved · ${rejectedCount} rejected`
                              : staged > 0 && ` · ${stagedApproved} approved · ${stagedRejected} rejected · ${untouched} not responded`}
                          </span>
                        </span>
                        {!finalized && (
                          <span className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="soft" loading={busy} onClick={() => approveAll(p)}>
                              <Check size={13} /> {staged > 0 ? `Confirm & approve ${untouched} not responded` : 'Approve all'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setReason(''); setRejectTarget({ p }); }}>
                              <X size={13} /> {staged > 0 ? `Confirm & reject ${untouched} not responded` : 'Reject all'}
                            </Button>
                          </span>
                        )}
                      </button>
                      {open && (
                        <div className="border-t border-line p-4 pt-3">
                      {!finalized && staged > 0 && (
                        <p className="mb-2 text-xs text-faint">Decisions are staged — nothing reaches the vendor until you confirm. One summary email is sent on confirm.</p>
                      )}
                      <div className="divide-y divide-line">
                        {p.items.map((it) => {
                          const s = itemStatus(p, it);
                          return (
                            <div key={itemKeyOf(it)} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                              <span className="min-w-0 flex-1">
                                <span className="text-body">{pretty(it.garmentType)}</span>
                                <span className="ml-2 font-medium text-ink">{naira(it.priceNaira)}</span>
                                {s === 'rejected' && it.rejectionReason && <span className="ml-2 text-xs text-danger">— {it.rejectionReason}</span>}
                              </span>
                              {finalized ? (
                                <Badge variant={s === 'approved' ? 'success' : 'danger'}>{s === 'approved' ? 'approved · locked' : 'rejected'}</Badge>
                              ) : (
                                <span className="flex items-center gap-1.5">
                                  <button title="Stage approve" disabled={busy} onClick={() => approveItem(p, it)}
                                    className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${s === 'approved' ? 'border-success bg-success-bg text-success' : 'border-line text-faint hover:border-success hover:text-success'}`}><Check size={14} /></button>
                                  <button title="Stage reject" disabled={busy} onClick={() => { setReason(''); setRejectTarget({ p, item: it }); }}
                                    className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${s === 'rejected' ? 'border-danger bg-danger-bg text-danger' : 'border-line text-faint hover:border-danger hover:text-danger'}`}><X size={14} /></button>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {p.rejectionReason && fullyRejected && <p className="mt-2 text-xs text-danger">Reason: {p.rejectionReason}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        )}

        {tab === 'Reviews' && (
          <Panel>
            <div className="flex flex-wrap items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-ink">{vendor.rating.toFixed(1)}</p>
                <Stars rating={Math.round(vendor.rating)} size={16} />
                <p className="mt-1 text-xs text-faint">{vendor.ratingCount} rating{vendor.ratingCount === 1 ? '' : 's'}</p>
              </div>
              <div className="flex-1 min-w-[200px]">
                <EmptyState icon={<Star size={22} />} title="No written reviews yet" description="Individual customer reviews will appear here once available." />
              </div>
            </div>
          </Panel>
        )}
      </div>

      {/* KYC documents */}
      <Modal open={kycOpen} onClose={() => setKycOpen(false)} title="KYC Verified Documents">
        {docs.length === 0 ? (
          <p className="text-sm text-faint">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => (
              <a key={d.id} href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-line p-3 hover:bg-section">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-bg text-danger"><FileText size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{pretty(d.documentType)}</p>
                  <p className="truncate text-xs text-faint">{d.originalName ?? d.fileUrl}</p>
                </div>
                <Badge variant="blue">View</Badge>
              </a>
            ))}
          </div>
        )}
      </Modal>

      {/* reject vendor */}
      <Modal open={rejectingVendor} onClose={() => setRejectingVendor(false)} title={`Reject ${vendor.user?.fullName ?? 'vendor'}`}>
        <div className="space-y-4">
          <Textarea label="Reason" placeholder="Why is this vendor being rejected?" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setRejectingVendor(false)}>Cancel</Button><Button variant="danger" className="flex-1" loading={busy} onClick={rejectVendor}>Reject vendor</Button></div>
        </div>
      </Modal>

      {/* reject pricing — single line or whole proposal */}
      <Modal
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setReason(''); }}
        title={rejectTarget?.item ? `Reject "${pretty(rejectTarget.item.garmentType)}"` : 'Confirm & reject not-responded'}
      >
        <div className="space-y-4">
          <p className="text-sm text-body">
            {rejectTarget?.item
              ? 'This decision is staged — it is recorded but the vendor is not notified until you confirm the review.'
              : 'This confirms the review: every line you did not respond to is rejected, your staged decisions are kept, and the vendor gets ONE summary email.'}
          </p>
          <Textarea label="Reason (required)" placeholder="What should the vendor correct?" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setRejectTarget(null); setReason(''); }}>Cancel</Button>
            <Button variant="danger" className="flex-1" loading={busy} onClick={confirmReject}>{rejectTarget?.item ? 'Stage rejection' : 'Confirm & reject'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
