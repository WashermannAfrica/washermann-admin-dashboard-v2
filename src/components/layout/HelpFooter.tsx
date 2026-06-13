import Image from 'next/image';

/* Brand glyphs (lucide v1 lacks them) */
const ICONS: Record<string, React.ReactNode> = {
  x: <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.59l-5.17-6.76L5.3 22H2.04l8.02-9.17L1 2h6.76l4.68 6.18zm-1.16 18h1.83L7.01 3.92H5.06z" />,
  instagram: <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.12 1.38C1.36 2.67.95 3.34.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.12.66.66 1.33 1.07 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.8 5.8 0 0 0 2.12-1.38 5.8 5.8 0 0 0 1.38-2.12c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.8 5.8 0 0 0-1.38-2.12A5.8 5.8 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0m0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84M12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4m6.41-10.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44" />,
  linkedin: <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14M7.12 20.45H3.56V9h3.56zM22.22 0H1.77C.8 0 0 .77 0 1.73v20.54C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0" />,
  whatsapp: <path d="M.06 24l1.68-6.13A11.86 11.86 0 0 1 .15 11.9C.15 5.33 5.5 0 12.07 0a11.82 11.82 0 0 1 8.41 3.49 11.82 11.82 0 0 1 3.48 8.42c0 6.57-5.35 11.91-11.92 11.91a11.9 11.9 0 0 1-5.7-1.45zm6.6-3.8c1.65.98 3.22 1.57 5.3 1.57 5.45 0 9.9-4.43 9.9-9.88a9.86 9.86 0 0 0-9.88-9.9c-5.46 0-9.9 4.44-9.9 9.89a9.82 9.82 0 0 0 1.5 5.25l-.99 3.62zm11.36-5.3c-.07-.12-.27-.2-.57-.35s-1.77-.87-2.04-.97-.47-.15-.67.15-.77.96-.94 1.16-.35.22-.64.07a8.13 8.13 0 0 1-2.4-1.48 9 9 0 0 1-1.66-2.06c-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52s-.67-1.6-.91-2.2c-.24-.57-.48-.5-.67-.5l-.57-.01a1.1 1.1 0 0 0-.79.37c-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06 2.1 3.2 5.08 4.49a17 17 0 0 0 1.7.63 4.08 4.08 0 0 0 1.87.12c.57-.09 1.77-.73 2.02-1.43.25-.7.25-1.3.17-1.43z" />,
};

/** Big green marketing footer from the help-center design:
    "Shall we connect on WhatsApp?" + QR, footer nav, giant wordmark, socials. */
export function HelpFooter() {
  return (
    <div className="mt-10 overflow-hidden rounded-3xl bg-forest px-8 py-10 text-white">
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div>
          <Image src="/wordmark-white.png" alt="Washermann" width={150} height={28} className="h-6 w-auto opacity-90" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
            The laundry benefit platform connecting employees to trusted service providers, with full company controls and financial transparency.
          </p>
        </div>
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <span className="rounded-2xl bg-white p-2">
            <Image src="/whatsapp-qr.png" alt="WhatsApp QR" width={96} height={96} className="h-24 w-24" />
          </span>
          <div>
            <h3 className="text-2xl font-bold">Shall we connect on WhatsApp?</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">
              Because we prefer genuine, quick, and straightforward exchanges. Scan the QR code, send your message, and we&apos;ll reply (very quickly).
            </p>
          </div>
        </div>
      </div>

      <div className="my-8 h-px bg-white/15" />

      <div className="flex flex-wrap gap-x-10 gap-y-3 text-sm text-white/80">
        {['Companies', 'Vendors', 'Pricing', "FAQ's", 'Contact Us'].map((l) => (
          <span key={l} className="cursor-pointer hover:text-white">{l}</span>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <Image src="/wordmark-white.png" alt="Washermann" width={520} height={96} className="h-16 w-auto opacity-90 sm:h-24" />
        <div className="flex items-center gap-4">
          {(['x', 'instagram', 'linkedin', 'whatsapp'] as const).map((k) => (
            <span key={k} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">{ICONS[k]}</svg>
            </span>
          ))}
        </div>
      </div>
      <p className="mt-6 text-xs text-white/50">© Washermann 2026</p>
    </div>
  );
}
