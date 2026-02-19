# CivicKey

Bilingual (French/English) waste collection and municipal services app for Quebec municipalities. Residents get collection schedules, event listings, facility info, road closures, and a searchable "What Goes Where" waste sorting guide.

## Tech Stack

- **Mobile App**: React Native + Expo (SDK 54)
- **Admin Console**: React + Vite
- **Backend**: Firebase (Firestore, Auth, Storage, Hosting)
- **Website Builder**: Next.js 14 (multi-tenant, ISR)

## Features

- Collection schedules with zone-based pickup calendars
- "Where does it go?" searchable waste item database
- Municipal events and announcements
- Facilities directory with maps
- Road closures with severity levels
- Push notifications for collection reminders
- Dark mode support
- Full bilingual UI (EN/FR) with i18n

## Project Structure

```
src/                    # Mobile app (React Native/Expo)
  screens/              # Home, Schedule, Events, Facilities, Settings
  components/           # Reusable UI components
  hooks/                # Data fetching hooks
  firebase/             # Firebase config
  i18n/                 # en.json, fr.json

admin/                  # Admin console (React/Vite)
  src/
    pages/              # Dashboard, Schedule, Events, Facilities, Announcements
    components/         # Admin UI components
    firebase/           # Firebase config

civickey-website-builder/  # Municipality websites (Next.js)
```

## Getting Started

```bash
# Mobile app
npm install
npx expo start

# Admin console
cd admin
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase config values from the Firebase Console (Project Settings > Your apps).

## License

Proprietary
