// Script to add a test road closure to Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "REDACTED",
  authDomain: "REDACTED_AUTH_DOMAIN",
  projectId: "civickey-prod",
  storageBucket: "REDACTED_STORAGE_BUCKET",
  messagingSenderId: "REDACTED_SENDER_ID",
  appId: "1:REDACTED_SENDER_ID:web:28806abe5d16d574532f2b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addTestClosure() {
  const municipalityId = 'saint-lazare'; // Change if needed

  const testClosure = {
    title: {
      en: 'Rue Main - Water Main Repair',
      fr: 'Rue Main - Réparation conduite d\'eau'
    },
    description: {
      en: 'Water main repair work in progress. Expect delays. Local traffic only.',
      fr: 'Travaux de réparation de la conduite d\'eau en cours. Attendez-vous à des retards. Circulation locale seulement.'
    },
    location: '123 Rue Main, Saint-Lazare',
    severity: 'partial', // 'full-closure', 'partial', or 'detour'
    status: 'active', // 'active', 'scheduled', or 'completed'
    startDate: '2026-01-28',
    endDate: '2026-02-15',
    imageUrl: '', // Optional - add a map screenshot URL if you have one
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(
      collection(db, 'municipalities', municipalityId, 'roadClosures'),
      testClosure
    );
    console.log('Test road closure added with ID:', docRef.id);
    console.log('Municipality:', municipalityId);
    process.exit(0);
  } catch (error) {
    console.error('Error adding test closure:', error);
    process.exit(1);
  }
}

addTestClosure();
