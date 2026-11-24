'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Truck } from 'lucide-react';
import { PageKpi } from '@/components/ui/PageKpi';
import { PLAYGROUND_HTML_B64 } from './playground.data';

/**
 * Transport Fare Playground — a self-contained HTML tool bundled as base64 and
 * rendered in a sandboxed iframe. It lives under the (dashboard) layout, so it
 * inherits the admin login (a /public file could not be gated client-side).
 * The tool is pure client-side maths — it makes no API calls.
 */
export default function TransportPlaygroundPage() {
  // Decode once on the client (atob + UTF-8) — avoids SSR/window issues.
  const [html, setHtml] = useState('');
  useEffect(() => {
    try {
      const bytes = Uint8Array.from(atob(PLAYGROUND_HTML_B64), (c) => c.charCodeAt(0));
      setHtml(new TextDecoder().decode(bytes));
    } catch {
      setHtml('');
    }
  }, []);

  const frameKey = useMemo(() => (html ? 'ready' : 'empty'), [html]);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <PageKpi
          icon={<Truck size={16} />}
          iconClass="bg-forest text-white"
          label="Transport pricing"
          value="Fare playground"
        />
        <Link
          href="/transport"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-section"
        >
          <ArrowLeft size={15} /> Transport settings
        </Link>
      </div>

      <p className="max-w-2xl text-sm text-faint">
        Mirrors the live transport engine — same formula, great-circle (haversine) distance,
        round-trip doubling and ₦→WashPoints conversion. Use the{' '}
        <span className="font-medium text-ink">Simulate order</span> tab to model a pickup plus
        its area vendors and see what the customer pays versus what the assigned rep is credited.
      </p>

      <iframe
        key={frameKey}
        title="Transport Fare Playground"
        srcDoc={html}
        sandbox="allow-scripts"
        className="w-full rounded-2xl border border-line bg-white shadow-sm"
        style={{ height: 'calc(100vh - 11rem)', minHeight: 720 }}
      />
    </div>
  );
}
