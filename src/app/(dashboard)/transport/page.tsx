'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Truck, Calculator } from 'lucide-react';
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
};

const FIELDS: { key: keyof TransportConfig; label: string; hint: string }[] = [
  { key: 'transportBaseFareNgn', label: 'Base fare (₦)', hint: 'Fixed amount added to every trip' },
  { key: 'transportPerKmNgn', label: 'Per-km (₦)', hint: 'Applied to the round-trip distance (customer ⇄ vendor, ×2)' },
  { key: 'transportMinNgn', label: 'Minimum (₦)', hint: 'Floor for the transport fee' },
  { key: 'transportMaxNgn', label: 'Maximum (₦)', hint: '0 = no cap' },
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
          {FIELDS.map((f) => (
            <div key={f.key}>
              <Input label={f.label} type="number" min={0} step="0.01" value={String(form[f.key])} onChange={num(f.key)} />
              <p className="mt-1 text-xs text-faint">{f.hint}</p>
            </div>
          ))}

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

        {error && <p className="mt-4 rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}
        {saved && <p className="mt-4 rounded-xl bg-success-bg px-4 py-2 text-sm text-success">Saved.</p>}

        <div className="mt-5 flex justify-end">
          <Button onClick={save} loading={saving}>Save changes</Button>
        </div>
      </Section>
    </div>
  );
}
