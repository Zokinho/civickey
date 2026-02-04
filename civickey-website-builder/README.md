# CivicKey Website Builder — Quick Start

## What This Is

A complete specification for adding a **Website Builder** to CivicKey. Give this to Claude Code.

---

## The One-Liner

> "Municipalities enter data once in the admin console → it appears in both the mobile app AND a generated website."

---

## What Gets Built

| Component | Description |
|-----------|-------------|
| **Website Template** | Next.js site that renders any municipality's data |
| **Auto-Generated Pages** | Home, Collections, Events, Facilities, News |
| **Custom Pages** | Taxes, Library, Bylaws, Council, etc. (6 page types) |
| **Subdomain Hosting** | `saint-lazare.civickey.ca` (automatic) |
| **Custom Domains** | `www.ville.saint-lazare.qc.ca` (with DNS setup) |
| **Admin Console Updates** | Website settings, custom page editor |

---

## Development Time

| Phase | Time |
|-------|------|
| Core Website | 7-8 days |
| Admin Console Updates | 3-4 days |
| Custom Pages | 2-3 days |
| Custom Domains | 2-3 days |
| **Total** | **14-18 days** |

---

## Key Files

- `CLAUDE-CODE-SPEC.md` — Full technical specification (give this to Claude Code)

---

## How to Use

### Option 1: Give the Full Spec

Upload `CLAUDE-CODE-SPEC.md` to Claude Code and say:

> "Build the CivicKey Website Builder according to this spec. Start with Phase 1."

### Option 2: Build in Phases

**Phase 1:**
> "Build a Next.js website template for CivicKey that serves all municipalities from one codebase. See Part 1 of the spec."

**Phase 2:**
> "Add website settings and custom page editors to the CivicKey admin console. See Parts 2-3 of the spec."

**Phase 3:**
> "Add custom domain support with Vercel API integration. See Part 3 of the spec."

---

## What Sales Team Does (After It's Built)

1. Create municipality in admin console (15 min)
2. Toggle "Enable Website" → site is live at `xyz.civickey.ca`
3. Add custom pages (Taxes, Library, etc.) as needed
4. If custom domain wanted:
   - Enter domain in admin
   - Send DNS instructions to municipality IT
   - Wait for verification
   - Done

**No developer needed per municipality.**
