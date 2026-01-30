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
