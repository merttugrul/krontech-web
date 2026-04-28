import type { ContentStatus } from '@/lib/admin/types';
import { cn } from '@/lib/utils';

const STYLES: Record<ContentStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Taslak' },
  published: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Yayında' },
  scheduled: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Planlı' },
};

export function StatusBadge({
  status,
  className,
}: {
  status: ContentStatus;
  className?: string;
}) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
        s.bg,
        s.text,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', s.text.replace('text-', 'bg-'))} />
      {s.label}
    </span>
  );
}
