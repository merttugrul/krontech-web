import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HighlightProps {
  children: ReactNode;
  /**
   * `bar` (default) — kelimenin altında ince gradient çubuk.
   *   Kurumsal kimliğe en yakın görünüm; brand manual'de varsayılan.
   * `underline` — klasik alt çizgi; blog gövde metni içinde kullanmak için.
   */
  variant?: 'bar' | 'underline';
  className?: string;
}

/**
 * Başlık içinde belirli kelimeleri Krontech mavisiyle vurgulayan kompozisyon
 * bileşeni. PLAN.md'deki örnek: "Kron <Highlight>Telemetry Pipeline</Highlight>".
 *
 * İçerik zaten metin olarak render edildiği için ekran okuyucular fark etmez —
 * sadece görsel. Inline semantik `<span>` yeterli, ek `<strong>` gerekmez
 * (önem tipografisi değil marka vurgu).
 */
export function Highlight({ children, variant = 'bar', className }: HighlightProps) {
  return (
    <span className={cn(variant === 'bar' ? 'hl' : 'hl-underline', className)}>
      {children}
    </span>
  );
}
