// Script to add a test road closure to Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Copy values from Firebase Console > Project Settings
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
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
