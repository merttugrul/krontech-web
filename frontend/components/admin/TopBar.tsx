'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { AdminUser } from '@/lib/admin/auth-types';
import { logout } from '@/lib/admin/auth-api';
import { cn } from '@/lib/utils';

interface TopBarProps {
  user: AdminUser;
  onOpenSidebar: () => void;
}

/**
 * Üst çubuk — hamburger (mobil), breadcrumb, site önizleme linki, user menu.
 */
export function TopBar({ user, onOpenSidebar }: TopBarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const title = computeTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-kron-light bg-white/90 px-4 backdrop-blur md:px-8">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Menüyü aç"
        className="grid h-9 w-9 place-items-center rounded-lg border border-kron-light text-kron-gray hover:bg-kron-light md:hidden"
      >
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none">
          <path
            d="M4 6h12M4 10h12M4 14h12"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <h1 className="text-base font-semibold text-kron-navy md:text-lg">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 text-xs font-medium text-kron-gray transition-colors hover:text-kron-blue md:inline-flex"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
            <path
              d="M11 3h6v6m0-6-8 8M5 5h5v2H7v8h8v-3h2v5H5V5Z"
              fill="currentColor"
            />
          </svg>
          Siteyi önizle
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              'flex items-center gap-2 rounded-full border border-kron-light bg-white py-1.5 pl-1.5 pr-3 text-sm font-medium text-kron-dark transition-shadow hover:shadow-card',
              menuOpen && 'shadow-card',
            )}
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-kron-blue to-kron-accent text-[11px] font-bold uppercase text-white">
              {user.email.charAt(0)}
            </span>
            <span className="hidden md:inline">{user.email}</span>
            <span
              className={cn(
                'hidden rounded bg-kron-light px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider md:inline',
                user.role === 'admin' ? 'text-kron-accent' : 'text-kron-blue',
              )}
            >
              {user.role}
            </span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-kron-light bg-white shadow-card">
              <div className="border-b border-kron-light px-4 py-3 text-xs text-kron-gray">
                <p className="truncate font-medium text-kron-dark">{user.email}</p>
                <p className="mt-0.5 capitalize">{user.role}</p>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-kron-dark hover:bg-kron-light"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
                  <path
                    d="M12 4h4v12h-4M4 10h9m0 0-3-3m3 3-3 3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Çıkış yap
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function computeTitle(pathname: string): string {
  if (pathname === '/admin') return 'Dashboard';
  if (pathname.startsWith('/admin/products/new')) return 'Yeni Ürün';
  if (pathname.match(/^\/admin\/products\/[^/]+$/)) return 'Ürün Düzenle';
  if (pathname.startsWith('/admin/products')) return 'Ürünler';
  if (pathname.startsWith('/admin/blog/new')) return 'Yeni Blog Yazısı';
  if (pathname.match(/^\/admin\/blog\/[^/]+$/)) return 'Blog Düzenle';
  if (pathname.startsWith('/admin/blog')) return 'Blog & Haberler';
  if (pathname.startsWith('/admin/resources')) return 'Kaynaklar';
  if (pathname.startsWith('/admin/forms')) return 'Form Submissions';
  if (pathname.startsWith('/admin/redirects')) return 'Redirects';
  if (pathname.startsWith('/admin/announcement')) return 'Duyuru Barı';
  if (pathname.startsWith('/admin/offices')) return 'Ofisler';
  if (pathname.startsWith('/admin/media')) return 'Media Library';
  return 'Admin';
}
