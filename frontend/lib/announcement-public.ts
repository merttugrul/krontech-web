import { sfetch } from '@/lib/api';
import type { AnnouncementBar, Locale } from '@/lib/types';

/** Navbar `fixed` altında; duyuru şeridi yüksekliği kadar aşağı itilir (px). */
export const ANNOUNCEMENT_BAR_OFFSET_PX = 40;

export const KRON_ANNOUNCEMENT_DISMISSED = 'kron:announcement-dismissed';

/**
 * Public marketing duyurusu (RSC / server’da tekil çağrı; SiteShell + isteğe bağlı başka yerler).
 */
export async function getPublicAnnouncement(
  locale: Locale,
): Promise<AnnouncementBar | null> {
  try {
    const res = await sfetch<{ announcement: AnnouncementBar | null }>(
      `/announcement-bar?locale=${locale}`,
      { tags: ['announcement-bar'], revalidate: 60 },
    );
    return res.announcement;
  } catch {
    return null;
  }
}
