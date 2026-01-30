// Firestore seeding script for CivicKey
// Run this script to create initial data for Saint-Lazare and the super-admin
//
// Usage:
// 1. Make sure you have Node.js installed
// 2. Run: node scripts/seed-firestore.js
//
// Note: This script uses the Firebase Admin SDK and requires a service account key.
// Download it from Firebase Console > Project Settings > Service Accounts

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Your Firebase config - same as admin console
const firebaseConfig = {
  apiKey: "REDACTED",
  authDomain: "REDACTED_AUTH_DOMAIN",
  projectId: "civickey-prod",
  storageBucket: "REDACTED_STORAGE_BUCKET",
  messagingSenderId: "REDACTED_SENDER_ID",
  appId: "1:REDACTED_SENDER_ID:web:28806abe5d16d574532f2b",
  measurementId: "REDACTED_MEASUREMENT_ID"
};

// Your super-admin credentials - UPDATE THESE BEFORE RUNNING
const ADMIN_EMAIL = 'your-email@example.com';
const ADMIN_PASSWORD = 'your-password';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function seedFirestore() {
  console.log('Starting Firestore seeding...\n');

  try {
    // 0. Sign in as super-admin
    console.log('0. Signing in as super-admin...');
    const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('   Signed in as:', userCredential.user.email);
    console.log('   UID:', userCredential.user.uid);

    // 1. Super-admin record already created manually
    console.log('\n1. Super-admin record already exists (created manually)');

    // 2. Create Saint-Lazare municipality
    console.log('\n2. Creating Saint-Lazare municipality...');
    await setDoc(doc(db, 'municipalities', 'saint-lazare'), {
      name: 'Saint-Lazare',
      nameEn: 'Saint-Lazare',
      nameFr: 'Saint-Lazare',
      province: 'QC',
      population: 21000,
      logo: null,
      colors: {
        primary: '#0D5C63',
        secondary: '#E07A5F',
        background: '#F5F0E8'
      },
      contact: {
        phone: '450-424-8000',
        email: 'info@ville.saint-lazare.qc.ca',
        website: 'https://ville.saint-lazare.qc.ca'
      },
      active: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('   Municipality created: saint-lazare');

    // 3. Create zones for Saint-Lazare
    console.log('\n3. Creating zones...');
    await setDoc(doc(db, 'municipalities', 'saint-lazare', 'zones', 'east'), {
      name: 'East Sector',
      nameEn: 'East Sector',
      nameFr: 'Secteur Est',
      description: {
        en: 'East of Chemin Sainte-Angelique',
        fr: 'Est du Chemin Sainte-Angelique'
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('   Zone created: east');

    await setDoc(doc(db, 'municipalities', 'saint-lazare', 'zones', 'west'), {
      name: 'West Sector',
      nameEn: 'West Sector',
      nameFr: 'Secteur Ouest',
      description: {
        en: 'West of Chemin Sainte-Angelique',
        fr: 'Ouest du Chemin Sainte-Angelique'
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('   Zone created: west');

    // 4. Create schedule data
    console.log('\n4. Creating schedule data...');
    await setDoc(doc(db, 'municipalities', 'saint-lazare', 'data', 'schedule'), {
      collectionTypes: [
        {
          id: 'recycling',
          name: { en: 'Recycling', fr: 'Recyclage' },
          binName: { en: 'Blue Bin', fr: 'Bac bleu' },
          color: '#2E86AB',
          icon: 'recycle'
        },
        {
          id: 'compost',
          name: { en: 'Compost', fr: 'Compost' },
          binName: { en: 'Brown Bin', fr: 'Bac brun' },
          color: '#8B5A2B',
          icon: 'leaf'
        },
        {
          id: 'garbage',
          name: { en: 'Garbage', fr: 'Ordures' },
          binName: { en: 'Black Bin', fr: 'Bac noir' },
          color: '#4A4A4A',
          icon: 'trash'
        }
      ],
      schedules: {
        east: {
          recycling: { dayOfWeek: 2, frequency: 'weekly' }, // Tuesday
          compost: { dayOfWeek: 4, frequency: 'weekly' },   // Thursday
          garbage: { dayOfWeek: 4, frequency: 'biweekly' }  // Thursday, every 2 weeks
        },
        west: {
          recycling: { dayOfWeek: 3, frequency: 'weekly' }, // Wednesday
          compost: { dayOfWeek: 5, frequency: 'weekly' },   // Friday
          garbage: { dayOfWeek: 5, frequency: 'biweekly' }  // Friday, every 2 weeks
        }
      },
      guidelines: {
        timing: {
          en: 'Put out bins by 7:00 AM on collection day.',
          fr: 'Sortir les bacs avant 7h00 le jour de collecte.'
        },
        position: {
          en: ['Lid closed', 'Handle facing your home', 'Leave 1m between bins'],
          fr: ['Couvercle ferme', 'Poignee face a votre maison', 'Laisser 1m entre les bacs']
        }
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('   Schedule data created');

    // 5. Create sample alert
    console.log('\n5. Creating sample alert...');
    const alertRef = doc(collection(db, 'municipalities', 'saint-lazare', 'alerts'));
    await setDoc(alertRef, {
      title: {
        en: 'Welcome to CivicKey!',
        fr: 'Bienvenue sur CivicKey!'
      },
      message: {
        en: 'This is your new waste collection app. Set up notifications to never miss a collection day.',
        fr: 'Ceci est votre nouvelle application de collecte. Configurez les notifications pour ne jamais manquer un jour de collecte.'
      },
      type: 'info',
      active: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('   Sample alert created');

    // 6. Create sample event
    console.log('\n6. Creating sample event...');
    const eventRef = doc(collection(db, 'municipalities', 'saint-lazare', 'events'));
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    await setDoc(eventRef, {
      title: {
        en: 'Household Hazardous Waste Collection',
        fr: 'Collecte de residus domestiques dangereux'
      },
      description: {
        en: 'Bring your household hazardous waste (paint, batteries, chemicals) to the municipal garage.',
        fr: 'Apportez vos residus domestiques dangereux (peinture, piles, produits chimiques) au garage municipal.'
      },
      date: nextMonth.toISOString().split('T')[0],
      time: '09:00',
      endTime: '16:00',
      location: 'Municipal Garage / Garage municipal',
      address: '1960 Chemin Sainte-Angelique, Saint-Lazare, QC',
      category: 'municipal',
      ageGroup: 'all',
      residentsOnly: true,
      maxParticipants: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('   Sample event created');

    console.log('\n========================================');
    console.log('Seeding completed successfully!');
    console.log('========================================');
    console.log('\nNext steps:');
    console.log('1. Deploy Firestore rules: firebase deploy --only firestore:rules');
    console.log('2. Deploy Storage rules: firebase deploy --only storage:rules');
    console.log('3. Test login at your admin console');
    console.log('4. Test the mobile app');

  } catch (error) {
    console.error('Error seeding Firestore:', error);
    process.exit(1);
  }
}

// Run the seeding
seedFirestore().then(() => {
  console.log('\nScript completed.');
  process.exit(0);
});
