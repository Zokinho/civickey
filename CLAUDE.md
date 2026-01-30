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
