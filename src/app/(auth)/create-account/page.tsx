'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AuthBody, AuthHeading, AuthProgress } from '@/components/ui/AuthShell';

export default function CreateAccountPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    if (!agree) return setError('Please accept the terms to continue.');
    setLoading(true);
    // Mock flow — the real registration endpoint can be wired here, then the
    // user is taken to the shared email-verification step.
    setTimeout(() => router.push('/verify'), 500);
  }

  const eye = (
    <button type="button" onClick={() => setShow((s) => !s)} className="text-faint hover:text-body">
      {show ? <Eye size={16} /> : <EyeOff size={16} />}
    </button>
  );

  return (
    <>
      <AuthProgress step={1} />
      <AuthBody>
        <AuthHeading
          line1="Create your"
          line2="Washermann Admin"
          subtitle="Set up your account to manage operations and payments"
        />

        <form onSubmit={handleSubmit} className="mt-12 space-y-5">
          <Input
            label="Full Name"
            required
            placeholder="e.g, Adaeze Okafor"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
          <Input
            label="Email"
            required
            type="email"
            placeholder="you@company.com"
            leftIcon={<Mail size={16} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            label="Phone number"
            required
            placeholder="+234 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
          <Input
            label="Password"
            required
            type={show ? 'text' : 'password'}
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            rightIcon={eye}
          />
          <Input
            label="Confirm Password"
            required
            type={show ? 'text' : 'password'}
            placeholder="Re-enter password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            rightIcon={eye}
          />

          <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-sm text-ink">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line accent-[#13C490]"
            />
            <span>
              I agree to the <span className="font-semibold underline underline-offset-2">Terms of Service</span> and{' '}
              <span className="font-semibold underline underline-offset-2">Privacy Policy</span>.
            </span>
          </label>

          {error && <p className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</p>}

          <Button type="submit" size="lg" loading={loading} className="mt-4 w-full">
            Create Account
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-ink">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold underline underline-offset-2">Login</Link>
        </p>
      </AuthBody>
    </>
  );
}
