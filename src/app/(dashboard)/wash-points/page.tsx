'use client';

import { useCallback, useEffect, useState } from 'react';
import { Gift, Plus, Star, Power, Ban } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { HeroTabs } from '@/components/ui/EntityHero';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Chip } from '@/components/ui/Chip';
import { Drawer, DrawerRow } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, SelectField } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { formatDate } from '@/lib/utils';
import type { Paginated } from '@/types';

// ─── API shapes ────────────────────────────────────────────────────────────────

interface Vault {
  id: string;
  name: string;
  purpose: string;
  totalPoints: number;
  usedPoints: number;
  status: 'active' | 'exhausted' | 'deactivated';
  isDefault: boolean;
  conversionRateSnapshot: number | { pointsPerUnit?: number } | null;
  notes: string | null;
  createdAt: string;
  [key: string]: unknown;
}

interface GiftCard {
  id: string;
  code: string;
  wpValuePerUse: number;
  maxUsages: number;
  usedCount: number;
  status: 'active' | 'exhausted' | 'revoked' | 'expired';
  vaultId: string | null;
  companyId: string | null;
  expiresAt: string | null;
  createdAt: string;
  [key: string]: unknown;
}

const TABS = ['Washpoint Vaults', 'Gift Cards', 'Coupons'];

const vaultRate = (v: Vault): string => {
  const snap = v.conversionRateSnapshot;
  const rate = typeof snap === 'number' ? snap : snap?.pointsPerUnit;
  return rate ? `${rate} WP/₦` : '—';
};

const statusTone = (s: string): 'success' | 'warn' | 'neutral' | 'danger' =>
  s === 'active' ? 'success' : s === 'exhausted' ? 'warn' : s === 'revoked' ? 'danger' : 'neutral';

export default function WasherPointsPage() {
  const [tab, setTab] = useState('Washpoint Vaults');
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [vault, setVault] = useState<Vault | null>(null);       // drawer
  const [addVaultOpen, setAddVaultOpen] = useState(false);
  const [vaultForm, setVaultForm] = useState({ name: '', totalPoints: '', purpose: 'general', isDefault: false, notes: '' });
  const [addGiftOpen, setAddGiftOpen] = useState(false);
  const [giftForm, setGiftForm] = useState({ wpValuePerUse: '', maxUsages: '', expiresAt: '' });
  const [revokeCard, setRevokeCard] = useState<GiftCard | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<Paginated<Vault>>('/admin/vaults?limit=100'),
      api.get<Paginated<GiftCard>>('/admin/gift-cards?limit=100'),
    ])
      .then(([v, g]) => {
        setVaults(v.data.data);
        setGiftCards(g.data.data);
        setError('');
      })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // ─── Vault actions ───────────────────────────────────────────────────────────

  async function createVault(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setBusy(true);
    try {
      await api.post('/admin/vaults', {
        name: vaultForm.name.trim(),
        totalPoints: Number(vaultForm.totalPoints),
        purpose: vaultForm.purpose,
        isDefault: vaultForm.isDefault,
        notes: vaultForm.notes.trim() || undefined,
      });
      setAddVaultOpen(false);
      setVaultForm({ name: '', totalPoints: '', purpose: 'general', isDefault: false, notes: '' });
      load();
    } catch (err) {
      setFormError(apiErr(err));
    } finally {
      setBusy(false);
    }
  }

  async function vaultAction(id: string, action: 'deactivate' | 'set-default') {
    setBusy(true);
    setError('');
    try {
      await api.patch(`/admin/vaults/${id}/${action}`);
      setVault(null);
      load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setBusy(false);
    }
  }

  // ─── Gift card actions ───────────────────────────────────────────────────────

  async function createGiftCard(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setBusy(true);
    try {
      await api.post('/admin/gift-cards', {
        wpValuePerUse: Number(giftForm.wpValuePerUse),
        maxUsages: Number(giftForm.maxUsages),
        ...(giftForm.expiresAt ? { expiresAt: new Date(giftForm.expiresAt).toISOString() } : {}),
      });
      setAddGiftOpen(false);
      setGiftForm({ wpValuePerUse: '', maxUsages: '', expiresAt: '' });
      load();
    } catch (err) {
      setFormError(apiErr(err));
    } finally {
      setBusy(false);
    }
  }

  async function revokeGiftCard() {
    if (!revokeCard) return;
    setBusy(true);
    setError('');
    try {
      await api.delete(`/admin/gift-cards/${revokeCard.id}`);
      setRevokeCard(null);
      load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setBusy(false);
    }
  }

  // ─── Columns ─────────────────────────────────────────────────────────────────

  const vaultCols: Column<Vault>[] = [
    {
      key: 'name', header: 'Vault Name', sortable: true, value: (v) => v.name,
      render: (v) => (
        <button onClick={() => setVault(v)} className="flex items-center gap-1.5 font-medium text-ink underline-offset-2 hover:underline">
          {v.name}
          {v.isDefault && <Star size={13} className="fill-warn text-warn" aria-label="Default vault" />}
        </button>
      ),
    },
    { key: 'totalPoints', header: 'Total Points', sortable: true, value: (v) => v.totalPoints, render: (v) => <span className="text-ink">{v.totalPoints.toLocaleString()}</span> },
    { key: 'available', header: 'Available', render: (v) => <span className="text-ink">{(v.totalPoints - v.usedPoints).toLocaleString()}</span> },
    { key: 'rate', header: 'Locked Rate', render: (v) => <span className="text-body">{vaultRate(v)}</span> },
    { key: 'status', header: 'Status', sortable: true, value: (v) => v.status, render: (v) => <Chip tone={statusTone(v.status)}>{v.status}</Chip> },
  ];

  const giftCols: Column<GiftCard>[] = [
    { key: 'code', header: 'Code', render: (g) => <span className="font-mono text-xs font-semibold text-ink">{g.code}</span> },
    { key: 'value', header: 'Value / Use', sortable: true, value: (g) => g.wpValuePerUse, render: (g) => <span className="text-ink">{g.wpValuePerUse.toLocaleString()} WP</span> },
    { key: 'usage', header: 'Usage', render: (g) => <span className="text-body">{g.usedCount}/{g.maxUsages}</span> },
    { key: 'source', header: 'Funded By', render: (g) => <span className="text-body">{g.companyId ? 'Company wallet' : 'Vault'}</span> },
    { key: 'created', header: 'Created', sortable: true, value: (g) => g.createdAt, render: (g) => <span className="text-body">{formatDate(g.createdAt)}</span> },
    { key: 'status', header: 'Status', render: (g) => <Chip tone={statusTone(g.status)}>{g.status}</Chip> },
    {
      key: 'revoke', header: '',
      render: (g) =>
        g.status === 'active' ? (
          <button onClick={() => setRevokeCard(g)} title="Revoke and refund unused value" className="text-danger hover:opacity-70">
            <Ban size={15} />
          </button>
        ) : null,
    },
  ];

  const activeVaults = vaults.filter((v) => v.status === 'active');
  const defaultVault = activeVaults.find((v) => v.isDefault);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi
        icon={<Gift size={16} />}
        iconClass="bg-primary text-white"
        label="Active Vaults"
        value={String(activeVaults.length).padStart(2, '0')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock
          label="Default Vault Remaining"
          value={defaultVault ? `${(defaultVault.totalPoints - defaultVault.usedPoints).toLocaleString()} WP` : '—'}
          hint={defaultVault ? defaultVault.name : 'No default vault — top-ups will fail'}
        />
        <StatBlock
          label="Gift Cards"
          value={String(giftCards.filter((g) => g.status === 'active').length).padStart(2, '0')}
          hint={`${giftCards.length} total`}
        />
      </div>

      <HeroTabs tabs={TABS} active={tab} onChange={setTab} />

      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>
      ) : (
        <>
          {tab === 'Washpoint Vaults' && (
            <DataTable
              columns={vaultCols}
              rows={vaults}
              searchPlaceholder="Search vaults"
              pageSize={10}
              emptyText="No vaults yet — create one so top-ups and gift cards have WP to draw from."
              headerExtra={
                <button
                  onClick={() => { setFormError(''); setAddVaultOpen(true); }}
                  className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
                >
                  <Plus size={14} /> Add Vault
                </button>
              }
            />
          )}

          {tab === 'Gift Cards' && (
            <DataTable
              columns={giftCols}
              rows={giftCards}
              searchPlaceholder="Search by code"
              pageSize={10}
              emptyText="No gift cards yet."
              headerExtra={
                <button
                  onClick={() => { setFormError(''); setAddGiftOpen(true); }}
                  className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
                >
                  <Plus size={14} /> Create Gift Card
                </button>
              }
            />
          )}

          {tab === 'Coupons' && (
            <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-16 text-center">
              <p className="font-semibold text-ink">Coupons aren&apos;t built yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-faint">
                The coupon engine is planned for the promotions phase. Gift cards cover one-off WP grants in the meantime.
              </p>
            </div>
          )}
        </>
      )}

      {/* Vault detail drawer */}
      <Drawer
        open={!!vault}
        onClose={() => setVault(null)}
        title={vault?.name ?? 'Vault'}
        footer={
          vault && (
            <>
              <Button variant="outline" onClick={() => setVault(null)}>Close</Button>
              {vault.status === 'active' && !vault.isDefault && (
                <Button variant="soft" loading={busy} onClick={() => vaultAction(vault.id, 'set-default')}>
                  <Star size={14} /> Set as default
                </Button>
              )}
              {vault.status === 'active' && (
                <Button variant="danger" loading={busy} onClick={() => vaultAction(vault.id, 'deactivate')}>
                  <Power size={14} /> Deactivate
                </Button>
              )}
            </>
          )
        }
      >
        {vault && (
          <div className="space-y-1 divide-y divide-line [&>div]:py-2.5">
            <DrawerRow label="Status"><Chip tone={statusTone(vault.status)}>{vault.status}</Chip></DrawerRow>
            <DrawerRow label="Default">{vault.isDefault ? 'Yes — funds top-ups & gift cards' : 'No'}</DrawerRow>
            <DrawerRow label="Purpose">{vault.purpose}</DrawerRow>
            <DrawerRow label="Total Points">{vault.totalPoints.toLocaleString()} WP</DrawerRow>
            <DrawerRow label="Used">{vault.usedPoints.toLocaleString()} WP</DrawerRow>
            <DrawerRow label="Available">{(vault.totalPoints - vault.usedPoints).toLocaleString()} WP</DrawerRow>
            <DrawerRow label="Locked Rate">{vaultRate(vault)}</DrawerRow>
            <DrawerRow label="Created">{formatDate(vault.createdAt)}</DrawerRow>
            {vault.notes && <DrawerRow label="Notes">{vault.notes}</DrawerRow>}
            <div>
              <div className="mt-2 h-2 w-full rounded-full bg-section">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${Math.min(100, (vault.usedPoints / Math.max(1, vault.totalPoints)) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-right text-xs text-faint">
                {vault.usedPoints.toLocaleString()}/{vault.totalPoints.toLocaleString()} used
              </p>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add Vault */}
      <Modal open={addVaultOpen} onClose={() => setAddVaultOpen(false)} title="Add Vault">
        <form className="space-y-4" onSubmit={createVault}>
          <Input
            label="Vault Name" required placeholder="e.g. Q3 2026 Vault"
            value={vaultForm.name} onChange={(e) => setVaultForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Total Points (WP)" required type="number" min={1} placeholder="50000"
            value={vaultForm.totalPoints} onChange={(e) => setVaultForm((f) => ({ ...f, totalPoints: e.target.value }))}
          />
          <SelectField
            label="Purpose" value={vaultForm.purpose}
            onChange={(e) => setVaultForm((f) => ({ ...f, purpose: e.target.value }))}
          >
            <option value="general">General</option>
            <option value="gift_cards">Gift cards</option>
            <option value="coupons">Coupons</option>
            <option value="custom">Custom</option>
          </SelectField>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={vaultForm.isDefault}
              onChange={(e) => setVaultForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Make this the default vault (funds top-ups &amp; gift cards)
          </label>
          <Textarea
            label="Notes" placeholder="What is this vault for?"
            value={vaultForm.notes} onChange={(e) => setVaultForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <p className="text-xs text-faint">
            The vault locks the current WP/₦ conversion rate at creation — top-ups drawing from it always mint at that rate.
          </p>
          {formError && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{formError}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddVaultOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={busy}>Add Vault</Button>
          </div>
        </form>
      </Modal>

      {/* Create Gift Card */}
      <Modal open={addGiftOpen} onClose={() => setAddGiftOpen(false)} title="Create Gift Card">
        <form className="space-y-4" onSubmit={createGiftCard}>
          <Input
            label="Value per redemption (WP)" required type="number" min={1} placeholder="1000"
            value={giftForm.wpValuePerUse} onChange={(e) => setGiftForm((f) => ({ ...f, wpValuePerUse: e.target.value }))}
          />
          <Input
            label="Max redemptions" required type="number" min={1} placeholder="10"
            value={giftForm.maxUsages} onChange={(e) => setGiftForm((f) => ({ ...f, maxUsages: e.target.value }))}
          />
          <Input
            label="Expiry date (optional)" type="date"
            value={giftForm.expiresAt} onChange={(e) => setGiftForm((f) => ({ ...f, expiresAt: e.target.value }))}
          />
          <p className="text-xs text-faint">
            The full value (per-use × max redemptions) is debited from the default vault immediately. Revoking later refunds the unused portion.
          </p>
          {formError && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{formError}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddGiftOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={busy}>Create Gift Card</Button>
          </div>
        </form>
      </Modal>

      {/* Revoke gift card confirm */}
      <Modal open={!!revokeCard} onClose={() => setRevokeCard(null)} title="Revoke this gift card?">
        <div className="space-y-4">
          <p className="text-sm text-body">
            <span className="font-mono font-semibold text-ink">{revokeCard?.code}</span> will stop working immediately.
            The unused value ({revokeCard ? ((revokeCard.maxUsages - revokeCard.usedCount) * revokeCard.wpValuePerUse).toLocaleString() : 0} WP)
            is refunded to its source {revokeCard?.companyId ? 'company wallet' : 'vault'}.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setRevokeCard(null)}>Keep card</Button>
            <Button variant="danger" className="flex-1" loading={busy} onClick={revokeGiftCard}>Revoke &amp; refund</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
