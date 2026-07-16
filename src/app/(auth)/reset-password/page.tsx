'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AuthBody, AuthHeading, AuthProgress } from '@/components/ui/AuthShell';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setError('Password must be at least 8 characters.');
    if (pw !== confirm) return setError('Passwords do not match.');
    router.push('/password-updated');
  }

  const eye = (
    <button type="button" onClick={() => setShow((s) => !s)} className="text-faint hover:text-body">
      {show ? <Eye size={16} /> : <EyeOff size={16} />}
    </button>
  );

  return (
    <>
      <AuthProgress step={3} />
      <AuthBody>
        <AuthHeading
          line1="Create New Password"
          subtitle="Set a strong password you haven't used before."
        />
        <form onSubmit={handleSubmit} className="mt-12 space-y-5">
          <Input
            label="New Password"
            required
            type={show ? 'text' : 'password'}
            placeholder="Enter new password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            rightIcon={eye}
          />
          <Input
            label="Confirm Password"
            required
            type={show ? 'text' : 'password'}
            placeholder="Re-enter new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            rightIcon={eye}
          />
          {error && <p className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</p>}
          <Button type="submit" size="lg" className="mt-4 w-full">
            Update Password
          </Button>
        </form>
      </AuthBody>
    </>
  );
}
