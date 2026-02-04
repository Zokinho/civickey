# CivicKey Website Builder — Complete Specification

## Project Context

CivicKey is a bilingual (FR/EN) municipal services platform for Quebec municipalities. It currently includes:
- **Mobile App** (React Native + Expo) — for residents
- **Admin Console** (React + Vite) — for municipal staff
- **Backend** (Firebase — Firestore, Auth, Storage)

This spec adds a **Website Builder** that generates municipal websites from the same data, with zero extra work for municipalities.

---

## Goals

1. **One admin console, two outputs** — data entered once appears in both app and website
2. **Zero-touch deployment** — sales team enables website with a toggle, it's live instantly
3. **Custom domains** — municipalities can use their own domain (e.g., `www.ville.saint-lazare.qc.ca`)
4. **Simple custom pages** — municipalities can add pages like Taxes, Library, Bylaws without coding
5. **Minimal maintenance** — no per-municipality code, one template serves all

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN CONSOLE                           │
│  (existing — add website settings + custom pages)           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   FIRESTORE DATABASE                        │
│  municipalities/{id}/                                       │
│    ├── config, colors, logo, website settings               │
│    ├── zones, data/schedule                                 │
│    ├── events, alerts, facilities                           │
│    └── pages (NEW — custom content pages)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   MOBILE APP    │     │    WEBSITE      │
│   (existing)    │     │  (NEW — Next.js)│
└─────────────────┘     └─────────────────┘
```

---

## Part 1: Website Template (Next.js)

### Tech Stack
- **Framework:** Next.js 14+ with App Router
- **Styling:** Tailwind CSS with CSS variables for municipality colors
- **Hosting:** Vercel (free tier supports 50 custom domains)
- **Data:** Firebase Firestore (read-only from website)
- **Rendering:** ISR (Incremental Static Regeneration) — rebuilds when data changes

### Routing Strategy

**Multi-tenant via subdomain OR custom domain:**

```
Request: saint-lazare.civickey.ca
         OR www.ville.saint-lazare.qc.ca
              │
              ▼
┌─────────────────────────────────────────┐
│  Middleware: lookup municipality by     │
│  subdomain or custom domain             │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Load municipality config from Firestore│
│  Apply colors, logo, branding           │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Render requested page                  │
└─────────────────────────────────────────┘
```

### URL Structure

```
/                       → Home (alerts, next collections, upcoming events)
/collections            → Collection schedule by zone
/events                 → Events list
/events/[id]            → Event detail page
/facilities             → Facilities list
/facilities/[slug]      → Facility detail page
/news                   → Alerts/announcements list
/[pageSlug]             → Custom pages (taxes, library, bylaws, etc.)
```

### Auto-Generated Pages (From Existing Firestore Data)

| Page | Data Source | Notes |
|------|-------------|-------|
| Home | alerts + events + schedule | Shows banner alerts, next 3 collections, next 3 events |
| /collections | `data/schedule` + `zones` | Full schedule with zone selector |
| /events | `events/*` | List sorted by date |
| /events/[id] | `events/{id}` | Full event details |
| /facilities | `facilities/*` | List with photos, grouped by type |
| /facilities/[slug] | `facilities/{id}` | Full details: photo, hours, address, map link |
| /news | `alerts/*` | Announcements sorted by date |

**No admin work needed** — these pages generate automatically from existing data.

---

## Part 2: Custom Pages

### Page Types (6 Total)

#### 1. Text Page
**Use for:** Library, Public Safety, About, Drinking Water

**Fields:**
```javascript
{
  type: "text",
  slug: "library",
  titleFr: "Bibliothèque",
  titleEn: "Library",
  contentFr: "<p>Rich text content...</p>",
  contentEn: "<p>Rich text content...</p>",
  featuredImage: "https://storage.../image.jpg",  // optional
  contactPhone: "450-424-8000",                   // optional
  contactEmail: "biblio@ville.qc.ca",             // optional
  contactHours: "Lun-Ven: 10h-20h",               // optional
  showInMenu: true,
  menuOrder: 5,
  status: "published"
}
```

#### 2. Info Card Page
**Use for:** Taxes, Permits, Parking (services with multiple options/steps)

**Fields:**
```javascript
{
  type: "infocard",
  slug: "taxes",
  titleFr: "Taxes municipales",
  titleEn: "Municipal Taxes",
  introFr: "Plusieurs options de paiement...",
  introEn: "Several payment options...",
  cards: [
    {
      titleFr: "Paiement en ligne",
      titleEn: "Online Payment",
      contentFr: "1. Accédez à votre compte bancaire...",
      contentEn: "1. Access your bank account...",
      icon: "credit-card"
    },
    {
      titleFr: "Paiement par la poste",
      titleEn: "Payment by Mail",
      contentFr: "Envoyez votre chèque à...",
      contentEn: "Send your cheque to...",
      icon: "mail"
    }
  ],
  showInMenu: true,
  menuOrder: 2,
  status: "published"
}
```

#### 3. PDF/Documents Page
**Use for:** Bylaws, Forms, Maps, Official Documents

**Fields:**
```javascript
{
  type: "pdf",
  slug: "bylaws",
  titleFr: "Règlements municipaux",
  titleEn: "Municipal Bylaws",
  descriptionFr: "Consultez les règlements en vigueur.",
  descriptionEn: "View current bylaws.",
  documents: [
    {
      titleFr: "Règlement de zonage",
      titleEn: "Zoning Bylaw",
      url: "https://storage.../zonage-2024.pdf",
      year: 2024
    },
    {
      titleFr: "Règlement sur les animaux",
      titleEn: "Animal Bylaw",
      url: "https://storage.../animaux-2023.pdf",
      year: 2023
    }
  ],
  showInMenu: true,
  menuOrder: 8,
  status: "published"
}
```

#### 4. Council/Team Page
**Use for:** Municipal Council, Department Heads

**Fields:**
```javascript
{
  type: "council",
  slug: "council",
  titleFr: "Conseil municipal",
  titleEn: "Municipal Council",
  members: [
    {
      name: "Robert Bherer",
      roleFr: "Maire",
      roleEn: "Mayor",
      photo: "https://storage.../maire.jpg",
      email: "maire@ville.qc.ca",
      phone: "450-424-8000"
    },
    {
      name: "Marie Tremblay",
      roleFr: "Conseillère, District 1",
      roleEn: "Councillor, District 1",
      photo: "https://storage.../tremblay.jpg",
      email: "mtremblay@ville.qc.ca"
    }
  ],
  showInMenu: true,
  menuOrder: 10,
  status: "published"
}
```

#### 5. Links Page
**Use for:** Useful Links, External Resources, Quick Access

**Fields:**
```javascript
{
  type: "links",
  slug: "useful-links",
  titleFr: "Liens utiles",
  titleEn: "Useful Links",
  categories: [
    {
      nameFr: "Services municipaux",
      nameEn: "Municipal Services",
      links: [
        {
          titleFr: "Demande de permis en ligne",
          titleEn: "Online Permit Application",
          url: "https://pg-solutions.../permits",
          icon: "clipboard"
        },
        {
          titleFr: "Inscription aux activités",
          titleEn: "Activity Registration",
          url: "https://inscription.ville.qc.ca",
          icon: "calendar"
        }
      ]
    },
    {
      nameFr: "Urgences",
      nameEn: "Emergencies",
      links: [
        {
          titleFr: "Urgence: 911",
          titleEn: "Emergency: 911",
          url: "tel:911",
          icon: "phone"
        }
      ]
    }
  ],
  showInMenu: true,
  menuOrder: 15,
  status: "published"
}
```

#### 6. Contact Page
**Use for:** Contact Us, Department Directory

**Fields:**
```javascript
{
  type: "contact",
  slug: "contact",
  titleFr: "Nous joindre",
  titleEn: "Contact Us",
  mainAddress: {
    street: "1960, chemin Sainte-Angélique",
    city: "Saint-Lazare",
    province: "QC",
    postal: "J7T 2Y2",
    phone: "450-424-8000",
    fax: "450-424-8001",
    email: "info@ville.saint-lazare.qc.ca"
  },
  hours: "Lundi au vendredi: 8h30 à 12h, 13h à 16h30",
  departments: [
    {
      nameFr: "Urbanisme et permis",
      nameEn: "Urban Planning and Permits",
      phone: "450-424-8000 poste 200",
      email: "urbanisme@ville.qc.ca"
    },
    {
      nameFr: "Taxes et finances",
      nameEn: "Taxes and Finance",
      phone: "450-424-8000 poste 100",
      email: "finances@ville.qc.ca"
    },
    {
      nameFr: "Loisirs et culture",
      nameEn: "Recreation and Culture",
      phone: "450-424-8000 poste 220",
      email: "loisirs@ville.qc.ca"
    }
  ],
  showInMenu: true,
  menuOrder: 20,
  status: "published"
}
```

### Firestore Structure for Custom Pages

```
municipalities/{id}/pages/{pageId}
{
  type: "text" | "infocard" | "pdf" | "council" | "links" | "contact",
  slug: "library",
  titleFr: "...",
  titleEn: "...",
  showInMenu: true,
  menuOrder: 5,
  menuSection: "services" | "city",  // Which dropdown it appears in
  status: "published" | "draft",
  createdAt: timestamp,
  updatedAt: timestamp,
  // ... type-specific fields
}
```

---

## Part 3: Website Settings & Custom Domains

### Firestore: Website Configuration

Add to `municipalities/{id}`:

```javascript
{
  // ... existing config fields ...
  
  website: {
    enabled: true,
    subdomain: "saint-lazare",                     // saint-lazare.civickey.ca
    
    // Custom domain
    customDomain: "www.ville.saint-lazare.qc.ca",  // null if not using
    customDomainVerified: true,                    // DNS verified?
    
    // Branding
    heroTaglineFr: "Bienvenue à Saint-Lazare",
    heroTaglineEn: "Welcome to Saint-Lazare",
    heroImage: "https://storage.../hero.jpg",      // null for default
    
    // Footer
    footerAddress: "1960, chemin Sainte-Angélique",
    footerPhone: "450-424-8000",
    footerEmail: "info@ville.saint-lazare.qc.ca",
    footerFacebook: "https://facebook.com/villesaintlazare",
    footerTwitter: null,
    footerInstagram: null,
    mainWebsiteUrl: "https://ville.saint-lazare.qc.ca",  // If keeping old site
    
    // Navigation
    menuItems: {
      services: ["taxes", "permits", "animals", "library"],  // page slugs
      city: ["council", "bylaws", "careers", "contact"]
    }
  }
}
```

### Admin Console: Website Settings UI

```
┌─────────────────────────────────────────────────────────────┐
│  WEBSITE SETTINGS                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GENERAL                                                    │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [✓] Enable Website                                         │
│                                                             │
│  Default URL: https://saint-lazare.civickey.ca              │
│               [Copy Link]                                   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  CUSTOM DOMAIN (Optional)                                   │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Domain: [www.ville.saint-lazare.qc.ca_______________]      │
│                                                             │
│  Status: ✅ Verified and Active                             │
│          ⏳ Pending DNS verification (check again)          │
│          ❌ DNS not configured                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📋 DNS INSTRUCTIONS                                │   │
│  │                                                     │   │
│  │  Add this record to your DNS provider:              │   │
│  │                                                     │   │
│  │  Type:  CNAME                                       │   │
│  │  Name:  www                                         │   │
│  │  Value: cname.vercel-dns.com                        │   │
│  │                                                     │   │
│  │  [Copy Instructions]  [Send to IT]                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  HERO SECTION                                               │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Tagline (FR): [Bienvenue à Saint-Lazare_____________]      │
│  Tagline (EN): [Welcome to Saint-Lazare______________]      │
│                                                             │
│  Hero Image:  [Upload]  [Use Default]                       │
│               [Current: hero.jpg - 245 KB]                  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  FOOTER                                                     │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Address:  [1960, chemin Sainte-Angélique____________]      │
│  Phone:    [450-424-8000_____________________________]      │
│  Email:    [info@ville.saint-lazare.qc.ca____________]      │
│                                                             │
│  Social Media:                                              │
│  Facebook: [https://facebook.com/villesaintlazare____]      │
│  Twitter:  [________________________________________]       │
│  Instagram:[________________________________________]       │
│                                                             │
│                              [Cancel]  [Save Settings]      │
└─────────────────────────────────────────────────────────────┘
```

### Custom Domain Workflow

**Step 1: Sales team enters domain in admin console**
```
Domain: www.ville.rigaud.qc.ca
```

**Step 2: System displays DNS instructions**
```
┌─────────────────────────────────────────────────────────────┐
│  To connect your domain, add this DNS record:               │
│                                                             │
│  Type:  CNAME                                               │
│  Name:  www                                                 │
│  Value: cname.vercel-dns.com                                │
│                                                             │
│  If using root domain (ville.rigaud.qc.ca without www):     │
│  Type:  A                                                   │
│  Name:  @                                                   │
│  Value: 76.76.21.21                                         │
└─────────────────────────────────────────────────────────────┘
```

**Step 3: Send instructions to municipality**

Email template (auto-generated):
```
Subject: Configuration DNS pour votre site CivicKey

Bonjour,

Votre nouveau site web CivicKey est prêt!

Il est actuellement accessible à:
https://rigaud.civickey.ca

Pour utiliser votre domaine (www.ville.rigaud.qc.ca), 
veuillez demander à votre fournisseur DNS d'ajouter 
cet enregistrement:

Type:  CNAME
Nom:   www
Valeur: cname.vercel-dns.com

Une fois configuré (généralement 5-30 minutes), votre 
site sera accessible à votre adresse habituelle.

Questions? Répondez à ce courriel.

L'équipe CivicKey
```

**Step 4: Municipality updates DNS** (5-30 min on their end)

**Step 5: System verifies DNS**

```javascript
// Verification logic
async function verifyCustomDomain(domain) {
  try {
    // Check if CNAME points to Vercel
    const response = await fetch(
      `https://dns.google/resolve?name=${domain}&type=CNAME`
    );
    const data = await response.json();
    
    const isValid = data.Answer?.some(record => 
      record.data.includes('vercel') || 
      record.data.includes('civickey')
    );
    
    if (isValid) {
      // Add domain to Vercel via API
      await addDomainToVercel(domain);
      // Update Firestore
      await updateDoc(municipalityRef, {
        'website.customDomainVerified': true
      });
    }
    
    return isValid;
  } catch (error) {
    return false;
  }
}
```

**Step 6: Done** — SSL auto-provisioned by Vercel, domain is live

### Vercel API Integration

```javascript
// Add custom domain to Vercel project
async function addDomainToVercel(domain) {
  const response = await fetch(
    `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
}

// Remove domain from Vercel
async function removeDomainFromVercel(domain) {
  await fetch(
    `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
      },
    }
  );
}
```

---

## Part 4: Navigation Structure

### Website Header

```
┌────────────────────────────────────────────────────────────────────────┐
│  [Logo]  Saint-Lazare                                                  │
│                                                                        │
│  Accueil   Collectes   Événements   Services ▼   La Ville ▼   FR|EN   │
└────────────────────────────────────────────────────────────────────────┘
```

### Dropdown Menus

**Services dropdown** (custom pages with `menuSection: "services"`):
```
┌─────────────────────┐
│ Taxes               │  → /taxes
│ Permis              │  → /permits  
│ Animaux             │  → /animals
│ Stationnement       │  → /parking
│ Eau potable         │  → /water
│ Sécurité publique   │  → /safety
│ Bibliothèque        │  → /library
│ Liens utiles        │  → /useful-links
└─────────────────────┘
```

**La Ville dropdown** (custom pages with `menuSection: "city"`):
```
┌─────────────────────┐
│ Conseil municipal   │  → /council
│ Règlements          │  → /bylaws
│ Emplois             │  → /careers
│ Plans et cartes     │  → /maps
│ Nous joindre        │  → /contact
│ À propos            │  → /about
└─────────────────────┘
```

### Auto-Generated Menu

Menu is built from:
1. Fixed items: Home, Collections, Events, Facilities, News
2. Custom pages: sorted by `menuOrder`, grouped by `menuSection`

```javascript
function buildNavigation(pages) {
  const services = pages
    .filter(p => p.menuSection === 'services' && p.showInMenu && p.status === 'published')
    .sort((a, b) => a.menuOrder - b.menuOrder);
    
  const city = pages
    .filter(p => p.menuSection === 'city' && p.showInMenu && p.status === 'published')
    .sort((a, b) => a.menuOrder - b.menuOrder);
    
  return { services, city };
}
```

---

## Part 5: Styling & Theming

### CSS Variables (Set Per Municipality)

```css
:root {
  /* From municipalities/{id}.colors */
  --color-primary: #0D5C63;      /* config.colors.primary */
  --color-secondary: #E07A5F;    /* config.colors.secondary */
  --color-background: #F5F0E8;   /* config.colors.background */
  
  /* Derived colors */
  --color-primary-dark: /* darken(primary, 10%) */;
  --color-primary-light: /* lighten(primary, 10%) */;
  --color-text: #1A1A2E;
  --color-text-muted: #5A6C7D;
  --color-border: #E8E4DC;
}
```

### Applying Theme in Next.js

```javascript
// app/[municipality]/layout.js
export default async function MunicipalityLayout({ children, params }) {
  const config = await getMunicipalityConfig(params.municipality);
  
  const themeStyles = {
    '--color-primary': config.colors.primary,
    '--color-secondary': config.colors.secondary,
    '--color-background': config.colors.background,
  };
  
  return (
    <html style={themeStyles}>
      <body>
        <Header logo={config.logo} name={config.name} />
        <main>{children}</main>
        <Footer config={config.website} />
      </body>
    </html>
  );
}
```

---

## Part 6: Bilingual Support

### Language Toggle

- Default: French (fr-CA)
- Toggle in header: `FR | EN`
- Language stored in cookie/localStorage
- All content has FR and EN versions

### Content Rendering

```javascript
function LocalizedContent({ contentFr, contentEn }) {
  const { language } = useLanguage(); // 'fr' or 'en'
  return <div>{language === 'fr' ? contentFr : contentEn}</div>;
}
```

### Static Text (UI Labels)

```javascript
// i18n/fr.json
{
  "nav.home": "Accueil",
  "nav.collections": "Collectes",
  "nav.events": "Événements",
  "nav.facilities": "Installations",
  "nav.services": "Services",
  "nav.city": "La Ville",
  "collections.next": "Prochaine collecte",
  "events.upcoming": "Événements à venir",
  "facilities.hours": "Heures d'ouverture",
  "footer.contact": "Nous joindre"
}

// i18n/en.json
{
  "nav.home": "Home",
  "nav.collections": "Collections",
  "nav.events": "Events",
  "nav.facilities": "Facilities",
  "nav.services": "Services",
  "nav.city": "The City",
  "collections.next": "Next collection",
  "events.upcoming": "Upcoming events",
  "facilities.hours": "Hours of operation",
  "footer.contact": "Contact us"
}
```

---

## Part 7: Development Phases

### Phase 1: Core Website (7-8 days)

| Task | Time |
|------|------|
| Next.js project setup with Vercel | 0.5 day |
| Firestore integration (read-only) | 0.5 day |
| Middleware for multi-tenant routing | 1 day |
| Auto-generated pages (Home, Collections, Events, Facilities, News) | 3 days |
| Event and Facility detail pages | 1 day |
| Theming with municipality colors | 0.5 day |
| Bilingual support | 0.5 day |
| Mobile responsive design | 0.5 day |
| Deploy to Vercel with subdomain | 0.5 day |

**Deliverable:** Websites live at `{municipality}.civickey.ca`

### Phase 2: Admin Console Updates (3-4 days)

| Task | Time |
|------|------|
| Website Settings section | 1 day |
| Custom Pages list + CRUD | 1.5 days |
| Page type editors (6 types) | 1 day |
| Image upload for facilities (if not present) | 0.5 day |

**Deliverable:** Admins can manage website settings and custom pages

### Phase 3: Custom Pages on Website (2-3 days)

| Task | Time |
|------|------|
| Text Page renderer | 0.5 day |
| Info Card Page renderer | 0.5 day |
| PDF Page renderer | 0.25 day |
| Council Page renderer | 0.25 day |
| Links Page renderer | 0.25 day |
| Contact Page renderer | 0.25 day |
| Dynamic navigation from pages | 0.5 day |
| Testing all page types | 0.5 day |

**Deliverable:** Custom pages render on website

### Phase 4: Custom Domains (2-3 days)

| Task | Time |
|------|------|
| Domain field in admin console | 0.5 day |
| DNS instructions display | 0.5 day |
| Domain verification checker | 0.5 day |
| Vercel API integration | 1 day |
| Testing with real domain | 0.5 day |

**Deliverable:** Municipalities can use their own domains

### Total: 14-18 days

---

## Part 8: Sales Team Workflow

### Onboarding a New Municipality

**Time required:** 15-30 minutes

1. **Create municipality in admin console**
   - Enter name, slug (e.g., "rigaud")
   - Upload logo
   - Set colors

2. **Add core data**
   - Collection schedule and zones
   - Facilities (with photos)
   - Upcoming events (if any)

3. **Enable website**
   - Toggle "Enable Website" → ON
   - Site is instantly live at `rigaud.civickey.ca`

4. **Add custom pages** (optional, can do later)
   - Taxes, Permits, Library, Council, etc.

5. **Custom domain** (if they want it)
   - Enter their domain: `www.ville.rigaud.qc.ca`
   - Send DNS instructions to their IT
   - Wait for DNS propagation (5 min - 24 hours)
   - Verify → Done

### Timeline

| Step | Who | Time |
|------|-----|------|
| Create municipality + core data | Sales team | 15-30 min |
| Enable website | Sales team | 1 click |
| Add custom pages | Sales team | 30-60 min |
| Custom domain setup | Sales team | 5 min |
| DNS update | Municipality IT | 5-30 min |
| DNS propagation | Automatic | 5 min - 24 hours |

---

## Part 9: File Structure

### Website (Next.js)

```
civickey-website/
├── app/
│   ├── layout.js                    # Root layout
│   ├── middleware.js                # Multi-tenant routing
│   ├── [locale]/
│   │   ├── layout.js                # Language layout
│   │   ├── page.js                  # Home page
│   │   ├── collections/
│   │   │   └── page.js              # Schedule page
│   │   ├── events/
│   │   │   ├── page.js              # Events list
│   │   │   └── [id]/page.js         # Event detail
│   │   ├── facilities/
│   │   │   ├── page.js              # Facilities list
│   │   │   └── [slug]/page.js       # Facility detail
│   │   ├── news/
│   │   │   └── page.js              # Alerts list
│   │   └── [pageSlug]/
│   │       └── page.js              # Custom pages
├── components/
│   ├── Header.jsx
│   ├── Footer.jsx
│   ├── Navigation.jsx
│   ├── LanguageToggle.jsx
│   ├── pages/
│   │   ├── TextPage.jsx
│   │   ├── InfoCardPage.jsx
│   │   ├── PdfPage.jsx
│   │   ├── CouncilPage.jsx
│   │   ├── LinksPage.jsx
│   │   └── ContactPage.jsx
│   └── ui/
│       ├── Card.jsx
│       ├── Button.jsx
│       └── ...
├── lib/
│   ├── firebase.js                  # Firebase config (read-only)
│   ├── municipalities.js            # Firestore queries
│   └── i18n.js                      # Translation helpers
├── i18n/
│   ├── fr.json
│   └── en.json
└── styles/
    └── globals.css                  # Tailwind + CSS variables
```

### Admin Console Additions

```
admin/src/
├── pages/
│   ├── WebsiteSettings.jsx          # NEW
│   ├── CustomPages.jsx              # NEW
│   └── CustomPageEditor.jsx         # NEW
└── components/
    └── page-editors/
        ├── TextPageEditor.jsx       # NEW
        ├── InfoCardPageEditor.jsx   # NEW
        ├── PdfPageEditor.jsx        # NEW
        ├── CouncilPageEditor.jsx    # NEW
        ├── LinksPageEditor.jsx      # NEW
        └── ContactPageEditor.jsx    # NEW
```

---

## Part 10: Environment Variables

### Website (Vercel)

```env
# Firebase (read-only access)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=civickey-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...

# Vercel (for domain management)
VERCEL_API_TOKEN=...
VERCEL_PROJECT_ID=...

# Domain
NEXT_PUBLIC_BASE_DOMAIN=civickey.ca
```

### Admin Console

```env
# Existing Firebase config...

# Vercel API (for domain management)
VITE_VERCEL_API_TOKEN=...
VITE_VERCEL_PROJECT_ID=...
```

---

## Summary

| Feature | Description |
|---------|-------------|
| **Auto-generated pages** | Home, Collections, Events, Facilities, News — from existing Firestore data |
| **Custom pages** | 6 page types: Text, Info Card, PDF, Council, Links, Contact |
| **Facility photos** | Image upload in admin, displays in app and website |
| **Theming** | Municipality colors applied automatically |
| **Bilingual** | FR/EN toggle, all content in both languages |
| **Subdomains** | Instant: `municipality.civickey.ca` |
| **Custom domains** | `www.ville.xyz.qc.ca` with DNS instructions |
| **Admin workflow** | Enable website with toggle, add pages as needed |
| **Development time** | 14-18 days total |
