# Code Review: CivicKey Website Builder Implementation

**Reviewer:** Claude Code
**Date:** 2026-02-03
**Scope:** All new and modified files across website builder, admin console, and Firestore rules

---

## CRITICAL Issues

### 1. Domains API has no authentication
**File:** `civickey-website-builder/src/app/api/domains/route.ts`
**Lines:** 6-81
**Issue:** The `/api/domains` endpoint accepts any POST request without authentication. Anyone who knows the URL can add/remove domains from the Vercel project.
**Fix:** Add authentication middleware (e.g., check for a shared secret header, or validate Firebase auth token).

### 2. `.env.local` contains production Firebase config and is not gitignored at repo root
**File:** `civickey-website-builder/.env.local`
**Issue:** While `.env.local` is in the website builder's `.gitignore`, the `git status` from the repo root shows `civickey-website-builder/` as untracked. When this directory is added, the `.gitignore` inside it should prevent `.env.local` from being committed, but verify before committing.
**Fix:** Verify `git add civickey-website-builder/` does NOT stage `.env.local`. Also add `civickey-website-builder/.env.local` to the root `.gitignore` as a safeguard.

---

## HIGH Issues

### 3. TextPageEditor stores contact info at wrong nesting level
**File:** `admin/src/components/page-editors/TextPageEditor.jsx`
**Lines:** 74, 84
**Issue:** The editor saves phone/email as `content.phone` and `content.email` (flat), but the TypeScript type `PageContent` defines them as `content.contactInfo.phone` and `content.contactInfo.email` (nested). The website `TextPage.tsx` renderer reads from `content?.contactInfo?.phone` — so the data written by the admin editor will never be displayed on the website.
**Fix:** Change TextPageEditor to write to `contactInfo.phone` and `contactInfo.email` using `updateNested('contactInfo', 'phone', value)`.

### 4. Custom domain middleware path doesn't actually rewrite
**File:** `civickey-website-builder/src/middleware.ts`
**Lines:** 52-58
**Issue:** When a custom domain is detected, the middleware creates a `NextResponse.next()` and sets a header, but the response is never returned — execution falls through to the `if (!municipalityId)` check at line 61 which returns a _different_ `NextResponse.next()` without the custom header. The `x-custom-hostname` header is lost.
**Fix:** Return the response with the custom header immediately, or implement actual rewriting by querying Firestore for the municipality ID in middleware (use edge-compatible Firestore SDK or a cache).

### 5. No Firestore composite index for pages queries
**File:** `civickey-website-builder/src/lib/municipalities.ts`
**Lines:** 99-110
**Issue:** `getPages()` uses `orderBy('menuOrder')` and `getPublishedPages()` uses `where('status', '==', 'published')`. The `getPageBySlug()` uses `where('slug', '==', slug)` AND `where('status', '==', 'published')` which requires a composite index. These will fail at runtime until the indexes are created in Firebase.
**Fix:** Create the required composite indexes in Firebase Console or add a `firestore.indexes.json` file. Also, `getPublishedPages()` currently has no `orderBy` so pages may appear in random order.

### 6. Slug uniqueness not enforced
**File:** `admin/src/pages/CustomPageEditor.jsx`
**Lines:** 79-80
**Issue:** The slug field is sanitized but never checked for uniqueness. Two pages can have the same slug, and the website builder will just pick whichever Firestore returns first.
**Fix:** Before saving, query for existing pages with the same slug and reject duplicates.

### 7. Collections page is client-side only — loses ISR benefits
**File:** `civickey-website-builder/src/app/[municipalityId]/[locale]/collections/page.tsx`
**Issue:** This page uses `'use client'` and `useEffect` for data fetching, meaning it makes Firebase calls from the browser on every page load. All other pages use server-side data fetching with ISR. This means: (a) slower initial load, (b) Firebase SDK shipped to client bundle (34.5 kB vs ~0.2 kB for other pages), (c) exposes Firestore directly to client.
**Fix:** Refactor to server component with ISR like the other pages. Use a client component only for the zone selector interaction.

---

## MEDIUM Issues

### 8. Admin WebsiteSettings doesn't update municipalityConfig in context
**File:** `admin/src/pages/WebsiteSettings.jsx`
**Line:** 77
**Issue:** After saving, `updateDoc()` updates Firestore directly, but the `municipalityConfig` in AuthContext is stale until page refresh. If the user navigates away and back, they'll see old data until the entire page refreshes.
**Fix:** After successful save, either reload the municipality config from context or call a refresh function.

### 9. Missing `key` stability in list editors
**Files:** All page editors using `index` as key (`InfoCardPageEditor.jsx:72`, `LinksPageEditor.jsx:67`, `CouncilPageEditor.jsx`, etc.)
**Issue:** Using array index as React key can cause state issues when reordering or deleting items. InfoCardPageEditor has reorder functionality, so this can cause visual glitches.
**Fix:** Add unique IDs to each item when created (e.g., `id: Date.now()`).

### 10. Hardcoded English strings in admin pages
**Files:** `WebsiteSettings.jsx`, `CustomPages.jsx`, `CustomPageEditor.jsx`
**Issue:** All admin UI labels are hardcoded in English ("Website Settings", "Save Settings", "Page Content", etc.). The existing admin console pages (Events.jsx, etc.) also use hardcoded English, so this is consistent with the current pattern — but it violates the CLAUDE.md bilingual requirement.
**Note:** This is consistent with existing code. Flag for future i18n of admin console.

### 11. WebsiteSettings page exceeds 200-line component limit
**File:** `admin/src/pages/WebsiteSettings.jsx`
**Lines:** 344 lines
**Issue:** Exceeds the 200-line component limit from CLAUDE.md. The component handles general settings, hero section, footer info, and custom domain in a single component.
**Fix:** Extract into sub-components: `HeroSettingsCard`, `FooterSettingsCard`, `DomainSettingsCard`.

### 12. No image validation on hero upload
**File:** `admin/src/pages/WebsiteSettings.jsx`
**Lines:** 86-98
**Issue:** The hero image upload accepts any file matching `image/*` with no size limit. A 50MB image would be uploaded and served as the hero.
**Fix:** Add file size validation (e.g., max 5MB).

### 13. `getPublishedPages` missing orderBy causes inconsistent nav order
**File:** `civickey-website-builder/src/lib/municipalities.ts`
**Lines:** 105-110
**Issue:** `getPublishedPages()` has `where('status', '==', 'published')` but no `orderBy`, so pages appear in Firestore's default order (by document ID), not by `menuOrder`.
**Fix:** Add `orderBy('menuOrder', 'asc')` (requires composite index with the status filter).

---

## LOW Issues

### 14. i18n keys missing for event categories
**Files:** `src/i18n/fr.json`, `src/i18n/en.json`
**Issue:** Event categories ("community", "workshop", "family", "municipal") are displayed raw in EventCard badges and EventList filter buttons, not translated.

### 15. No favicon
**File:** `civickey-website-builder/`
**Issue:** No `favicon.ico` or `app/icon.tsx` exists. Browser will show default icon.

### 16. Navigation dropdown relies on CSS hover (not accessible)
**File:** `civickey-website-builder/src/components/Navigation.tsx`
**Issue:** The `DropdownNav` uses `group-hover:` CSS for visibility. This doesn't work for keyboard navigation and isn't fully accessible.
**Fix:** Add click-to-toggle with `aria-expanded` for accessibility.

### 17. Date formatting locale strings inconsistent
**File:** `civickey-website-builder/src/components/EventCard.tsx` uses `fr-CA`/`en-CA`
**Issue:** Minor — but `locale === 'fr' ? 'fr-CA' : 'en-CA'` is repeated in multiple files. Could be a utility function.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2     |
| High     | 5     |
| Medium   | 6     |
| Low      | 4     |
| **Total** | **17** |

### Top Priority Fixes
1. Add authentication to the domains API endpoint
2. Fix TextPageEditor contactInfo nesting mismatch
3. Fix middleware custom domain response flow
4. Create Firestore composite indexes for pages queries
5. Add slug uniqueness validation
