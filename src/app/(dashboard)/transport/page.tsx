'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Truck, Calculator, Route } from 'lucide-react';
import { PageKpi } from '@/components/ui/PageKpi';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Input, SelectField } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import type { ApiResponse } from '@/types';

type TransportConfig = {
  transportBaseFareNgn: number;
  transportPerKmNgn: number;
  transportMinNgn: number;
  transportMaxNgn: number;
  transportEstimateBasis: 'average' | 'p75';
  transportDistanceProvider: 'haversine' | 'google';
  // Logistics-leg fare (rep moves clothes A→B; used by every pickup/delivery/round-trip).
  logisticsBaseFareNgn: number;
  logisticsPerKmNgn: number;
  logisticsIncludedKm: number;
  logisticsMobilityFeeNgn: number;
  logisticsMobilityFeePercent: number;
};

type NumField = {
  key: keyof TransportConfig;
  label: string;
  hint: string;
  max?: number;
  step?: string;
};

const FIELDS: NumField[] = [
  { key: 'transportBaseFareNgn', label: 'Base fare (₦)', hint: 'Fixed amount added to every trip' },
  { key: 'transportPerKmNgn', label: 'Per-km (₦)', hint: 'Applied to the round-trip distance (customer ⇄ vendor, ×2)' },
  { key: 'transportMinNgn', label: 'Minimum (₦)', hint: 'Floor for the transport fee' },
  { key: 'transportMaxNgn', label: 'Maximum (₦)', hint: '0 = no cap' },
];

const LOGISTICS_FIELDS: NumField[] = [
  { key: 'logisticsBaseFareNgn', label: 'Flat leg fare (₦)', hint: 'Covers the first “included km” of a leg' },
  { key: 'logisticsPerKmNgn', label: 'Per extra km (₦)', hint: 'Charged per km beyond the included distance' },
  { key: 'logisticsIncludedKm', label: 'Included km', hint: 'Distance the flat leg fare covers before per-km applies', step: '0.1' },
  { key: 'logisticsMobilityFeeNgn', label: 'Mobility fee — flat (₦)', hint: 'Platform fee added to each leg (0 = none)' },
  { key: 'logisticsMobilityFeePercent', label: 'Mobility fee — % of transport', hint: 'Platform fee as a % of the leg transport cost', max: 100 },
];

export default function TransportSettingsPage() {
  const [form, setForm] = useState<TransportConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<ApiResponse<TransportConfig>>('/platform-config')
      .then((res) => {
        const c = res.data.data;
        setForm({
          transportBaseFareNgn: Number(c.transportBaseFareNgn ?? 0),
          transportPerKmNgn: Number(c.transportPerKmNgn ?? 0),
          transportMinNgn: Number(c.transportMinNgn ?? 0),
          transportMaxNgn: Number(c.transportMaxNgn ?? 0),
          transportEstimateBasis: c.transportEstimateBasis ?? 'average',
          transportDistanceProvider: c.transportDistanceProvider ?? 'haversine',
          logisticsBaseFareNgn: Number(c.logisticsBaseFareNgn ?? 0),
          logisticsPerKmNgn: Number(c.logisticsPerKmNgn ?? 0),
          logisticsIncludedKm: Number(c.logisticsIncludedKm ?? 0),
          logisticsMobilityFeeNgn: Number(c.logisticsMobilityFeeNgn ?? 0),
          logisticsMobilityFeePercent: Number(c.logisticsMobilityFeePercent ?? 0),
        });
      })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function save() {
    if (!form) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.patch('/platform-config', form);
      setSaved(true);
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-24 text-primary"><Spinner size="lg" /></div>;
  if (!form) return <p className="py-12 text-center text-sm text-danger">{error || 'Could not load config.'}</p>;

  const num = (k: keyof TransportConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => (f ? { ...f, [k]: e.target.value === '' ? 0 : Number(e.target.value) } : f));

  const numField = (f: NumField) => (
    <div key={f.key}>
      <Input label={f.label} type="number" min={0} max={f.max} step={f.step ?? '0.01'} value={String(form[f.key])} onChange={num(f.key)} />
      <p className="mt-1 text-xs text-faint">{f.hint}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <PageKpi icon={<Truck size={16} />} iconClass="bg-forest text-white" label="Transport pricing" value="Distance-based fee" className="flex-1" />
        <Link
          href="/transport/playground"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-section"
        >
          <Calculator size={15} /> Fare playground
        </Link>
      </div>

      <Section>
        <p className="pb-4 text-sm text-faint">
          Transport = <span className="font-mono">base + per-km × 2 × distance(customer ⇄ vendor)</span>, clamped to min/max — all in Naira (₦).
          The fare is converted to WashPoints at the live rate for the wallet. Customers are charged an estimate over the area’s located vendors; reps are paid the actual, capped at the estimate.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(numField)}

          <div>
            <SelectField label="Estimate basis" value={form.transportEstimateBasis} onChange={(e) => setForm((s) => (s ? { ...s, transportEstimateBasis: e.target.value as 'average' | 'p75' } : s))}>
              <option value="average">Average (break even in aggregate)</option>
              <option value="p75">75th percentile (rarely subsidise)</option>
            </SelectField>
            <p className="mt-1 text-xs text-faint">Statistic over the area’s vendor distances for the checkout estimate.</p>
          </div>

          <div>
            <SelectField label="Distance provider" value={form.transportDistanceProvider} onChange={(e) => setForm((s) => (s ? { ...s, transportDistanceProvider: e.target.value as 'haversine' | 'google' } : s))}>
              <option value="haversine">Haversine (straight-line, free)</option>
              <option value="google">Google (road distance)</option>
            </SelectField>
            <p className="mt-1 text-xs text-faint">Google needs GOOGLE_MAPS_API_KEY set; falls back to Haversine.</p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="flex items-center gap-2 pb-1">
          <Route size={16} className="text-forest" />
          <h2 className="text-sm font-semibold text-ink">Logistics legs</h2>
        </div>
        <p className="pb-4 text-sm text-faint">
          The per-leg fare a rep is paid to move clothes A→B — used by every vendor pickup, delivery and round-trip.
          Leg fare = <span className="font-mono">flat + per-km × max(0, distance − included km)</span>, then any mobility fee (flat + % of transport) is added, all in Naira (₦).
          Leave these above ₦0 or logistics bookings price to zero.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {LOGISTICS_FIELDS.map(numField)}
        </div>
      </Section>

      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}
      {saved && <p className="rounded-xl bg-success-bg px-4 py-2 text-sm text-success">Saved.</p>}

      <div className="flex justify-end">
        <Button onClick={save} loading={saving}>Save changes</Button>
      </div>
    </div>
  );
}
