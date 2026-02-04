'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Locale, CustomPage } from '@/lib/types';
import { t, getLocalizedText } from '@/lib/i18n';

interface MobileNavProps {
  municipalityId: string;
  locale: Locale;
  pages?: CustomPage[];
}

export default function MobileNav({ municipalityId, locale, pages = [] }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const base = `/${municipalityId}/${locale}`;

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
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
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
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    {getLocalizedText(page.title, locale)}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
