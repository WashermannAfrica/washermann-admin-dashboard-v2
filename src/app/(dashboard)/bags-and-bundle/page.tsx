'use client';

import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { PageKpi } from '@/components/ui/PageKpi';
import { Tabs } from '@/components/ui/Tabs';
import { WashBagsTab } from '@/components/bags/WashBagsTab';
import { WashBundlesTab } from '@/components/bundles/WashBundlesTab';

const TABS = ['Wash Bags', 'Wash Bundles'];

export default function RepsPage() {
  const [tab, setTab] = useState('Wash Bags');

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi
        icon={<UserRound size={16} />}
        iconClass="bg-primary text-white"
        label="Reps"
        value="Bags & Bundles"
      />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'Wash Bags' && <WashBagsTab />}
      {tab === 'Wash Bundles' && <WashBundlesTab />}
    </div>
  );
}
