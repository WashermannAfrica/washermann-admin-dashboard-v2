'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AuthBody, AuthHeading } from '@/components/ui/AuthShell';
import type { LoginResponse } from '@/types';

const ADMIN_ROLES = ['admin', 'finance', 'dispute_resolver'];
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

// Demo login — lets you explore the UI without the backend running. Available
// ONLY on a developer's own machine (never on any deployed environment), and the
// demo email is deliberately a non-real address so it can never shadow a real
// admin account (which would plant fake tokens and cause a login → 401 → logout
// loop). It stores placeholder tokens the real API will reject by design.
const DEMO_LOGIN_ENABLED = process.env.NEXT_PUBLIC_APP_ENV === 'local';
const DEMO_EMAIL = 'demo@washermann.local';
const DEMO_PASSWORD = 'demo';

// Wrap in Suspense because useSearchParams() requires it in Next.js 16
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      const next = searchParams.get('next') ?? '/';
      router.replace(next);
    }
  }, [isAuthenticated, router, searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Demo login bypass — local dev only, never on a deployed environment.
    if (DEMO_LOGIN_ENABLED && email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const demoUser = {
        id: 'demo-admin',
        fullName: 'Adaeze Okafor',
        email: DEMO_EMAIL,
        roles: ['admin'],
        status: 'active',
      };
      login(demoUser, 'demo-access-token', 'demo-refresh-token');
      document.cookie = 'wm-admin-token=demo-access-token; path=/; SameSite=Lax';
      router.replace(searchParams.get('next') ?? '/');
      return;
    }

    try {
      const { data } = await axios.post<LoginResponse>(`${BASE_URL}/auth/login`, {
        identifier: email.trim(),
        password,
      });
      const { user, accessToken, refreshToken } = data.data;

      if (!user.roles?.some((r: string) => ADMIN_ROLES.includes(r))) {
        setError('This account does not have admin access.');
        return;
      }

      login(user, accessToken, refreshToken);
      document.cookie = `wm-admin-token=${accessToken}; path=/; SameSite=Lax`;
      router.replace(searchParams.get('next') ?? '/');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError((err.response.data as { message?: string })?.message ?? 'Invalid email or password.');
      } else {
        setError('Could not reach the server. Is the API running?');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthBody>
      <AuthHeading
        line1="Welcome to"
        line2="Washermann Admin"
        subtitle="Your control center for operations and payments"
      />

      {searchParams.get('reason') === 'idle' && (
        <p className="mt-6 rounded-xl bg-warn-bg px-4 py-2.5 text-sm text-warn">
          You were signed out after a period of inactivity. Please log in again.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-12 space-y-5">
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
          label="Password"
          required
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          rightIcon={
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-faint hover:text-body">
              {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          }
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-line accent-[#13C490]"
            />
            Remember for 30 days
          </label>
          <Link href="/forgot-password" className="text-sm font-semibold text-ink underline underline-offset-2">
            Forgot password?
          </Link>
        </div>

        {error && <p className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</p>}

        <Button type="submit" size="lg" loading={loading} className="mt-6 w-full">
          Login
        </Button>

        {DEMO_LOGIN_ENABLED && (
          <button
            type="button"
            onClick={() => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); }}
            className="w-full rounded-xl bg-mint-soft px-4 py-3 text-center text-[13px] text-forest transition-colors hover:bg-[#d2f2e4]"
          >
            <span className="font-semibold">Demo access</span> — tap to fill: {DEMO_EMAIL} / {DEMO_PASSWORD}
          </button>
        )}
      </form>

      <p className="mt-8 text-center text-sm text-ink">
        Don&apos;t have an account?{' '}
        <Link href="/create-account" className="font-semibold underline underline-offset-2">Create Account</Link>
      </p>
    </AuthBody>
  );
}
