'use client';

import { useState } from 'react';
import { Gift } from 'lucide-react';
import { Tabs } from '@/components/ui/Tabs';
import { OverviewTab } from '@/components/referrals/OverviewTab';
import { ApplicationsTab } from '@/components/referrals/ApplicationsTab';
import { SalesRepsTab } from '@/components/referrals/SalesRepsTab';
import { PayoutsTab } from '@/components/referrals/PayoutsTab';
import { ReferralsTab } from '@/components/referrals/ReferralsTab';
import { RewardRulesTab } from '@/components/referrals/RewardRulesTab';

const TABS = ['Overview', 'Applications', 'Sales Reps', 'Payouts', 'Referrals', 'Reward Rules'];

export default function ReferralsPage() {
  const [tab, setTab] = useState('Overview');

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet text-white">
          <Gift size={18} />
        </span>
        <div>
          <h1 className="text-lg font-bold text-ink">Referrals &amp; Sales Reps</h1>
          <p className="text-sm text-body">Acquisition program — applications, reps, payouts and reward config.</p>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'Overview' && <OverviewTab />}
      {tab === 'Applications' && <ApplicationsTab />}
      {tab === 'Sales Reps' && <SalesRepsTab />}
      {tab === 'Payouts' && <PayoutsTab />}
      {tab === 'Referrals' && <ReferralsTab />}
      {tab === 'Reward Rules' && <RewardRulesTab />}
    </div>
  );
}
