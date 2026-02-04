import { NextRequest, NextResponse } from 'next/server';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'civickey.ca';

// In-memory cache for custom domain -> municipality mappings
// In production, this is populated by Firestore lookups and cached per edge instance
const domainCache = new Map<string, { municipalityId: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // Skip internal Next.js paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Already rewritten (has municipalityId in path structure)
  if (pathname.match(/^\/[^/]+\/(fr|en)/)) {
    return NextResponse.next();
  }

  let municipalityId: string | null = null;

  // Check for subdomain: {municipality}.civickey.ca
  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    municipalityId = hostname.replace(`.${BASE_DOMAIN}`, '').split('.')[0];
  }
  // Dev: localhost with path-based routing
  else if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 1) {
      municipalityId = segments[0];
      // Already has locale
      if (segments.length >= 2 && (segments[1] === 'fr' || segments[1] === 'en')) {
        return NextResponse.next();
      }
      // Redirect to add locale
      const locale = getLocaleFromRequest(request);
      const restPath = segments.slice(1).join('/');
      const url = request.nextUrl.clone();
      url.pathname = `/${municipalityId}/${locale}${restPath ? '/' + restPath : ''}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  // Custom domain: resolve municipality from Firestore via edge-compatible fetch
  else {
    municipalityId = await resolveCustomDomain(hostname);
    if (!municipalityId) {
      return NextResponse.next();
    }
  }

  if (!municipalityId) {
    return NextResponse.next();
  }

  // Determine locale
  const locale = getLocaleFromRequest(request);

  // Rewrite to internal route: /[municipalityId]/[locale]/...
  const url = request.nextUrl.clone();
  url.pathname = `/${municipalityId}/${locale}${pathname}`;
  return NextResponse.rewrite(url);
}

async function resolveCustomDomain(hostname: string): Promise<string | null> {
  // Check cache first
  const cached = domainCache.get(hostname);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.municipalityId;
  }

  // Query Firestore REST API (edge-compatible, no SDK needed)
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return null;

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'municipalities' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'website.customDomain' },
              op: 'EQUAL',
              value: { stringValue: hostname },
            },
          },
          limit: 1,
        },
      }),
    });

    const results = await resp.json();
    if (Array.isArray(results) && results[0]?.document) {
      const docPath = results[0].document.name as string;
      // Extract municipality ID from document path
      const municipalityId = docPath.split('/').pop() || null;
      if (municipalityId) {
        domainCache.set(hostname, {
          municipalityId,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
      }
      return municipalityId;
    }
  } catch (error) {
    console.error(`[middleware] Custom domain resolution failed for ${hostname}:`, error);
  }

  return null;
}

function getLocaleFromRequest(request: NextRequest): string {
  // Check cookie first
  const localeCookie = request.cookies.get('locale')?.value;
  if (localeCookie === 'en' || localeCookie === 'fr') return localeCookie;

  // Check Accept-Language header
  const acceptLang = request.headers.get('accept-language') || '';
  if (acceptLang.toLowerCase().startsWith('en')) return 'en';

  return 'fr';
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
