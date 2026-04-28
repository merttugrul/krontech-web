'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/admin/auth-api';
import { getApiErrorMessage } from '@/lib/api';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      const target = isSafeRelativeNext(next) ? next : '/admin';
      router.replace(target as never);
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'E-posta veya şifre hatalı.'));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-kron-dark">
          E-posta
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          disabled={loading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-kron-light bg-white px-3.5 py-2.5 text-sm text-kron-dark outline-none transition focus:border-kron-blue focus:ring-2 focus:ring-kron-blue/20 disabled:bg-kron-light/40"
          placeholder="admin@krontech.com"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-kron-dark">
          Şifre
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={loading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-kron-light bg-white px-3.5 py-2.5 text-sm text-kron-dark outline-none transition focus:border-kron-blue focus:ring-2 focus:ring-kron-blue/20 disabled:bg-kron-light/40"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
      </button>
    </form>
  );
}

function isSafeRelativeNext(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\');
}
