/**
 * Slug normalize: küçük harf, türkçe karakter dönüşümü, alfanümerik dışı → "-".
 * Kullanıcı admin panelinden slug yazsa bile garanti URL-safe olur.
 */
export function normalizeSlug(input: string): string {
  if (!input) return '';

  const trMap: Record<string, string> = {
    ç: 'c',
    ğ: 'g',
    ı: 'i',
    İ: 'i',
    ö: 'o',
    ş: 's',
    ü: 'u',
    Ç: 'c',
    Ğ: 'g',
    Ö: 'o',
    Ş: 's',
    Ü: 'u',
  };

  const lowered = input
    .split('')
    .map((ch) => trMap[ch] ?? ch)
    .join('')
    .toLowerCase();

  return lowered
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // diakritikler
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}
