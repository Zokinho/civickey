# CivicKey Website Builder - Technical Plan

## Overview

A section-based website builder for municipalities that integrates seamlessly with the existing CivicKey ecosystem (admin console + mobile app).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FIREBASE                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Firestore   │  │   Storage    │  │     Auth     │          │
│  │  (Database)  │  │   (Images)   │  │   (Login)    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CivicKey API Layer                          │
│         (Firebase Functions / Next.js API Routes)                │
│                                                                  │
│  /api/v1/municipalities/:id/events                              │
│  /api/v1/municipalities/:id/announcements                       │
│  /api/v1/municipalities/:id/collections                         │
│  /api/v1/municipalities/:id/site-config                         │
│  /api/v1/municipalities/:id/pages                               │
└─────────┬─────────────────┬─────────────────┬───────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
    ┌───────────┐    ┌───────────┐    ┌───────────┐
    │  Mobile   │    │   Admin   │    │  Website  │
    │    App    │    │  Console  │    │  Builder  │
    │  (Expo)   │    │  (React)  │    │  (Next.js)│
    └───────────┘    └───────────┘    └───────────┘
```

---

## Firestore Data Structure

### Existing Collections (No Changes)
```
municipalities/{municipalityId}
  - name: { en, fr }
  - slug: "mascouche"
  - theme: { primaryColor, secondaryColor }

municipalities/{municipalityId}/announcements/{id}
municipalities/{municipalityId}/events/{id}
municipalities/{municipalityId}/schedule
```

### New Collections for Website Builder

```
municipalities/{municipalityId}/siteConfig
  - domain: "mascouche.civickey.ca" or "ville.mascouche.qc.ca"
  - published: true/false
  - favicon: "url"
  - logo: "url"
  - socialLinks: { facebook, twitter, instagram }
  - contactInfo: { phone, email, address }
  - footerText: { en, fr }
  - analyticsId: "GA-XXXXX" (optional)

municipalities/{municipalityId}/pages/{pageId}
  - slug: "home" | "services" | "contact" | etc.
  - title: { en, fr }
  - isHomepage: true/false
  - isPublished: true/false
  - order: 1
  - sections: [
      {
        id: "section-1",
        type: "hero",
        config: { ... }
      },
      {
        id: "section-2",
        type: "events-feed",
        config: { ... }
      }
    ]

municipalities/{municipalityId}/navigation
  - items: [
      { label: { en, fr }, pageId: "xxx", order: 1 },
      { label: { en, fr }, url: "https://external.com", order: 2 }
    ]
```

---

## Section/Widget Types

### 1. Hero Section
```javascript
{
  type: "hero",
  config: {
    style: "full-width" | "split" | "centered",
    backgroundImage: "url",
    backgroundColor: "#hex",
    title: { en: "Welcome", fr: "Bienvenue" },
    subtitle: { en: "...", fr: "..." },
    ctaButton: {
      text: { en, fr },
      link: "/services",
      style: "primary" | "secondary"
    }
  }
}
```

### 2. Announcements Feed (Pulls from existing data)
```javascript
{
  type: "announcements-feed",
  config: {
    title: { en: "Latest News", fr: "Dernières nouvelles" },
    limit: 5,
    showImages: true,
    layout: "list" | "grid" | "carousel"
  }
}
// Data pulled automatically from municipalities/{id}/announcements
```

### 3. Events Calendar (Pulls from existing data)
```javascript
{
  type: "events-feed",
  config: {
    title: { en: "Upcoming Events", fr: "Événements à venir" },
    limit: 6,
    layout: "list" | "grid" | "calendar",
    showCategories: true,
    filterByCategory: null | "workshop" | "community"
  }
}
// Data pulled automatically from municipalities/{id}/events
```

### 4. Collection Schedule Widget (Pulls from existing data)
```javascript
{
  type: "collection-schedule",
  config: {
    title: { en: "Waste Collection", fr: "Collecte des déchets" },
    showZoneSelector: true,
    showNextPickups: true,
    limit: 3
  }
}
// Data pulled from municipalities/{id}/schedule
```

### 5. Quick Links / Service Tiles
```javascript
{
  type: "quick-links",
  config: {
    title: { en: "Services", fr: "Services" },
    layout: "grid-3" | "grid-4" | "list",
    items: [
      {
        icon: "trash" | "calendar" | "phone" | "document" | "custom-url",
        title: { en: "Waste Collection", fr: "Collecte" },
        description: { en: "...", fr: "..." },
        link: "/collections" | "https://..."
      }
    ]
  }
}
```

### 6. Alert Banner
```javascript
{
  type: "alert-banner",
  config: {
    style: "info" | "warning" | "urgent",
    message: { en: "...", fr: "..." },
    link: "/page",
    dismissible: true,
    active: true
  }
}
```

### 7. Contact Section
```javascript
{
  type: "contact",
  config: {
    title: { en: "Contact Us", fr: "Contactez-nous" },
    showMap: true,
    showForm: true,
    showInfo: true,
    formFields: ["name", "email", "phone", "message"],
    formDestination: "email" | "formspree"
  }
}
```

### 8. Rich Text / Content Block
```javascript
{
  type: "content",
  config: {
    content: {
      en: "<h2>About Us</h2><p>...</p>",
      fr: "<h2>À propos</h2><p>...</p>"
    },
    backgroundColor: "#fff",
    maxWidth: "narrow" | "medium" | "wide"
  }
}
```

### 9. Image Gallery
```javascript
{
  type: "gallery",
  config: {
    title: { en: "Gallery", fr: "Galerie" },
    layout: "grid" | "masonry" | "carousel",
    images: [
      { url: "...", alt: { en, fr }, caption: { en, fr } }
    ]
  }
}
```

### 10. CTA Banner
```javascript
{
  type: "cta-banner",
  config: {
    backgroundColor: "#primary",
    title: { en: "Download CivicKey", fr: "Téléchargez CivicKey" },
    subtitle: { en: "...", fr: "..." },
    buttons: [
      { text: "App Store", link: "...", icon: "apple" },
      { text: "Google Play", link: "...", icon: "android" }
    ]
  }
}
```

---

## API Design

### Public API (Read-only, for websites)

```
GET /api/v1/municipalities/:slug
  → Returns municipality info + theme

GET /api/v1/municipalities/:slug/site
  → Returns siteConfig + navigation + pages list

GET /api/v1/municipalities/:slug/pages/:pageSlug
  → Returns page with all sections

GET /api/v1/municipalities/:slug/events
  ?limit=10&upcoming=true&category=workshop
  → Returns events (for events-feed widget)

GET /api/v1/municipalities/:slug/announcements
  ?limit=5&active=true
  → Returns announcements (for announcements-feed widget)

GET /api/v1/municipalities/:slug/schedule
  → Returns collection schedule (for collection-schedule widget)
```

### Admin API (Authenticated, for admin console)

```
POST   /api/v1/admin/pages
PUT    /api/v1/admin/pages/:id
DELETE /api/v1/admin/pages/:id

PUT    /api/v1/admin/site-config
PUT    /api/v1/admin/navigation

POST   /api/v1/admin/upload  (for images)
```

### API Response Example

```json
// GET /api/v1/municipalities/mascouche/pages/home
{
  "id": "abc123",
  "slug": "home",
  "title": { "en": "Home", "fr": "Accueil" },
  "sections": [
    {
      "id": "hero-1",
      "type": "hero",
      "config": { ... }
    },
    {
      "id": "announcements-1",
      "type": "announcements-feed",
      "config": { "limit": 5 },
      "data": [
        // Pre-fetched announcements
        { "id": "...", "title": { "en": "...", "fr": "..." }, ... }
      ]
    },
    {
      "id": "events-1",
      "type": "events-feed",
      "config": { "limit": 6 },
      "data": [
        // Pre-fetched events
        { "id": "...", "title": { "en": "...", "fr": "..." }, ... }
      ]
    }
  ]
}
```

---

## Admin Console Integration

### New "Website" Tab in Admin Console

```
Sidebar:
├── Dashboard
├── Collection Schedule
├── Announcements
├── Events
└── Website (NEW)
    ├── Pages
    ├── Navigation
    ├── Theme & Branding
    └── Settings
```

### Page Editor UI

```
┌─────────────────────────────────────────────────────────────────┐
│  Page: Home                                    [Preview] [Save] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────┐  ┌──────────────┐ │
│  │                                         │  │ Add Section  │ │
│  │  [Hero Section]              [Edit][×]  │  │              │ │
│  │  Welcome to Mascouche                   │  │ ○ Hero       │ │
│  │                                         │  │ ○ News Feed  │ │
│  ├─────────────────────────────────────────┤  │ ○ Events     │ │
│  │                                         │  │ ○ Collection │ │
│  │  [Announcements Feed]        [Edit][×]  │  │ ○ Quick Links│ │
│  │  Showing 5 latest                       │  │ ○ Contact    │ │
│  │                                         │  │ ○ Content    │ │
│  ├─────────────────────────────────────────┤  │ ○ Gallery    │ │
│  │                                         │  │ ○ CTA Banner │ │
│  │  [Events Feed]               [Edit][×]  │  │ ○ Alert      │ │
│  │  Showing 6 upcoming                     │  │              │ │
│  │                                         │  └──────────────┘ │
│  ├─────────────────────────────────────────┤                   │
│  │                                         │                   │
│  │  [+ Add Section]                        │                   │
│  │                                         │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Website Rendering (Next.js)

### Folder Structure
```
civickey-sites/
├── app/
│   ├── [municipality]/
│   │   ├── page.tsx           # Homepage
│   │   ├── [slug]/
│   │   │   └── page.tsx       # Dynamic pages
│   │   └── layout.tsx         # Municipality layout
│   └── api/
│       └── v1/
│           └── ...            # API routes
├── components/
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── AnnouncementsFeed.tsx
│   │   ├── EventsFeed.tsx
│   │   ├── CollectionSchedule.tsx
│   │   ├── QuickLinks.tsx
│   │   ├── Contact.tsx
│   │   ├── Content.tsx
│   │   ├── Gallery.tsx
│   │   ├── CtaBanner.tsx
│   │   └── AlertBanner.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   └── ui/
│       └── ...
└── lib/
    ├── firebase.ts
    └── api.ts
```

### Section Renderer
```tsx
// components/SectionRenderer.tsx
import Hero from './sections/Hero';
import AnnouncementsFeed from './sections/AnnouncementsFeed';
import EventsFeed from './sections/EventsFeed';
// ... etc

const sectionComponents = {
  'hero': Hero,
  'announcements-feed': AnnouncementsFeed,
  'events-feed': EventsFeed,
  'collection-schedule': CollectionSchedule,
  'quick-links': QuickLinks,
  'contact': Contact,
  'content': Content,
  'gallery': Gallery,
  'cta-banner': CtaBanner,
  'alert-banner': AlertBanner,
};

export function SectionRenderer({ section }) {
  const Component = sectionComponents[section.type];
  if (!Component) return null;
  return <Component config={section.config} data={section.data} />;
}
```

---

## Hosting Options

### Option 1: Subdomains (Recommended for MVP)
- mascouche.civickey.ca
- terrebonne.civickey.ca
- All sites on single Next.js deployment
- Simpler SSL management

### Option 2: Custom Domains (Later)
- ville.mascouche.qc.ca
- Requires DNS configuration per municipality
- Firebase Hosting supports custom domains

---

## Implementation Phases

### Phase 1: Foundation (2 weeks)
- [ ] Set up Next.js project for websites
- [ ] Create API layer (Firebase Functions or Next.js API)
- [ ] Build basic section components (Hero, Content, QuickLinks)
- [ ] Set up municipality routing

### Phase 2: Data Integration (1 week)
- [ ] AnnouncementsFeed widget (pulls from existing data)
- [ ] EventsFeed widget (pulls from existing data)
- [ ] CollectionSchedule widget (pulls from existing data)

### Phase 3: Admin Integration (2 weeks)
- [ ] Add "Website" section to admin console
- [ ] Page management UI
- [ ] Section editor UI
- [ ] Navigation editor
- [ ] Theme/branding settings

### Phase 4: Polish (1 week)
- [ ] Responsive design for all sections
- [ ] Bilingual support (EN/FR toggle)
- [ ] SEO optimization
- [ ] Performance optimization

### Phase 5: Launch (1 week)
- [ ] Security review
- [ ] Testing with pilot municipality
- [ ] Documentation
- [ ] Deployment

---

## Security Considerations

1. **API Security**
   - Rate limiting on public endpoints
   - Admin endpoints require Firebase Auth token
   - Validate municipality access (admin can only edit their own)

2. **Content Security**
   - Sanitize HTML in content blocks (prevent XSS)
   - Validate image uploads (type, size)
   - Content Security Policy headers

3. **Access Control**
   - Admin roles per municipality
   - Audit log for changes

---

## Cost Estimate

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| Firebase Firestore | 50K reads/day | $0 (within free tier for MVP) |
| Firebase Hosting | 10GB storage, 360MB/day transfer | $0 (within free tier) |
| Firebase Functions | 2M invocations/month | $0 (within free tier) |
| Vercel (if using Next.js) | 100GB bandwidth | $0 (hobby) or $20/mo (pro) |

**Total MVP cost: $0 - $20/month**

As traffic grows, costs scale but remain reasonable for municipal budgets.

---

## Decisions Made

1. **Domain Strategy**: Subdomain style (`mascouche.civickey.ca`) as default, with support for custom domains municipalities already own.

2. **User Roles**: Yes - Admin (full access) + Editor (content only)

3. **Preview Mode**: Yes - required before publishing

4. **Revision History**: Yes - with rollback capability

---

## Custom Domain Support

### Default: CivicKey Subdomain
```
mascouche.civickey.ca
terrebonne.civickey.ca
```
- Automatic SSL via Firebase Hosting
- No configuration needed by municipality

### Optional: Custom Domain
```
ville.mascouche.qc.ca → points to CivicKey
www.terrebonne.ca → points to CivicKey
```

**Setup Process:**
1. Municipality provides their domain in admin console
2. System generates DNS instructions:
   - CNAME record: `www` → `civickey-sites.web.app`
   - Or A record for apex domain
   - TXT record for verification
3. Municipality adds records in their DNS provider
4. System verifies and provisions SSL

**Firestore Structure:**
```javascript
municipalities/{id}/siteConfig: {
  defaultDomain: "mascouche.civickey.ca",  // always available
  customDomain: "ville.mascouche.qc.ca",   // optional
  customDomainVerified: true,
  customDomainSSL: true,
  primaryDomain: "custom" | "default"      // which to use as canonical
}
```

---

## User Roles & Permissions

### Role: Admin
- Full access to all features
- Can manage users (invite editors, remove access)
- Can publish/unpublish pages
- Can edit site settings (domain, branding)
- Can delete pages
- Can restore from revision history

### Role: Editor
- Can create and edit page content
- Can upload images
- Can save drafts
- **Cannot** publish (requires admin approval)
- **Cannot** edit site settings
- **Cannot** manage users
- **Cannot** delete pages

### Firestore Structure
```javascript
municipalities/{id}/users/{userId}: {
  email: "editor@mascouche.ca",
  role: "admin" | "editor",
  name: "Jean Tremblay",
  addedAt: timestamp,
  addedBy: "admin-user-id"
}
```

### Admin Console UI
```
Settings → Team Management

┌─────────────────────────────────────────────────────────────┐
│ Team Members                              [+ Invite User]   │
├─────────────────────────────────────────────────────────────┤
│ Email                    │ Role    │ Added      │ Actions   │
├──────────────────────────┼─────────┼────────────┼───────────┤
│ admin@mascouche.ca       │ Admin   │ Jan 1      │ (you)     │
│ editor1@mascouche.ca     │ Editor  │ Jan 15     │ [Remove]  │
│ editor2@mascouche.ca     │ Editor  │ Jan 20     │ [Remove]  │
└─────────────────────────────────────────────────────────────┘
```

---

## Preview Mode

### How It Works
1. Editor makes changes to a page
2. Changes are saved as a **draft** (not published)
3. Editor clicks "Preview" → opens preview URL
4. Preview URL: `mascouche.civickey.ca/preview/home?token=xyz123`
5. When ready, admin clicks "Publish"

### Firestore Structure
```javascript
municipalities/{id}/pages/{pageId}: {
  slug: "home",
  title: { en: "Home", fr: "Accueil" },

  // Published version (what visitors see)
  published: {
    sections: [...],
    publishedAt: timestamp,
    publishedBy: "user-id"
  },

  // Draft version (work in progress)
  draft: {
    sections: [...],
    updatedAt: timestamp,
    updatedBy: "user-id"
  },

  // Status
  status: "published" | "draft" | "pending-review",
  hasPendingChanges: true
}
```

### Admin Console UI
```
Page Editor

┌────────────────────────────────────────────────────────────────┐
│  Page: Home                                                    │
│  Status: ● Has unpublished changes                             │
│                                                                │
│  [Save Draft]  [Preview]  [Request Review]  [Publish] (admin)  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  (page content...)                                             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Workflow
```
Editor Flow:
  Edit → Save Draft → Preview → Request Review

Admin Flow:
  Review → Preview → Publish (or Request Changes)
```

---

## Revision History

### What's Saved
- Every time a page is **published**, a revision is created
- Stores complete page state (all sections)
- Keeps last 20 revisions per page

### Firestore Structure
```javascript
municipalities/{id}/pages/{pageId}/revisions/{revisionId}: {
  version: 5,
  sections: [...],          // complete snapshot
  publishedAt: timestamp,
  publishedBy: "user-id",
  publishedByName: "Jean Tremblay",
  changeNote: "Updated hero image"  // optional
}
```

### Admin Console UI
```
Page: Home → Revision History

┌─────────────────────────────────────────────────────────────────┐
│ Revision History                                                │
├─────────────────────────────────────────────────────────────────┤
│ Version │ Date         │ Published By    │ Note       │ Action │
├─────────┼──────────────┼─────────────────┼────────────┼────────┤
│ v5      │ Jan 22, 10am │ Jean Tremblay   │ Hero image │ Current│
│ v4      │ Jan 20, 3pm  │ Marie Dubois    │ Events     │[Restore]│
│ v3      │ Jan 15, 9am  │ Jean Tremblay   │ -          │[Restore]│
│ v2      │ Jan 10, 2pm  │ Jean Tremblay   │ Layout     │[Restore]│
│ v1      │ Jan 5, 11am  │ Admin           │ Initial    │[Restore]│
└─────────────────────────────────────────────────────────────────┘

[Compare v5 with v4]  [View v4]
```

### Restore Flow
1. Admin clicks "Restore" on a previous version
2. Confirmation: "Restore to version 4? This will become a new draft."
3. Previous version is loaded into draft
4. Admin can preview, then publish

---

## Development Approach: Concierge MVP

### Strategy
Instead of building the full web editor first, we use a "concierge MVP" approach:
1. **You build each municipality's site manually** using config files
2. Municipalities manage content via the **existing admin console** (events, announcements, collections)
3. Website pulls from the same Firestore data automatically
4. Build the self-serve editor later, informed by real usage patterns

### Benefits
- **3 weeks to market** instead of 10
- Lower risk (can pivot based on feedback)
- Learn what municipalities actually need
- "White glove" service feels premium
- Revenue while building the editor

### Phase 1: Concierge MVP (3 weeks)
- [ ] Next.js site with all widgets
- [ ] API pulling from existing Firestore data
- [ ] Manual config file per municipality
- [ ] You build each site (~1 hour per municipality)

### Phase 2: Sell & Learn (ongoing)
- [ ] Onboard first 10-20 municipalities
- [ ] Document common requests
- [ ] Refine widgets based on feedback

### Phase 3: Build Editor (when needed ~15-20 customers)
- [ ] Build editor based on real usage patterns
- [ ] Migrate manual configs to Firestore
- [ ] Self-serve for new customers

---

## Final Decisions

1. **Forms**: Integrate with ticketing system (not just email)

2. **Email Notifications**: Yes - notify admins when editors request review

3. **Page-level Permissions**: Not needed

---

## Pricing Structure (6 Tiers)

### Pricing Table

| Tier | Population | Setup Fee | Monthly | Annual (15% off) | Year 1 Total |
|------|------------|-----------|---------|------------------|--------------|
| **Essential** | < 5,000 | $750 | $129/mo | $1,315/yr | $2,065 |
| **Starter** | 5,000 - 10,000 | $1,000 | $189/mo | $1,930/yr | $2,930 |
| **Growth** | 10,000 - 30,000 | $1,750 | $289/mo | $2,950/yr | $4,700 |
| **Professional** | 30,000 - 75,000 | $2,750 | $449/mo | $4,580/yr | $7,330 |
| **Enterprise** | 75,000 - 150,000 | $5,000 | $799/mo | $8,150/yr | $13,150 |
| **Enterprise Plus** | 150,000+ | $7,500 | $1,199/mo | $12,230/yr | $19,730 |

### Features by Tier

| Feature | Essential | Starter | Growth | Professional | Enterprise | Enterprise+ |
|---------|:---------:|:-------:|:------:|:------------:|:----------:|:-----------:|
| Custom website | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mobile app listing | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin console | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Events & Announcements | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Collection schedules | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bilingual (EN/FR) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| SSL + Hosting | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| CivicKey subdomain | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Custom domain | - | - | ✓ | ✓ | ✓ | ✓ |
| Ticketing system | - | - | ✓ | ✓ | ✓ | ✓ |
| Admin users | 1 | 1 | 3 | 5 | 10 | Unlimited |
| Editor users | - | 1 | 2 | 5 | 15 | Unlimited |
| Priority support | - | - | - | ✓ | ✓ | ✓ |
| Dedicated success mgr | - | - | - | - | ✓ | ✓ |
| Custom integrations | - | - | - | - | 1 | 3 |
| SLA (response time) | - | - | - | - | 24 hours | 4 hours |
| Onboarding call | 15 min | 30 min | 45 min | 1 hour | 1.5 hours | 2 hours |
| Training sessions | - | - | 1 | 1 | 2 | 4 |
| Site revisions (setup) | 1 | 2 | 3 | 5 | 10 | Unlimited |
| API access | - | - | - | - | ✓ | ✓ |

### For Municipal Budget Proposals

```
ESSENTIAL (Villages < 5K)
  Setup: $750 | Annual: $1,315 | Year 1: $2,065

STARTER (Small Towns 5-10K)
  Setup: $1,000 | Annual: $1,930 | Year 1: $2,930

GROWTH (Towns 10-30K)
  Setup: $1,750 | Annual: $2,950 | Year 1: $4,700

PROFESSIONAL (Cities 30-75K)
  Setup: $2,750 | Annual: $4,580 | Year 1: $7,330

ENTERPRISE (Cities 75-150K)
  Setup: $5,000 | Annual: $8,150 | Year 1: $13,150

ENTERPRISE PLUS (Large Cities 150K+)
  Setup: $7,500 | Annual: $12,230 | Year 1: $19,730
```

### Competitive Comparison

| Provider | Year 1 Cost (75K+ city) | Mobile App | Bilingual | Contract |
|----------|-------------------------|:----------:|:---------:|----------|
| CivicPlus | $12,000 - $20,000+ | No | Extra $ | Multi-year |
| Revize | $10,000 - $15,000+ | No | Extra $ | 5-year |
| Granicus | $15,000 - $25,000+ | No | Extra $ | Multi-year |
| **CivicKey Enterprise** | **$13,150** | **Yes** | **Yes** | **None** |

---

## Staffing Plan

### Phase 1: Launch (0-20 customers)
| Role | Who | Cost |
|------|-----|------|
| Technical Support + Sales | You | $0 |
| Development | Claude + contractors | $0-2K/mo |
| **Total** | **1 person** | **$0-2K/mo** |

### Phase 2: Growth (20-50 customers)
| Role | Who | Cost |
|------|-----|------|
| Support + Operations | You | - |
| Part-time Support | Hire #1 | $1.5-2.5K/mo |
| Development | Contractor | $1-3K/mo |
| **Total** | **1.5 people** | **$2.5-5.5K/mo** |

### Phase 3: Scale (50-100+ customers)
| Role | Who | Cost |
|------|-----|------|
| Operations/Sales | You | - |
| Customer Success | Hire #1 (FT) | $4-5K/mo |
| Support Specialist | Hire #2 (FT) | $3-4K/mo |
| Developer | Part-time | $3-5K/mo |
| **Total** | **3-4 people** | **$10-14K/mo** |

---

## Revenue Projections

| Year | Customers | Mix | Annual Revenue |
|------|-----------|-----|----------------|
| Year 1 | 15 | 8 Essential/Starter, 5 Growth, 2 Pro | ~$50,000 |
| Year 2 | 40 | Mixed across tiers | ~$130,000 |
| Year 3 | 80 | Mixed + Enterprise | ~$280,000 |

### Customer Lifetime Value

| Tier | Year 1 | 3-Year | 5-Year |
|------|--------|--------|--------|
| Essential | $2,065 | $4,695 | $7,325 |
| Starter | $2,930 | $6,790 | $10,650 |
| Growth | $4,700 | $10,600 | $16,500 |
| Professional | $7,330 | $16,490 | $25,650 |
| Enterprise | $13,150 | $29,450 | $45,750 |
| Enterprise Plus | $19,730 | $44,190 | $68,650 |

---

## Infrastructure Costs

### With Caching (Recommended)
| Municipalities | Monthly Traffic | Est. Cost |
|----------------|-----------------|-----------|
| 10 | 50K views | **$0-5** |
| 30 | 150K views | **$5-15** |
| 75 | 400K views | **$15-30** |

### Additional Services
| Service | Cost |
|---------|------|
| Email notifications (Resend) | $0-20/mo |
| Ticketing (built-in) | $0 |
| Domain SSL | Included in Firebase |

**Total infrastructure at scale: $20-50/month**
