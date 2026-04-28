import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormCardProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Form bölümlerini tutarlı gruplamak için wrapper. Başlık + açıklama + alanlar
 * + (opsiyonel) toolbar. Uzun formları seksiyonlara ayırmak için kullanılır.
 */
export function FormCard({ title, description, actions, children, className }: FormCardProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-kron-light bg-white shadow-sm',
        className,
      )}
    >
      {(title || description || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-kron-light px-5 py-4">
          <div className="min-w-0">
            {title && <h3 className="text-base font-semibold text-kron-navy">{title}</h3>}
            {description && (
              <p className="mt-0.5 text-xs text-kron-gray">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

export function FormGrid({
  children,
  columns = 2,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
}) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
  }[columns];
  return <div className={cn('grid gap-4', colClass)}>{children}</div>;
}
