'use client';

import { useState } from 'react';
import { SettingsSubPage } from '@/components/ui/SettingsShell';
import { cn } from '@/lib/utils';

function Toggle({ label, hint, defaultOn = true }: { label: string; hint: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-xs text-faint">{hint}</p>
      </div>
      <button
        type="button"
        onClick={() => setOn((o) => !o)}
        className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', on ? 'bg-primary' : 'bg-line')}
      >
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
      </button>
    </div>
  );
}

export default function NotificationsSettingsPage() {
  return (
    <SettingsSubPage title="Notifications" description="Choose what you want to be notified about">
      <div className="divide-y divide-line">
        <Toggle label="New orders" hint="Get notified when a new order is placed" />
        <Toggle label="Disputes" hint="Alerts for new and escalated disputes" />
        <Toggle label="Payout events" hint="Vendor disbursements and failures" />
        <Toggle label="KYC submissions" hint="When a washerman submits documents for review" />
        <Toggle label="Weekly summary" hint="A digest of platform performance every Monday" defaultOn={false} />
        <Toggle label="Product updates" hint="News about new features and changes" defaultOn={false} />
      </div>
    </SettingsSubPage>
  );
}
