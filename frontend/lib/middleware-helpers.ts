/**
 * Middleware yardımcıları — pure fonksiyonlar, jest ile test edilebilir.
 * `middleware.ts` Edge runtime'da çalıştığı için NextResponse/Request bağımlı
 * logiği ayırıyoruz.
 */

export interface RedirectLookup {
  toPath: string;
  statusCode: number;
}

export type RedirectDecision =
  | { action: 'skip' }
  | { action: 'redirect'; toPath: string; statusCode: 301 | 302 };

/**
 * Gelen path + backend lookup sonucunu alıp redirect kararını üretir.
 *
 * Kurallar:
 *  1. Lookup null → skip
 *  2. toPath relative değilse (open-redirect koruması) → skip
 *  3. toPath current path ile aynıysa (trailing slash normalize sonrası) → skip
 *  4. Aksi takdirde 301/302 redirect; default 301.
 */
export function decideRedirect(
  currentPath: string,
  lookup: RedirectLookup | null,
): RedirectDecision {
  if (!lookup) return { action: 'skip' };
  if (!isSafeRelativePath(lookup.toPath)) return { action: 'skip' };

  if (normalizePath(lookup.toPath) === normalizePath(currentPath)) {
    return { action: 'skip' };
  }

  const statusCode = lookup.statusCode === 302 ? 302 : 301;
  return { action: 'redirect', toPath: lookup.toPath, statusCode };
}

/**
 * `/path` kabul eder; `//evil.com` ya da `http://...` gibi absolute/protokol
 * relative değerleri reddeder. Open-redirect açığını engellemek için kritik.
 */
export function isSafeRelativePath(path: string): boolean {
  if (typeof path !== 'string' || path.length === 0) return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (path.startsWith('/\\')) return false;
  return true;
}

/**
 * Trailing slash normalize — sadece kök dışındaki path'lerde sondaki `/`'yi
 * siler. (`/` kendisi için hiç dokunmaz.)
 */
export function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
}
