'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { KRON_ANNOUNCEMENT_DISMISSED } from '@/lib/announcement-public';
import type { AnnouncementBar as AnnouncementBarData } from '@/lib/types';

/** Seçenek 2: duyuru bazlı kalıcı dismiss (`announcement-dismissed-<uuid>` → `'true'`). */
export function announcementDismissedStorageKey(id: string): string {
  return `announcement-dismissed-${id}`;
}

interface AnnouncementBarClientProps {
  /** Sunucunun duyuru döndürdüğü durumda true; Navbar offset’i istemci DOM ile hizalanır. */
  hasAnnouncement?: boolean;
  data: AnnouncementBarData;
  dismissLabel: string;
}

/**
 * Görünür şerit + dismiss ikonu. Dismiss edildiğinde localStorage'a duyuru
 * `announcement-dismissed-<id>` = `'true'` yazılır; sayfa yenilenince de hatırlanır.
 *
 * Önemli: Backend yeni bir duyuru yayınlarsa id farklı olur ve dismissed key
 * otomatik geçersiz sayılır — marketing için doğru davranış.
 */
export function AnnouncementBarClient({
  hasAnnouncement = true,
  data,
  dismissLabel,
}: AnnouncementBarClientProps) {
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!hasAnnouncement) {
      setHydrated(true);
      return;
    }
    try {
      const key = announcementDismissedStorageKey(data.id);
      if (window.localStorage.getItem(key) === 'true') {
        setDismissed(true);
        window.dispatchEvent(new CustomEvent(KRON_ANNOUNCEMENT_DISMISSED));
      }
    } catch {
      // Private mode veya storage erişimi kapalı — sessizce yoksay.
    }
    setHydrated(true);
  }, [data.id, hasAnnouncement]);

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(announcementDismissedStorageKey(data.id), 'true');
    } catch {
      // Yoksay.
    }
    setDismissed(true);
    window.dispatchEvent(new CustomEvent(KRON_ANNOUNCEMENT_DISMISSED));
  };

  if (!hasAnnouncement || dismissed) return null;

  // İlk render'da hydration eşleşmesin diye `suppressHydrationWarning` ile
  // kısa flicker'ı kabul ediyoruz (text her iki ortamda aynı).
  return (
    <div
      data-testid="announcement-bar"
      aria-hidden={!hydrated}
      className="fixed inset-x-0 top-0 z-50 bg-kron-dark text-white"
    >
      <div className="container flex items-center justify-between gap-3 py-2 text-sm">
        <p className="flex-1 text-center sm:text-left">
          <span>{data.text}</span>
          {data.linkUrl ? (
            <>
              {' '}
              <Link
                href={data.linkUrl as '/'}
                className="font-medium text-kron-light underline underline-offset-2 hover:text-white"
              >
                {data.linkLabel ?? '→'}
              </Link>
            </>
          ) : null}
        </p>
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={handleDismiss}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-white/70 hover:bg-white/10 hover:text-white"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
