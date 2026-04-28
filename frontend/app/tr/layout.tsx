import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { SiteShell } from '@/components/layout/SiteShell';

export const metadata: Metadata = {
  alternates: {
    languages: { en: '/', tr: '/tr' },
  },
};

export default function SiteLayoutTr({ children }: { children: ReactNode }) {
  return <SiteShell locale="tr">{children}</SiteShell>;
}
