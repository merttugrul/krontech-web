'use client';

import { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';

interface JsonBlockEditorProps {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  hint?: string;
  rows?: number;
  placeholder?: string;
  /** Başlangıçta boşsa bu placeholder JSON'u değeri olarak kabul eder. */
  emptyAs?: 'null' | 'empty-object';
}

/**
 * JSON blok editörü — Product JSON alanları (solution, howItWorks, vb.) için.
 * Admin schema'ları frontend'in Zod parser'larıyla aynı (ADIM 14'te
 * `product-detail.ts` şeması).
 *
 * Kullanıcı deneyimi:
 *  - Yazarken canlı validate etmiyoruz (imlecin attığı gibi hata göstermek
 *    can sıkıcı olur). Blur'da ve submit öncesinde parse ediliyor.
 *  - Hatalı JSON → alan kırmızı border + alt satırda hata mesajı.
 *  - `{}` / `[]` default olarak kabul edilir; boş string → `emptyAs` ile
 *    null ya da {} dönüşür.
 */
export function JsonBlockEditor({
  label,
  value,
  onChange,
  hint,
  rows = 10,
  placeholder,
  emptyAs = 'null',
}: JsonBlockEditorProps) {
  const [raw, setRaw] = useState(() => stringify(value));
  const [error, setError] = useState<string | null>(null);
  const fieldId = useId();

  // Dışarıdan prop değişirse (örn. form reset) editörü yenile — ama kullanıcı
  // yazıyorsa çakışmasın diye sadece mount + external güncellemelerde.
  useEffect(() => {
    setRaw(stringify(value));
  }, [value]);

  const handleBlur = () => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setError(null);
      onChange(emptyAs === 'null' ? null : {});
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      setError(null);
      onChange(parsed);
    } catch (err) {
      setError(
        err instanceof Error ? `Geçersiz JSON: ${err.message}` : 'Geçersiz JSON',
      );
    }
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-kron-dark">
        {label}
      </label>
      <textarea
        id={fieldId}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={handleBlur}
        rows={rows}
        spellCheck={false}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg border bg-slate-50 p-3 font-mono text-xs leading-relaxed text-kron-dark outline-none transition focus:bg-white focus:ring-2',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
            : 'border-kron-light focus:border-kron-blue focus:ring-kron-blue/20',
        )}
      />
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-kron-gray">{hint}</p>
      )}
    </div>
  );
}

function stringify(value: unknown): string {
  if (value === undefined || value === null) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}
