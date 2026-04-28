import type { AdminFormSubmission, FormType } from './types';

/** JSON `data` alanından string okur. */
export function getDataString(data: Record<string, unknown>, key: string): string {
  const v = data[key];
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

/** Detayda nesne/dizi değerleri için (kısa JSON). */
export function getDataDisplayString(data: Record<string, unknown>, key: string): string {
  const v = data[key];
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return '';
  }
}

const FIELD_LABEL: Record<string, string> = {
  name: 'Ad Soyad',
  email: 'E-posta',
  company: 'Şirket',
  phone: 'Telefon',
  message: 'Mesaj',
  jobTitle: 'Ünvan',
  productInterest: 'Ürün / ilgi',
};

const CONTACT_ORDER = ['name', 'email', 'company', 'phone', 'message'] as const;
const DEMO_ORDER = [
  'name',
  'email',
  'company',
  'jobTitle',
  'phone',
  'productInterest',
  'message',
] as const;

export function orderedFieldKeysForFormType(formType: FormType): readonly string[] {
  return formType === 'demo' ? DEMO_ORDER : CONTACT_ORDER;
}

/** Detay / export: bilinen sıra + data’da ekstra key’ler. */
export function getFormDataKeysInOrder(
  formType: FormType,
  data: Record<string, unknown>,
): string[] {
  const order = orderedFieldKeysForFormType(formType);
  const out: string[] = [];
  for (const k of order) {
    out.push(k);
  }
  for (const k of Object.keys(data).sort()) {
    if (!order.includes(k)) out.push(k);
  }
  return out;
}

/** Listede "Mesaj" sütunu: contact zorunlu mesaj; demo’da yoksa ünvan/ilgi alanı. */
export function getMessageColumnText(row: AdminFormSubmission): string {
  const d = row.data;
  const msg = getDataString(d, 'message');
  if (row.formType === 'contact') {
    return msg || '—';
  }
  if (msg.trim()) return msg;
  const parts = [getDataString(d, 'jobTitle'), getDataString(d, 'productInterest')].filter(
    (p) => p.length > 0,
  );
  if (parts.length) return parts.join(' · ');
  return '—';
}

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** UTF-8 BOM: Excel’de Türkçe sütun başlıkları için. */
const CSV_BOM = '\uFEFF';

function valueForCsvCell(data: Record<string, unknown>, key: string): string {
  const v = data[key];
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function csvColumnHeaderForKey(key: string): string {
  return fieldLabelTr(key);
}

/**
 * Tarih + form tipi + tüm satırlarda geçen `data` key’leri (dinamik sütunlar).
 */
export function formSubmissionsToCsvString(rows: AdminFormSubmission[]): string {
  const dataKeySet = new Set<string>();
  for (const row of rows) {
    if (row.data && typeof row.data === 'object') {
      for (const k of Object.keys(row.data)) dataKeySet.add(k);
    }
  }
  const dataKeys = Array.from(dataKeySet).sort((a, b) => a.localeCompare(b, 'tr'));

  const header = ['Tarih', 'Form tipi', ...dataKeys.map(csvColumnHeaderForKey)].map(escapeCsvCell);
  const lines: string[] = [header.join(',')];

  for (const row of rows) {
    const d = (row.data ?? {}) as Record<string, unknown>;
    const line = [
      row.createdAt,
      row.formType,
      ...dataKeys.map((key) => valueForCsvCell(d, key)),
    ].map(escapeCsvCell);
    lines.push(line.join(','));
  }

  return CSV_BOM + lines.join('\r\n');
}

export function fieldLabelTr(key: string): string {
  return FIELD_LABEL[key] ?? key;
}
