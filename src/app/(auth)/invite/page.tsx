'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AuthBody, AuthHeading } from '@/components/ui/AuthShell';
import type { LoginResponse } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

// Wrap in Suspense because useSearchParams() requires it in Next.js 16
export default function InvitePage() {
  return (
    <Suspense>
      <InviteForm />
    </Suspense>
  );
}

function InviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { login } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post<LoginResponse>(`${BASE_URL}/auth/set-password`, {
        inviteToken: token,
        password,
      });
      const { user, accessToken, refreshToken } = data.data;
      // The route guard (proxy) checks this cookie. Set it first, then hard-navigate
      // so the proxy sees it on the first request (a soft nav bounces to /login).
      document.cookie = `wm-admin-token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      login(user, accessToken, refreshToken);
      window.location.assign('/');
    } catch (err) {
      const e2 = err as AxiosError<{ message?: string | string[] }>;
      const m = e2.response?.data?.message;
      setError(Array.isArray(m) ? m.join(', ') : m ?? 'This invite link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthBody>
        <AuthHeading
          line1="Invalid invite"
          subtitle="This link is missing its token. Please use the button in your invite email."
        />
      </AuthBody>
    );
  }

  return (
    <AuthBody>
      <AuthHeading
        line1="Set your password"
        line2="Welcome to the team"
        subtitle="Create a password to activate your Washermann staff account."
      />

      <form onSubmit={handleSubmit} className="mt-12 space-y-5">
        <Input
          label="Password"
          required
          type={showPassword ? 'text' : 'password'}
          placeholder="At least 8 characters"
          leftIcon={<Lock size={16} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          rightIcon={
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-faint hover:text-body">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <Input
          label="Confirm password"
          required
          type={showPassword ? 'text' : 'password'}
          placeholder="Re-enter your password"
          leftIcon={<Lock size={16} />}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Activate account
        </Button>
      </form>
    </AuthBody>
  );
}
