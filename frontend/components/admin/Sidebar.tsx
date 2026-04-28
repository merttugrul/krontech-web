'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCachedUser } from '@/lib/admin/session';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  exact?: boolean;
}

const BASE_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <IconDashboard />, exact: true },
  { label: 'Ürünler & Çözümler', href: '/admin/products', icon: <IconBox /> },
  { label: 'Blog & Haberler', href: '/admin/blog', icon: <IconDoc /> },
  { label: 'Kaynaklar', href: '/admin/resources', icon: <IconFile /> },
  { label: 'Form Submissions', href: '/admin/forms', icon: <IconInbox /> },
  { label: 'Redirects', href: '/admin/redirects', icon: <IconArrow /> },
  { label: 'Duyuru Barı', href: '/admin/announcement', icon: <IconBell /> },
  { label: 'Ofisler', href: '/admin/offices', icon: <IconPin /> },
  { label: 'Media Library', href: '/admin/media', icon: <IconImage /> },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const me = getCachedUser();
  const navItems: NavItem[] =
    me?.role === 'admin'
      ? [...BASE_NAV, { label: 'Kullanıcılar', href: '/admin/users', icon: <IconUser /> }]
      : BASE_NAV;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Kapat"
          className="fixed inset-0 z-30 bg-kron-navy/60 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-kron-light bg-white shadow-card transition-transform md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-kron-light px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-kron-blue to-kron-accent text-sm font-bold text-white">
            K
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight text-kron-navy">
              Krontech
            </span>
            <span className="text-[11px] uppercase tracking-wider text-kron-gray">
              Admin Panel
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href as never}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-kron-blue/10 text-kron-blue'
                        : 'text-kron-dark/80 hover:bg-kron-light hover:text-kron-dark',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-5 w-5 place-items-center',
                        isActive ? 'text-kron-blue' : 'text-kron-gray',
                      )}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-kron-light p-3 text-[11px] text-kron-gray">
          <p>v1.0 · FAZ 2</p>
        </div>
      </aside>
    </>
  );
}

// ─── Inline SVG icons — kron-gray/kron-blue current color ────────────────

function IconDashboard() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M3 3h6v7H3V3Zm8 0h6v4h-6V3ZM3 13h6v4H3v-4Zm8-4h6v8h-6V9Z"
        fill="currentColor"
      />
    </svg>
  );
}
function IconBox() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="m10 2 7 3.5v9L10 18 3 14.5v-9L10 2Zm0 2.18L4.5 6.7l5.5 2.75L15.5 6.7 10 4.18ZM4 8.07v6.25L9.25 17V10.8L4 8.07Zm11.5 6.25V8.07l-5.25 2.73V17L15.5 14.32Z"
        fill="currentColor"
      />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M5 2h7l4 4v12H5V2Zm6 0v5h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
function IconFile() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M4 3h8l4 4v10H4V3Zm0 6h12M4 13h12M4 17h12"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
      />
    </svg>
  );
}
function IconInbox() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M3 11v6h14v-6l-3-7H6l-3 7Zm3 0h3l1 2h2l1-2h3"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M3 8h11l-3-3m3 3-3 3m5 4H7l3 3m-3-3 3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
function IconBell() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M10 2a5 5 0 0 0-5 5v3l-2 4h14l-2-4V7a5 5 0 0 0-5-5ZM8 17h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
function IconPin() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M10 18s6-6.3 6-10a6 6 0 0 0-12 0c0 3.7 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="10" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M10 10a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 10 10Zm0 2c-3.33 0-6 1.79-6 4v1h12v-1c0-2.21-2.67-4-6-4Z"
        fill="currentColor"
      />
    </svg>
  );
}
function IconImage() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <rect
        x="3"
        y="4"
        width="14"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
      <circle cx="7" cy="8.5" r="1.5" fill="currentColor" />
      <path d="m4 15 4-4 3 3 2-2 3 3" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  );
}
