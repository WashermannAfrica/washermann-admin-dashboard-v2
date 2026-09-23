'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Calculator, X, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';

type Mode = 'spend' | 'payout';

// localStorage keys — survive full reloads (state alone survives navigation,
// because this lives in the persistent dashboard layout).
const LS_OPEN = 'wm_conv_open';
const LS_MODE = 'wm_conv_mode';
const LS_WP = 'wm_conv_wp';

const readLS = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const writeLS = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

// Pretty, comma-grouped — for read-only captions only (never for <input type=number>).
const fmt = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '';

// Plain numeric string (no thousands separators) — safe as an <input type=number> value.
const num2 = (n: number) =>
  Number.isFinite(n) ? String(Math.round(n * 100) / 100) : '';

export function RateConverter() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('spend');
  const [wp, setWp] = useState('');
  const [ngn, setNgn] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ₦ value of 1 WP, per mode
  const [spendNairaPerWp, setSpendNairaPerWp] = useState<number | null>(null);
  const [payoutNairaPerWp, setPayoutNairaPerWp] = useState<number | null>(null);

  const hydrated = useRef(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<{ data: Array<{ currency: string; pointsPerUnit: number }> }>('/conversion-rates/active'),
      api.get<{ data: { payoutRateNairaPerWP: number } }>('/platform-config'),
    ])
      .then(([rates, cfg]) => {
        const list = Array.isArray(rates.data.data) ? rates.data.data : [];
        const ngnRate = list.find((r) => r.currency === 'NGN') ?? list[0];
        // pointsPerUnit = WP per ₦1  →  ₦ per WP = 1 / pointsPerUnit
        setSpendNairaPerWp(ngnRate && ngnRate.pointsPerUnit > 0 ? 1 / ngnRate.pointsPerUnit : null);
        const payout = Number(cfg.data.data?.payoutRateNairaPerWP ?? 0);
        setPayoutNairaPerWp(payout > 0 ? payout : null);
      })
      .catch((e) => setError(apiErr(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // Restore persisted UI state once.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (readLS(LS_OPEN) === '1') setOpen(true);
    const m = readLS(LS_MODE);
    if (m === 'spend' || m === 'payout') setMode(m);
    const savedWp = readLS(LS_WP);
    if (savedWp) setWp(savedWp);
  }, []);

  const nairaPerWp = mode === 'spend' ? spendNairaPerWp : payoutNairaPerWp;

  // Recompute ₦ from the current WP only when the rate/mode changes — NOT on every
  // WP keystroke, so editing the ₦ field is never overwritten mid-type.
  useEffect(() => {
    if (nairaPerWp == null) return;
    const w = parseFloat(wp);
    setNgn(wp === '' || !Number.isFinite(w) ? '' : num2(w * nairaPerWp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nairaPerWp]);

  function onWp(v: string) {
    setWp(v);
    writeLS(LS_WP, v);
    if (nairaPerWp == null) return;
    const w = parseFloat(v);
    setNgn(v === '' || !Number.isFinite(w) ? '' : num2(w * nairaPerWp));
  }
  function onNgn(v: string) {
    setNgn(v);
    if (nairaPerWp == null || nairaPerWp <= 0) return;
    const n = parseFloat(v);
    if (v === '' || !Number.isFinite(n)) {
      setWp('');
      writeLS(LS_WP, '');
      return;
    }
    const w = num2(n / nairaPerWp);
    setWp(w);
    writeLS(LS_WP, w);
  }
  function toggleOpen() {
    setOpen((o) => { writeLS(LS_OPEN, o ? '0' : '1'); return !o; });
  }
  function switchMode(m: Mode) {
    setMode(m);
    writeLS(LS_MODE, m);
  }

  return (
    <>
      {/* Floating button — every dashboard page */}
      <button
        onClick={toggleOpen}
        aria-label="WashPoints converter"
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X size={20} /> : <Calculator size={20} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-80 rounded-2xl border border-line bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">WP ⇄ Naira converter</h3>
            <button onClick={load} aria-label="Refresh rate" className="flex h-7 w-7 items-center justify-center rounded-full text-faint hover:bg-section">
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Mode toggle */}
          <div className="mb-3 flex rounded-full bg-section p-0.5 text-xs">
            {(['spend', 'payout'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 rounded-full px-3 py-1.5 font-medium capitalize transition-colors ${mode === m ? 'bg-white text-ink shadow-sm' : 'text-body'}`}
              >
                {m === 'spend' ? 'Spend value' : 'Payout value'}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="py-6 text-center text-sm text-faint">Loading rate…</p>
          ) : error ? (
            <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
          ) : nairaPerWp == null ? (
            <p className="rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">No {mode} rate configured.</p>
          ) : (
            <>
              <label className="mb-1 block text-xs font-medium text-faint">WashPoints (WP)</label>
              <input
                type="number" inputMode="decimal" value={wp} onChange={(e) => onWp(e.target.value)} placeholder="0"
                className="mb-3 w-full rounded-xl border border-line px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
              <div className="mb-2 flex justify-center text-faint"><ArrowRightLeft size={14} /></div>
              <label className="mb-1 block text-xs font-medium text-faint">Naira (₦)</label>
              <input
                type="number" inputMode="decimal" value={ngn} onChange={(e) => onNgn(e.target.value)} placeholder="0"
                className="w-full rounded-xl border border-line px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
              <p className="mt-3 text-center text-[11px] text-faint">
                1 WP = ₦{fmt(nairaPerWp)} · {mode === 'spend' ? 'customer conversion rate' : 'vendor payout rate'}
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
