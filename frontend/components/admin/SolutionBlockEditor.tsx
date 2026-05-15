'use client';

import { useId, useState } from 'react';
import { AdminInput, AdminTextarea } from '@/components/admin/FormField';
import { parseSolution } from '@/lib/schemas/product-detail';

interface SolutionBlockEditorProps {
  /** Tab / ürün değişince remount için `key` kullanın (örn. locale). */
  value: unknown;
  onChange: (value: unknown) => void;
}

/**
 * Solution bloğu — `product-detail` çözüm şemasına uygun, teknik kullanıcı
 * gerektirmeden düz metin alanları.
 */
export function SolutionBlockEditor({ value, onChange }: SolutionBlockEditorProps) {
  const parsed = parseSolution(value);
  const [heading, setHeading] = useState(parsed?.heading ?? '');
  const [description, setDescription] = useState(parsed?.description ?? '');
  const [bulletsText, setBulletsText] = useState((parsed?.bullets ?? []).join('\n'));
  const groupId = useId();

  const bullets = bulletsText.split('\n').map((line) => line.trim()).filter(Boolean);
  const headline = heading.trim();
  const desc = description.trim();

  const looksIncomplete =
    (headline.length > 0 || bullets.length > 0) && desc.length === 0;

  const flush = (
    nextHead: string,
    nextDesc: string,
    nextBulletsRaw: string,
  ) => {
    const nextBullets = nextBulletsRaw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const h = nextHead.trim();
    const d = nextDesc.trim();

    if (!h && !d && nextBullets.length === 0) {
      onChange(null);
      return;
    }

    const payload: Record<string, unknown> = { description: d };
    if (h) payload.heading = h;
    if (nextBullets.length > 0) payload.bullets = nextBullets;
    onChange(payload);
  };

  const onHeading = (next: string) => {
    setHeading(next);
    flush(next, description, bulletsText);
  };

  const onDescription = (next: string) => {
    setDescription(next);
    flush(heading, next, bulletsText);
  };

  const onBullets = (next: string) => {
    setBulletsText(next);
    flush(heading, description, next);
  };

  return (
    <div className="space-y-4 rounded-xl border border-kron-light bg-slate-50/60 p-4">
      <div>
        <h3 className="text-sm font-semibold text-kron-dark">Çözüm (Solution) bloğu</h3>
        <p id={`${groupId}-hint`} className="mt-1 text-xs text-kron-gray">
          İsteğe bağlıdır. Ürün sayfasında ayrı bir bölüm olarak gösterilir. Başlık ve madde
          işaretleri opsiyonel; site önizlemesi için ana açıklama zorunludur.
        </p>
      </div>

      <AdminInput
        label="Bölüm başlığı"
        optional
        value={heading}
        onChange={(e) => onHeading(e.target.value)}
        hint="Boş bırakırsanız sitedeki varsayılan başlık kullanılır."
        aria-describedby={`${groupId}-hint`}
      />

      <AdminTextarea
        label="Ana açıklama"
        rows={5}
        value={description}
        onChange={(e) => onDescription(e.target.value)}
        hint="Paragraf metni — çözümün özeti burada görünür."
        error={looksIncomplete ? 'Başlık veya madde işareti yazdıysanız ana açıklama da gereklidir; aksi halde bölüm sitede çıkmaz.' : undefined}
      />

      <AdminTextarea
        label="Madde işaretleri"
        optional
        rows={6}
        value={bulletsText}
        onChange={(e) => onBullets(e.target.value)}
        hint="Her satır bir madde olacak şekilde yazın; boş satırlar yok sayılır."
      />
    </div>
  );
}
