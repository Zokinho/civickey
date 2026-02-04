'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Locale, CustomPage, NavigationItem } from '@/lib/types';
import { t, getLocalizedText } from '@/lib/i18n';
import { resolveNavItem } from '@/lib/navigation';

interface MobileNavProps {
  municipalityId: string;
  locale: Locale;
  pages?: CustomPage[];
  navigation?: NavigationItem[];
}

export default function MobileNav({ municipalityId, locale, pages = [], navigation }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [expandedDropdowns, setExpandedDropdowns] = useState<Set<string>>(new Set());
  const base = `/${municipalityId}/${locale}`;

  const toggleDropdown = (id: string) => {
    setExpandedDropdowns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const closeMenu = () => {
    setOpen(false);
    setExpandedDropdowns(new Set());
  };

  const renderConfigurableNav = () => {
    if (!navigation || navigation.length === 0) return null;

    const resolved = navigation
      .map((item) => resolveNavItem(item, base, locale))
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return resolved.map((item) => {
      if (item.type === 'link') {
        return item.data.external ? (
          <a
            key={item.data.id}
            href={item.data.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenu}
            className="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-50"
          >
            {item.data.label}
          </a>
        ) : (
          <Link
            key={item.data.id}
            href={item.data.href}
            onClick={closeMenu}
            className="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-50"
          >
            {item.data.label}
          </Link>
        );
      }

      const isExpanded = expandedDropdowns.has(item.data.id);
      return (
        <div key={item.data.id}>
          <button
            onClick={() => toggleDropdown(item.data.id)}
            className="w-full px-4 py-2 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-between"
          >
            {item.data.label}
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isExpanded && (
            <div className="pl-4">
              {item.data.children.map((child) =>
                child.external ? (
                  <a
                    key={child.id}
                    href={child.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="block px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50"
                  >
                    {child.label}
                  </a>
                ) : (
                  <Link
                    key={child.id}
                    href={child.href}
                    onClick={closeMenu}
                    className="block px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50"
                  >
                    {child.label}
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      );
    });
  };

  const renderLegacyNav = () => {
    const links = [
      { label: t('nav.home', locale), href: base },
      { label: t('nav.collections', locale), href: `${base}/collections` },
      { label: t('nav.events', locale), href: `${base}/events` },
      { label: t('nav.news', locale), href: `${base}/news` },
      { label: t('nav.facilities', locale), href: `${base}/facilities` },
    ];

    const menuPages = pages
      .filter((p) => p.showInMenu)
      .sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0));

    return (
      <>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={closeMenu}
            className="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-50"
          >
            {link.label}
          </Link>
        ))}
        {menuPages.length > 0 && (
          <>
            <div className="border-t border-gray-100 my-2" />
            {menuPages.map((page) => (
              <Link
                key={page.slug}
                href={`${base}/${page.slug}`}
                onClick={closeMenu}
                className="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-50"
              >
                {getLocalizedText(page.title, locale)}
              </Link>
            ))}
          </>
        )}
      </>
    );
  };

  const useConfigurable = navigation && navigation.length > 0;

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
        aria-label="Toggle menu"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-lg z-50">
          <nav className="container-page py-4 flex flex-col gap-1">
            {useConfigurable ? renderConfigurableNav() : renderLegacyNav()}
          </nav>
        </div>
      )}
    </div>
  );
}
