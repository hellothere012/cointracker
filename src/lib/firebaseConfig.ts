// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Add your own Firebase configuration below
const firebaseConfig = {
  apiKey: "AIzaSyDts10GlTmzayc3V7Lmwr9qYrIi8roKE48",
  authDomain: "gold-and-silver-coin-tracker.firebaseapp.com",
  projectId: "gold-and-silver-coin-tracker",
  storageBucket: "gold-and-silver-coin-tracker.firebasestorage.app",
  messagingSenderId: "240219499856",
  appId: "1:240219499856:web:c416182c15ea9aeccad055"
  };

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);

export { app, auth };
