import type { Locale, BilingualText } from './types';
import fr from '@/i18n/fr.json';
import en from '@/i18n/en.json';

const translations: Record<Locale, Record<string, string>> = { fr, en };

export function t(key: string, locale: Locale, params?: Record<string, string>): string {
  let text = translations[locale]?.[key] || translations.fr[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  return text;
}

export function getLocalizedText(
  obj: BilingualText | undefined | null,
  locale: Locale,
  fallback = ''
): string {
  if (!obj) return fallback;
  return obj[locale] || obj.en || obj.fr || fallback;
}
