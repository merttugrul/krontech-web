import type { ReactNode } from 'react';
import { SiteShell } from '@/components/layout/SiteShell';

/**
 * EN marketing segment. URL'de görünmeyen `(site)` grup katmanı — sayesinde
 * /admin gibi diğer root segmentler bu shell'i kalıtlamıyor.
 */
export default function SiteLayoutEn({ children }: { children: ReactNode }) {
  return <SiteShell locale="en">{children}</SiteShell>;
}
