import Link from 'next/link';
import Image from 'next/image';
import Navigation from './Navigation';
import MobileNav from './MobileNav';
import LanguageToggle from './LanguageToggle';
import type { Locale, MunicipalityConfig, CustomPage } from '@/lib/types';

interface HeaderProps {
  config: MunicipalityConfig;
  locale: Locale;
  pages?: CustomPage[];
}

export default function Header({ config, locale, pages }: HeaderProps) {
  const base = `/${config.id}/${locale}`;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="container-page">
        <div className="flex items-center justify-between h-16">
          <Link href={base} className="flex items-center gap-3 shrink-0">
            {config.logo && (
              <Image
                src={config.logo}
                alt={config.name}
                width={40}
                height={40}
                className="h-10 w-auto"
              />
            )}
            <span className="font-bold text-lg text-gray-900">
              {config.name}
            </span>
          </Link>

          <Navigation
            municipalityId={config.id}
            locale={locale}
            pages={pages}
          />

          <div className="flex items-center gap-3">
            <LanguageToggle locale={locale} />
            <MobileNav
              municipalityId={config.id}
              locale={locale}
              pages={pages}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
