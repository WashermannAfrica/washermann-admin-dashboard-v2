'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { AuthBody, AuthHeading, AuthProgress } from '@/components/ui/AuthShell';

export default function VerifyPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(i: number, v: string) {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push('/reset-password');
  }

  return (
    <>
      <AuthProgress step={2} />
      <AuthBody>
        <AuthHeading
          line1="Verify"
          line2="Your Account"
          subtitle={<>We&apos;ve sent a 6-digit code to your email.<br />Enter it below to continue.</>}
        />
        <form onSubmit={handleSubmit} className="mt-12">
          <div className="flex items-center justify-center gap-2.5">
            {digits.map((d, i) => (
              <span key={i} className="flex items-center gap-2.5">
                <input
                  ref={(el) => { refs.current[i] = el; }}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  inputMode="numeric"
                  placeholder="0"
                  className="h-16 w-14 rounded-2xl bg-section text-center text-3xl font-medium text-ink placeholder:text-[#D7D7D7] focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {i === 2 && <span className="text-2xl text-faint">–</span>}
              </span>
            ))}
          </div>
          <p className="mt-5 text-center text-sm text-ink">
            Didn&apos;t receive code?{' '}
            <span className="cursor-pointer font-semibold underline underline-offset-2">Send again</span>
          </p>
          <Button type="submit" size="lg" className="mt-12 w-full">
            Verify
          </Button>
        </form>
      </AuthBody>
    </>
  );
}
