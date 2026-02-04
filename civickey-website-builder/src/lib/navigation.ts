import type { Locale, NavigationItem, NavigationChild } from './types';
import { getLocalizedText } from './i18n';

export interface ResolvedNavLink {
  id: string;
  label: string;
  href: string;
  external: boolean;
}

export interface ResolvedNavDropdown {
  id: string;
  label: string;
  children: ResolvedNavLink[];
}

export type ResolvedNavItem =
  | { type: 'link'; data: ResolvedNavLink }
  | { type: 'dropdown'; data: ResolvedNavDropdown };

const BUILTIN_PATHS: Record<string, string> = {
  home: '',
  collections: '/collections',
  events: '/events',
  news: '/news',
  facilities: '/facilities',
};

function resolveChildLink(
  child: NavigationChild,
  basePath: string,
  locale: Locale
): ResolvedNavLink | null {
  const label = getLocalizedText(child.label, locale);
  if (!label) return null;

  if (child.linkType === 'builtin' && child.builtinPage) {
    const path = BUILTIN_PATHS[child.builtinPage];
    if (path === undefined) return null;
    return { id: child.id, label, href: `${basePath}${path}`, external: false };
  }

  if (child.linkType === 'page' && child.pageSlug) {
    return { id: child.id, label, href: `${basePath}/${child.pageSlug}`, external: false };
  }

  if (child.linkType === 'external' && child.externalUrl) {
    return { id: child.id, label, href: child.externalUrl, external: true };
  }

  return null;
}

export function resolveNavItem(
  item: NavigationItem,
  basePath: string,
  locale: Locale
): ResolvedNavItem | null {
  const label = getLocalizedText(item.label, locale);
  if (!label) return null;

  if (item.type === 'link') {
    if (item.linkType === 'builtin' && item.builtinPage) {
      const path = BUILTIN_PATHS[item.builtinPage];
      if (path === undefined) return null;
      return {
        type: 'link',
        data: { id: item.id, label, href: `${basePath}${path}`, external: false },
      };
    }

    if (item.linkType === 'page' && item.pageSlug) {
      return {
        type: 'link',
        data: { id: item.id, label, href: `${basePath}/${item.pageSlug}`, external: false },
      };
    }

    if (item.linkType === 'external' && item.externalUrl) {
      return {
        type: 'link',
        data: { id: item.id, label, href: item.externalUrl, external: true },
      };
    }

    return null;
  }

  if (item.type === 'dropdown') {
    const children = (item.children || [])
      .map((c) => resolveChildLink(c, basePath, locale))
      .filter((c): c is ResolvedNavLink => c !== null);

    if (children.length === 0) return null;

    return {
      type: 'dropdown',
      data: { id: item.id, label, children },
    };
  }

  return null;
}

export function getDefaultNavigation(): NavigationItem[] {
  return [
    {
      id: 'default-home',
      label: { en: 'Home', fr: 'Accueil' },
      type: 'link',
      linkType: 'builtin',
      builtinPage: 'home',
    },
    {
      id: 'default-collections',
      label: { en: 'Collections', fr: 'Collectes' },
      type: 'link',
      linkType: 'builtin',
      builtinPage: 'collections',
    },
    {
      id: 'default-events',
      label: { en: 'Events', fr: 'Activités' },
      type: 'link',
      linkType: 'builtin',
      builtinPage: 'events',
    },
    {
      id: 'default-news',
      label: { en: 'News', fr: 'Avis' },
      type: 'link',
      linkType: 'builtin',
      builtinPage: 'news',
    },
    {
      id: 'default-facilities',
      label: { en: 'Facilities', fr: 'Installations' },
      type: 'link',
      linkType: 'builtin',
      builtinPage: 'facilities',
    },
  ];
}
