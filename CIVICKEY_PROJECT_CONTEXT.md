# CivicKey — Project Context Document

Use this document to get up to speed on the CivicKey project. Feel free to ask me any questions after reading it.

---

## What is CivicKey?

CivicKey is a bilingual (French/English) waste collection and municipal services app for Quebec municipalities. It's a small enterprise — we sell to municipalities as clients.

**Three products:**
1. **Mobile App** — React Native + Expo, for residents to check collection schedules, events, announcements, road closures, and facilities
2. **Admin Console** — React (Vite) web app, for municipal staff to manage their content
3. **Website Builder** (planned) — Done-for-you static websites for municipalities, powered by the same data

**Backend:** Firebase (Firestore, Auth, Storage, Security Rules)

---

## Tech Stack

### Mobile App
- React Native 0.81 + Expo 54
- React 19.1
- React Navigation (bottom tabs + native stack)
- Firebase JS SDK 12.8
- expo-notifications, expo-localization
- AsyncStorage for local persistence

### Admin Console
- React 19.2 + Vite 7
- React Router DOM 7
- Firebase JS SDK 12.8
- No component library — custom CSS

### Firebase
- **Dev project:** civickey-c9737
- **Prod project:** civickey-prod
- Firestore Security Rules with role-based access (super-admin, admin, editor, viewer)
- Storage Security Rules with custom claims
- Auth with custom claims for role management

---

## Architecture

### Firestore Data Model
```
municipalities/{municipalityId}
  ├── zones/{zoneId}          — waste collection zones
  ├── data/{docId}            — schedule/config data
  ├── events/{eventId}        — municipal events
  ├── alerts/{alertId}        — announcements/alerts
  └── facilities/{facilityId} — public facilities (ecocentres, etc.)

admins/{adminId}              — admin user records with role + municipalityId
```

### Role System
- **super-admin**: Full access to everything, all municipalities
- **admin**: Full access within their assigned municipality
- **editor**: Can create/update/delete content (events, alerts, facilities) within their municipality
- **viewer**: Read-only within their municipality

### Mobile App Files
```
App.js                              — Entry point, provider tree, navigation
src/components/ErrorBoundary.js     — Top-level error boundary
src/components/OfflineBanner.js     — Offline state indicator
src/contexts/LanguageContext.js     — i18n (fr-CA / en-CA)
src/contexts/ThemeContext.js        — Light/dark theme
src/firebase/config.js              — Firebase initialization
src/hooks/useAnnouncements.js       — Fetch alerts from Firestore
src/hooks/useEvents.js              — Fetch events from Firestore
src/hooks/useRoadClosures.js        — Fetch road closures
src/hooks/useLanguage.js            — Language hook
src/hooks/useNetworkStatus.js       — Online/offline detection
src/screens/HomeScreen.js           — Main screen (920 lines — needs refactor)
src/screens/ScheduleScreen.js       — Collection schedule
src/screens/EventsScreen.js         — Events list
src/screens/FacilitiesScreen.js     — Facilities list
src/screens/RoadClosuresScreen.js   — Road closures
src/screens/SettingsScreen.js       — User settings
src/screens/WelcomeScreen.js        — Onboarding
src/screens/MunicipalitySelectScreen.js
src/screens/ProvinceSelectScreen.js
src/services/municipalityService.js — Municipality data fetching
src/utils/notifications.js          — Push notification setup
```

### Admin Console Files
```
admin/src/App.jsx                   — Entry point, routes
admin/src/main.jsx                  — React DOM render
admin/src/components/ErrorBoundary.jsx  — Top-level error boundary
admin/src/components/Layout.jsx     — Sidebar + content layout
admin/src/components/LoginPage.jsx  — Admin login
admin/src/components/MunicipalitySwitcher.jsx — Switch active municipality
admin/src/components/ProtectedRoute.jsx — Auth guard
admin/src/contexts/AuthContext.jsx  — Auth state, login/logout, municipality switching
admin/src/firebase/config.js        — Firebase init (primary + secondary auth instance)
admin/src/pages/Dashboard.jsx       — Overview stats
admin/src/pages/Schedule.jsx        — Collection schedule editor (1342 lines — needs refactor)
admin/src/pages/Announcements.jsx   — CRUD for alerts
admin/src/pages/Events.jsx          — CRUD for events
admin/src/pages/RoadClosures.jsx    — CRUD for road closures
admin/src/pages/Facilities.jsx      — CRUD for facilities
admin/src/pages/AdminManagement.jsx — Manage admin users
admin/src/pages/MunicipalityManagement.jsx — Manage municipalities
admin/src/services/adminService.js  — Admin user creation (uses secondary auth)
admin/src/services/municipalityService.js
admin/src/utils/permissions.js      — Role-based permission checks
```

---

## Current State (as of Feb 2026)

### What's Working
- Full mobile app with collection schedules, events, announcements, road closures, facilities
- Full admin console with CRUD for all content types
- Multi-municipality support with role-based access
- Bilingual support in the mobile app (i18n via LanguageContext)
- Firebase Security Rules (Firestore + Storage) with role-based access
- Error Boundaries on both apps
- Input validation on all admin forms before Firestore writes

### Recent Fixes (code audit remediation)
1. **Storage rules security** — Was allowing any authenticated user to write; now uses custom claims for role-based access
2. **Dashboard bug** — Was querying non-existent top-level collections; fixed to use municipality-scoped paths
3. **Admin creation logout** — Creating a new admin logged out the current admin; fixed with secondary auth instance
4. **Auth error disclosure** — Login showed specific errors ("user not found" vs "wrong password"); now shows generic message
5. **Municipality switch race condition** — State could get out of sync; now fetches config before updating state
6. **Error states in hooks** — Mobile data hooks (useEvents, useAnnouncements, useRoadClosures) now expose error state
7. **Input validation** — All admin forms validate before Firestore writes (required fields, length limits, type whitelists)
8. **Unhandled promise rejections** — Fixed 10 missing `await` calls across admin pages
9. **Error Boundaries** — Added to both apps to prevent white screen crashes

### Firebase Custom Claims (set on admin users)
- zopostolovic@gmail.com → role: super-admin, municipalityId: saint-lazare
- zoposto1@gmail.com → role: admin, municipalityId: sainte-adele

---

## Remaining Work (Audit Backlog)

### High Priority
1. **Admin console i18n** — Has zero i18n system. All strings are hardcoded in English. Need to add a translation system and translate everything to French. (CLAUDE.md requires bilingual support.)
2. **Mobile app hardcoded strings** — Some screens still have hardcoded English strings outside the i18n system.

### Medium Priority
3. **Refactor oversized components** — HomeScreen.js (920 lines) and Schedule.jsx (1342 lines) need to be broken down (CLAUDE.md says < 200 lines per component)
4. **Firebase config → environment variables** — API keys are in source code (they're public Firebase keys but still bad practice)
5. **Cloud Function for custom claims** — Currently custom claims must be set manually; should auto-set when admins are created
6. **Pagination on Firestore queries** — All queries fetch entire collections; will break at scale

### Long-term
7. **TypeScript migration** — Everything is JavaScript; CLAUDE.md requires TypeScript strict mode
8. **Deploy storage rules** — Updated rules need to be deployed (Firebase Storage needs to be enabled on the dev project first)

---

## Business Context

### Revenue Model
- Municipalities pay for the mobile app service
- Website builder is a premium add-on (done-for-you, not self-serve)
- Setup fees + subscriptions

### Website Builder Plan
- Expose admin console data via read-only API
- Build simple static/SSG websites per municipality
- Same data powers mobile app + website (single source of truth)
- We build each site; municipalities manage content through admin console

### Current Municipalities
- Saint-Lazare (primary/dev)
- Sainte-Adele

### Waiting On
- Apple Developer Account response (needed for iOS App Store submission)

---

## Code Standards (from CLAUDE.md)
- No hardcoded strings — use i18n
- No exposed secrets
- Bilingual: en-CA and fr-CA
- TypeScript strict mode (aspirational — currently JS)
- Components < 200 lines
- Handle loading and error states
- Validate input before Firestore writes
- Use Firebase Security Rules for all collections
