'use client';

import { Mail } from 'lucide-react';
import { SettingsSubPage } from '@/components/ui/SettingsShell';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, SelectField } from '@/components/ui/Input';

export default function ProfileSettingsPage() {
  return (
    <SettingsSubPage title="Company Information" description="Update your organisation's details and branding">
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <Input label="Company Name" required placeholder="Enter company name" defaultValue="Washermann NG" />
        <SelectField label="Industry" required defaultValue="Laundry & Cleaning">
          <option>Laundry & Cleaning</option>
          <option>Logistics</option>
          <option>Hospitality</option>
        </SelectField>
        <Input label="Number of Staff" required type="number" placeholder="Enter number of staff" defaultValue={50} />
        <Input label="Website" placeholder="https://yourcompany.com" defaultValue="https://washermann.com" />
        <Input label="Email" required type="email" placeholder="you@company.com" leftIcon={<Mail size={15} />} defaultValue="ops@washermann.com" />
        <Input label="Phone number" required placeholder="+234 (555) 000-0000" />
        <Input label="Address" required placeholder="Enter company address" />
        <Textarea label="Bio" placeholder="Tell us a bit about your company" />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline">Cancel</Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </SettingsSubPage>
  );
}
