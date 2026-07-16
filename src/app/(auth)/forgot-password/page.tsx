'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AuthBody, AuthHeading, AuthProgress } from '@/components/ui/AuthShell';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Mock flow — the real reset email endpoint can be wired here.
    setTimeout(() => router.push('/verify'), 500);
  }

  return (
    <>
      <AuthProgress step={1} />
      <AuthBody>
        <AuthHeading
          line1="Forgot Password?"
          subtitle={<>Enter the email linked to your account and we&apos;ll send you a reset link.</>}
        />
        <form onSubmit={handleSubmit} className="mt-12 space-y-5">
          <Input
            label="Email"
            required
            type="email"
            placeholder="you@company.com"
            leftIcon={<Mail size={16} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" size="lg" loading={loading} className="mt-4 w-full">
            Send Reset Link
          </Button>
        </form>
        <p className="mt-8 text-center text-sm text-ink">
          Remember Password?{' '}
          <Link href="/login" className="font-semibold underline underline-offset-2">Back to Login</Link>
        </p>
      </AuthBody>
    </>
  );
}
