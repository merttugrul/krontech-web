import type { Locale } from '@/lib/types';
import { getPublicAnnouncement } from '@/lib/announcement-public';
import { getDictionary } from '@/lib/i18n';
import { AnnouncementBarClient } from './AnnouncementBarClient';

interface AnnouncementBarProps {
  locale: Locale;
}

/**
 * Server component — aktif duyuruyu backend'den RSC sırasında çeker. Backend
 * kapalıysa (dev ortamında ya da ilk deploy'da) sessizce `null` döner,
 * şerit render edilmez.
 *
 * Neden RSC + client wrapper?
 *  - Duyuru içeriği SSR'da gelsin (CLS yok).
 *  - Dismiss durumu localStorage'dan okunup ilk paint'ten sonra uygulansın
 *    (SSR mismatch ihtimali var ama `suppressHydrationWarning` ile güvenli).
 */
export async function AnnouncementBar({ locale }: AnnouncementBarProps) {
  const data = await getPublicAnnouncement(locale);
  if (!data) return null;

  const dict = getDictionary(locale);
  return (
    <AnnouncementBarClient hasAnnouncement data={data} dismissLabel={dict.announcement.dismiss} />
  );
}
