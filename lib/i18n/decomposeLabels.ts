import type { Locale } from './types';

/** Legacy keys (PT) from older saves + current EN keys */
const DECOMPOSE_LABELS: Record<string, Record<Locale, string>> = {
  'Preço de compra': { en: 'Purchase price', pt: 'Preço de compra' },
  Transporte: { en: 'Shipping', pt: 'Transporte' },
  'Preço fornecedor': { en: 'Supplier price', pt: 'Preço fornecedor' },
  'Custos adicionais': { en: 'Extra costs', pt: 'Custos adicionais' },
  'Purchase price': { en: 'Purchase price', pt: 'Preço de compra' },
  Shipping: { en: 'Shipping', pt: 'Transporte' },
  'Supplier price': { en: 'Supplier price', pt: 'Preço fornecedor' },
  'Extra costs': { en: 'Extra costs', pt: 'Custos adicionais' },
};

export function decomposeLineLabel(key: string, locale: Locale): string {
  const row = DECOMPOSE_LABELS[key];
  if (row) return row[locale];
  return key;
}
