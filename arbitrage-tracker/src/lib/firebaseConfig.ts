// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app"; // Corrected getApp import
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Added for Firestore instance

// Firebase configuration using Environment Variables
// Ensure these are set in your .env.local file (for local development)
// or in your Vercel deployment environment variables.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Add a check for missing configuration in development
if (process.env.NODE_ENV === 'development') {
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([_key, value]) => !value) // Prefixed unused key with _
    .map(([key]) => key);
  if (missingKeys.length > 0) {
    console.warn(`Firebase config is missing the following keys (check your .env.local file): ${missingKeys.join(', ')}`);
  }
}

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // Use getApp() if already initialized
}

const auth = getAuth(app);
const db = getFirestore(app); // Export Firestore instance

export { app, auth, db };
