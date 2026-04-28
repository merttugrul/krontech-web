import type { ResourceType } from './types';
import type { Dictionary } from './i18n';

/**
 * ResourceType ↔ i18n label eşlemesi. Sayfalar her yerde tekrar yazmayıp
 * buradan çeker.
 */
export function resourceTypeLabel(
  type: ResourceType,
  dict: Dictionary,
): string {
  switch (type) {
    case 'datasheet':
      return dict.resources.typeDatasheet;
    case 'casestudy':
      return dict.resources.typeCasestudy;
    case 'whitepaper':
      return dict.resources.typeWhitepaper;
  }
}

/**
 * URL query `?type=...` → geçerli `ResourceType` veya null (all filter).
 * Geçersiz değerler null'a düşer.
 */
export function parseResourceTypeParam(raw: string | undefined): ResourceType | null {
  if (raw === 'datasheet' || raw === 'casestudy' || raw === 'whitepaper') {
    return raw;
  }
  return null;
}
