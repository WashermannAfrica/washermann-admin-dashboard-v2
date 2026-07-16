'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

/** Two-column settings sub-page wrapper: back arrow on top, section title +
    description on the left, controls on the right. Matches the settings
    sub-screens (Company Information / Security / Notifications / Danger Zone). */
export function SettingsSubPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-5xl">
      <button
        onClick={() => router.push('/settings')}
        className="mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-section text-ink hover:bg-line transition-colors"
      >
        <ArrowLeft size={17} />
      </button>
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <div>
          <h1 className="text-3xl font-bold text-ink">{title}</h1>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-body">{description}</p>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
