# CivicKey Code Standards

## Project Overview
Bilingual (French/English) waste collection app for Quebec municipalities. React Native + Firebase.

## Firebase Projects
- **Dev**: civickey-c9737
- **Prod**: civickey-prod

## Critical Rules

### Security
- Never commit API keys or secrets
- Validate all user input before Firestore writes
- Use Firebase Security Rules for all collections

### Bilingual (Quebec Requirement)
- All UI text must use i18n — no hardcoded strings
- Support en-CA and fr-CA locales
- Test both languages before merging

### Code Quality
- TypeScript strict mode
- Components < 200 lines
- Handle loading and error states

## PR Checklist
- [ ] No hardcoded strings
- [ ] No exposed secrets
- [ ] Works in French and English
- [ ] Error states handled

## Roadmap: Website Builder

### Business Model
CivicKey is a small enterprise — the website builder is a premium done-for-you service, not a self-serve tool. Municipalities pay a substantial fee and we build their site for them.

### Technical Approach
1. **API Layer**: Expose admin console data (events, announcements, schedules, special collections, facilities) via a public read-only API
2. **Website Templates**: Simple, professional templates that consume the API — not highly customizable
3. **Manual Build**: We build each municipality's site using their data; they manage content through the existing admin console

### Why This Approach
- Faster to market (no complex editor to build)
- Higher perceived value (white-glove service)
- Simpler maintenance (fewer moving parts)
- Revenue from setup fees, not just subscriptions

### Implementation Notes
- API endpoints should mirror existing Firestore structure
- Websites are static/SSG where possible (fast, cheap hosting)
- Same data powers mobile app + website — single source of truth


"What Goes Where" Feature (Où ça va?)
Overview
Upgrade existing free-text bin descriptions into a structured, searchable item database. Residents search "styrofoam" → get instant answer (which bin + optional note). Builds on existing bin/collection data in admin console.
Firestore Data Model
New subcollection: municipalities/{municipalityId}/wasteItems/{itemId}
javascript{
  id: "auto-generated",
  nameFr: "Boîte de pizza",
  nameEn: "Pizza box",
  binId: "recyclage",               // references existing bin/collection type ID
  noteFr: "Doit être propre",       // optional
  noteEn: "Must be clean",          // optional
  searchTerms: ["boite de pizza", "pizza box", "carton pizza"],  // normalized, no accents
  createdAt: Timestamp,
  updatedAt: Timestamp
}
Normalize function (shared between admin + app):
javascriptfunction normalizeText(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}
searchTerms is auto-generated from nameFr + nameEn (normalized). Admins can add custom aliases.
Admin Console Changes
1. Global "What Goes Where" page (new sidebar entry):

Table of ALL items across all bins — sortable, filterable by bin type
Add/edit/delete items. Each item: nameFr, nameEn, bin selector, noteFr, noteEn, aliases (optional)

2. Per-bin item list:

Inside existing bin editor, add "Accepted Items" section below current fields
Shows items assigned to that bin. Can add/edit/delete from here too
Do NOT remove existing free-text description fields — they still display on schedule screen

3. Quebec starter template import:

Hardcoded JSON at admin/src/data/quebec-waste-template.json (~100 items)
One-click "Import Quebec Template" button on the global items page
On import: auto-match template categories (recyclage/ordures/compost/ecocentre) to municipality's actual bin types by name similarity
If can't auto-match, show mapping UI (dropdown per category)
Skip duplicates (match by normalized nameFr)

Template categories: ~30 recyclage, ~25 compost, ~25 ordures, ~20 écocentre items. Common Quebec household items with FR/EN names, notes, and aliases.
Mobile App Changes
Search bar on Collections screen — prominent, above the collection schedule:

Placeholder: "Où va...?" / "Where does... go?"
Tapping opens full-screen search overlay with keyboard
Live client-side filtering as user types (min 2 chars)
Results show: item name (FR/EN), bin color + name, note if any
Tap result to expand and show full note
No results: "Contact your municipality" message with contact info if available
Hide search bar entirely if municipality has 0 wasteItems

Data loading:

Fetch all wasteItems on mount, cache locally (AsyncStorage or in-memory)
Re-fetch if cache >24h old. No per-keystroke network calls
Even 300 items is ~30KB — client-side search is instant

Search algorithm: prefix match prioritized over substring match on searchTerms array. Bilingual — typing "battery" in English still finds "Piles" because both are in searchTerms.
i18n keys to add:

search.placeholder, search.noResults, search.noResultsHelp, search.minChars, search.title

File Structure
Admin:

admin/src/data/quebec-waste-template.json — starter template
admin/src/pages/WasteItems.jsx — global management page
admin/src/components/waste-items/WasteItemTable.jsx — sortable table
admin/src/components/waste-items/WasteItemModal.jsx — add/edit modal
admin/src/components/waste-items/WasteItemImport.jsx — template import + bin mapping
admin/src/components/waste-items/WasteItemPerBin.jsx — embedded in bin editor
admin/src/utils/textNormalize.js

App:

app/src/components/waste-search/WasteSearchBar.jsx
app/src/components/waste-search/WasteSearchOverlay.jsx
app/src/components/waste-search/WasteSearchResult.jsx
app/src/hooks/useWasteItems.js — fetch + cache + search
app/src/utils/textNormalize.js
app/src/screens/CollectionsScreen.jsx — MODIFIED to include search bar

Firestore Rules
Match existing admin auth pattern. Residents: read-only. Admins: full CRUD.
Edge Cases

0 items: hide search bar in app
Duplicate names across bins: allowed (e.g. "pizza box" in recyclage if clean, compost if greasy). Show both results
Bin deleted after items imported: show warning in admin for orphaned items
Accent-insensitive: normalizeText handles it
Cross-language search: always searches all searchTerms regardless of app language setting