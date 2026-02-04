import Link from 'next/link';
import type { Locale, CustomPage, NavigationItem } from '@/lib/types';
import { t } from '@/lib/i18n';
import { resolveNavItem } from '@/lib/navigation';
import type { ResolvedNavLink } from '@/lib/navigation';

interface NavigationProps {
  municipalityId: string;
  locale: Locale;
  pages?: CustomPage[];
  navigation?: NavigationItem[];
}

interface NavItem {
  label: string;
  href: string;
}

export default function Navigation({ municipalityId, locale, pages = [], navigation }: NavigationProps) {
  const base = `/${municipalityId}/${locale}`;

  if (navigation && navigation.length > 0) {
    const resolved = navigation
      .map((item) => resolveNavItem(item, base, locale))
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return (
      <nav className="hidden lg:flex items-center gap-1">
        {resolved.map((item) => {
          if (item.type === 'link') {
            return item.data.external ? (
              <a
                key={item.data.id}
                href={item.data.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                {item.data.label}
              </a>
            ) : (
              <Link
                key={item.data.id}
                href={item.data.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                {item.data.label}
              </Link>
            );
          }

          return (
            <DropdownNav
              key={item.data.id}
              label={item.data.label}
              items={item.data.children}
            />
          );
        })}
      </nav>
    );
  }

  // Legacy hardcoded navigation
  const mainLinks: NavItem[] = [
    { label: t('nav.home', locale), href: base },
    { label: t('nav.collections', locale), href: `${base}/collections` },
    { label: t('nav.events', locale), href: `${base}/events` },
    { label: t('nav.news', locale), href: `${base}/news` },
    { label: t('nav.facilities', locale), href: `${base}/facilities` },
  ];

  const servicePages = pages
    .filter((p) => p.showInMenu && p.menuSection === 'services')
    .sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0));

  const cityPages = pages
    .filter((p) => p.showInMenu && p.menuSection === 'city')
    .sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0));

  return (
    <nav className="hidden lg:flex items-center gap-1">
      {mainLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          {link.label}
        </Link>
      ))}

      {servicePages.length > 0 && (
        <DropdownNav
          label={t('nav.services', locale)}
          items={servicePages.map((p) => ({
            id: p.id,
            label: locale === 'fr' ? p.title.fr : p.title.en,
            href: `${base}/${p.slug}`,
            external: false,
          }))}
        />
      )}

      {cityPages.length > 0 && (
        <DropdownNav
          label={t('nav.city', locale)}
          items={cityPages.map((p) => ({
            id: p.id,
            label: locale === 'fr' ? p.title.fr : p.title.en,
            href: `${base}/${p.slug}`,
            external: false,
          }))}
        />
      )}
    </nav>
  );
}

function DropdownNav({ label, items }: { label: string; items: ResolvedNavLink[] }) {
  return (
    <div className="relative group">
      <button className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-1">
        {label}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {items.map((item) =>
          item.external ? (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
            >
              {item.label}
            </a>
          ) : (
            <Link
              key={item.id}
              href={item.href}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
            >
              {item.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
