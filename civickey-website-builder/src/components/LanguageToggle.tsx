'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { Locale } from '@/lib/types';

export default function LanguageToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  const switchTo: Locale = locale === 'fr' ? 'en' : 'fr';

  const handleSwitch = () => {
    // Replace locale segment in path: /municipality/fr/... -> /municipality/en/...
    const segments = pathname.split('/');
    const localeIndex = segments.findIndex((s) => s === 'fr' || s === 'en');
    if (localeIndex !== -1) {
      segments[localeIndex] = switchTo;
    }
    const newPath = segments.join('/');

    // Set cookie for middleware
    document.cookie = `locale=${switchTo}; path=/; max-age=${365 * 24 * 60 * 60}`;
    router.push(newPath);
  };

  return (
    <button
      onClick={handleSwitch}
      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
      aria-label={switchTo === 'en' ? 'Switch to English' : 'Passer au fran\u00e7ais'}
    >
      <span className={locale === 'fr' ? 'font-bold' : 'text-gray-400'}>FR</span>
      <span className="text-gray-300">|</span>
      <span className={locale === 'en' ? 'font-bold' : 'text-gray-400'}>EN</span>
    </button>
  );
}
