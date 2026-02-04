import type { Locale } from './types';

const VALID_LOCALES: Locale[] = ['fr', 'en'];
const DEFAULT_LOCALE: Locale = 'fr';

export function isValidLocale(locale: string): locale is Locale {
  return VALID_LOCALES.includes(locale as Locale);
}

export function getLocaleFromHeaders(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const preferred = acceptLanguage.split(',')[0]?.trim().toLowerCase();
  if (preferred?.startsWith('en')) return 'en';
  return DEFAULT_LOCALE;
}

export { DEFAULT_LOCALE, VALID_LOCALES };
