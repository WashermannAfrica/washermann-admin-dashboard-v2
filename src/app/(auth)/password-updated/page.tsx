'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AuthBody, AuthHeading } from '@/components/ui/AuthShell';

export default function PasswordUpdatedPage() {
  return (
    <AuthBody>
      <div className="flex flex-col items-center">
        <span className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-mint-soft text-primary">
          <Check size={30} strokeWidth={3} />
        </span>
        <AuthHeading
          line1="Password Updated"
          subtitle="Your password has been changed successfully. Use your new password to log in."
        />
        <Link href="/login" className="mt-12 w-full">
          <Button size="lg" className="w-full">Back to Login</Button>
        </Link>
      </div>
    </AuthBody>
  );
}
