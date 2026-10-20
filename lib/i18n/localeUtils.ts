import type { Locale } from './types';

export function localeToHtmlLang(locale: Locale): string {
  return locale === 'pt' ? 'pt-MZ' : 'en';
}

export function localeToNumberFormat(locale: Locale): string {
  return locale === 'pt' ? 'pt-MZ' : 'en-US';
}
