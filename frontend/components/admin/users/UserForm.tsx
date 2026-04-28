'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser, updateUser, type CreateUserPayload } from '@/lib/admin/api-users';
import type { AdminUserAccount } from '@/lib/admin/types';
import type { AdminRole } from '@/lib/admin/auth-types';
import { getCachedUser } from '@/lib/admin/session';
import { getApiErrorMessage } from '@/lib/api';
import { FormCard, FormGrid } from '@/components/admin/FormCard';
import { AdminCheckbox, AdminInput, AdminSelect } from '@/components/admin/FormField';

interface UserFormProps {
  mode: 'create' | 'edit';
  initial?: AdminUserAccount;
}

export function UserForm({ mode, initial }: UserFormProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const me = getCachedUser();

  const [email, setEmail] = useState(initial?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>(initial?.role ?? 'editor');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      if (mode === 'create' || !initial) {
        const payload: CreateUserPayload = {
          email: email.trim(),
          password,
          role,
        };
        return createUser(payload);
      }
      return updateUser(initial.id, {
        email: email.trim(),
        ...(password.length >= 8 ? { password } : {}),
        role,
        isActive,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      router.push('/admin/users' as never);
    },
    onError: (err) => {
      setSubmitError(getApiErrorMessage(err, 'Kaydetme başarısız.'));
    },
  });

  if (me?.role !== 'admin') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Bu sayfaya erişim yok.
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = 'Gerekli';
    if (mode === 'create' && password.length < 8) {
      next.password = 'En az 8 karakter';
    }
    if (mode === 'edit' && password && password.length < 8) {
      next.password = 'En az 8 karakter veya boş bırakın';
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-kron-navy">
            {mode === 'create' ? 'Yeni kullanıcı' : 'Kullanıcı düzenle'}
          </h1>
          {initial && <p className="mt-1 text-sm text-kron-gray">{initial.email}</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => router.back()} className="btn-ghost text-sm">
            Geri
          </button>
          <button type="submit" disabled={save.isPending} className="btn-primary text-sm">
            {save.isPending ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </header>

      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <FormCard title="Hesap">
        <FormGrid>
          <AdminInput
            label="E-posta"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <AdminSelect
            label="Rol"
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
          >
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </AdminSelect>
        </FormGrid>
        <div className="mt-4">
          <AdminInput
            label={mode === 'create' ? 'Şifre' : 'Yeni şifre (opsiyonel)'}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={mode === 'edit' ? 'Değiştirmek istemiyorsanız boş bırakın.' : undefined}
            error={errors.password}
            required={mode === 'create'}
          />
        </div>
        {mode === 'edit' && (
          <div className="mt-4">
            <AdminCheckbox
              label="Hesap aktif"
              hint="Pasif kullanıcılar giriş yapamaz."
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </div>
        )}
      </FormCard>
    </form>
  );
}
