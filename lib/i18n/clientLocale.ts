import type { Locale } from './types';
import { LOCALE_STORAGE_KEY, defaultLocale } from './types';

/** Browser-only: used by hooks that are not under I18nProvider timing. */
export function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  try {
    const v = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (v === 'pt' || v === 'en') return v;
  } catch {
    /* ignore */
  }
  return defaultLocale;
}
