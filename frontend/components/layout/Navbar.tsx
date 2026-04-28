'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/types';
import type { Dictionary } from '@/lib/i18n';
import { KRON_ANNOUNCEMENT_DISMISSED } from '@/lib/announcement-public';
import { cn, localePrefix } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';

interface NavbarProps {
  locale: Locale;
  dictionary: Dictionary;
  announcementOffsetPx?: number;
}

interface NavLink {
  labelKey: keyof Dictionary['nav'];
  href: string;
}

/**
 * Top-level marketing navigation. Admin paneli kendi layout'unu kullandığı
 * için bu sadece (site) ve /tr grupları altında.
 *
 * Özellikler:
 *  - Scroll'da opak arka plan (transparandan beyaza geçiş) — hero ile
 *    overlap eden ilk viewport'ta şeffaf, scroll sonrası `shadow-card`.
 *  - Mobile (<lg) hamburger — focus trap yerine body scroll lock yetiyor
 *    çünkü menü tam ekran değil.
 *  - Active link vurgusu — `usePathname()` ile eşleşen link accent.
 */
export function Navbar({ locale, dictionary, announcementOffsetPx = 0 }: NavbarProps) {
  const pathname = usePathname() ?? '/';
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [annOffset, setAnnOffset] = useState(announcementOffsetPx);
  const prefix = localePrefix(locale);

  useEffect(() => {
    setAnnOffset(announcementOffsetPx);
  }, [announcementOffsetPx]);

  useEffect(() => {
    const onDismissed = () => setAnnOffset(0);
    window.addEventListener(KRON_ANNOUNCEMENT_DISMISSED, onDismissed);
    return () => window.removeEventListener(KRON_ANNOUNCEMENT_DISMISSED, onDismissed);
  }, []);

  const links: NavLink[] = [
    { labelKey: 'products', href: `${prefix}/products` },
    { labelKey: 'solutions', href: `${prefix}/solutions` },
    { labelKey: 'resources', href: `${prefix}/resources` },
    { labelKey: 'blog', href: `${prefix}/blog` },
    { labelKey: 'contact', href: `${prefix}/contact` },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mobile menü açıkken body scroll'u kilitle
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [open]);

  // Route değişince menüyü kapat
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === prefix || href === `${prefix}/`) return pathname === (prefix || '/');
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const headerClass = cn(
    'fixed inset-x-0 z-40 transition-all duration-200',
    scrolled
      ? 'bg-white/95 backdrop-blur-md shadow-card'
      : 'bg-transparent',
  );

  const linkBase =
    'text-sm font-medium transition-colors hover:text-kron-accent';
  const linkColor = scrolled ? 'text-kron-dark' : 'text-white';
  const linkActive = 'text-kron-accent';

  const mainTop = annOffset;
  const mobileSheetTop = `calc(4rem + ${annOffset}px)`;

  return (
    <header
      className={headerClass}
      data-testid="navbar"
      style={{ top: mainTop }}
    >
      <div className="container flex h-16 items-center justify-between gap-6">
        <Logo locale={locale} variant={scrolled ? 'dark' : 'white'} />

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden lg:flex lg:items-center lg:gap-8">
          {links.map((link) => (
            <Link
              key={link.labelKey}
              href={link.href as '/'}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cn(
                linkBase,
                isActive(link.href) ? linkActive : linkColor,
              )}
            >
              {dictionary.nav[link.labelKey]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher variant={scrolled ? 'dark' : 'white'} className="hidden sm:flex" />
          <Link
            href={`${prefix}/contact` as '/'}
            className="hidden sm:inline-flex btn-primary"
          >
            {dictionary.nav.demo}
          </Link>

          {/* Hamburger */}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? dictionary.nav.closeMenu : dictionary.nav.openMenu}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-md lg:hidden',
              scrolled ? 'text-kron-dark hover:bg-slate-100' : 'text-white hover:bg-white/10',
            )}
          >
            <HamburgerIcon open={open} />
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {open ? (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          style={{ top: mobileSheetTop }}
          className="fixed inset-x-0 bottom-0 z-40 overflow-y-auto bg-white lg:hidden animate-fade-in-up"
        >
          <nav aria-label="Mobile primary" className="container flex flex-col py-6">
            {links.map((link) => (
              <Link
                key={link.labelKey}
                href={link.href as '/'}
                className={cn(
                  'border-b border-slate-100 py-3 text-lg font-medium',
                  isActive(link.href) ? 'text-kron-accent' : 'text-kron-dark',
                )}
              >
                {dictionary.nav[link.labelKey]}
              </Link>
            ))}
            <Link
              href={`${prefix}/contact` as '/'}
              className="btn-primary mt-6"
            >
              {dictionary.nav.demo}
            </Link>
            <div className="mt-6 flex items-center justify-center">
              <LocaleSwitcher variant="dark" />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {open ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </>
      )}
    </svg>
  );
}
