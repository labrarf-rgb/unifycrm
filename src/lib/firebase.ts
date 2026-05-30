import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Note: This file will be populated with actual values when set_up_firebase succeeds.
// For now, we use placeholders to allow the app to boot and show a friendly message.
let firebaseConfig = {
  apiKey: "placeholder",
  authDomain: "placeholder",
  projectId: "placeholder",
  storageBucket: "placeholder",
  messagingSenderId: "placeholder",
  appId: "placeholder"
};

try {
  // If the file exists, we'll try to load it. 
  // Since we can't reliably load JSON in the agent Turn before it exists, we'll use a dynamic check in the app.
  // This is a safety measure.
} catch (e) {}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const isFirebaseConfigured = () => firebaseConfig.apiKey !== "placeholder";
