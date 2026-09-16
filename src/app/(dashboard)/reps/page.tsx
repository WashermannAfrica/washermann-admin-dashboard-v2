'use client';

import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { PageKpi } from '@/components/ui/PageKpi';
import { Tabs } from '@/components/ui/Tabs';
import { WashRepsTab } from '@/components/reps/WashRepsTab';
import { SalesRepsTab } from '@/components/referrals/SalesRepsTab';

const TABS = ['Wash Reps', 'Sales Reps'];

export default function RepsPage() {
  const [tab, setTab] = useState('Wash Reps');

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi
        icon={<UserRound size={16} />}
        iconClass="bg-primary text-white"
        label="Reps"
        value="Wash & Sales"
      />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'Wash Reps' && <WashRepsTab />}
      {tab === 'Sales Reps' && <SalesRepsTab />}
    </div>
  );
}
