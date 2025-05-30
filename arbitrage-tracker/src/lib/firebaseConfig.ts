// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app"; // Corrected getApp import
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Added for Firestore instance

// Firebase configuration using Environment Variables
// Ensure these are set in your .env.local file (for local development)
// or in your Vercel deployment environment variables.
const firebaseConfig = {
  apiKey: "AIzaSyDts10GlTmzayc3V7Lmwr9qYrIi8roKE48",
  authDomain: "gold-and-silver-coin-tracker.firebaseapp.com",
  projectId: "gold-and-silver-coin-tracker",
  storageBucket: "gold-and-silver-coin-tracker.firebasestorage.app",
  messagingSenderId: "240219499856",
  appId: "1:240219499856:web:c416182c15ea9aeccad055"
  };

// Add a check for missing configuration in development
if (process.env.NODE_ENV === 'development') {
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([key, value]) => !value)
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
