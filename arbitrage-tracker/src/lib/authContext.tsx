'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebaseConfig'; // Import db as well
import { doc, getDoc } from 'firebase/firestore';

// Define our custom user type that includes the isAdmin flag
export interface AppUser extends FirebaseUser {
  isAdmin?: boolean;
}

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, fetch their custom data from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setCurrentUser({
              ...firebaseUser,
              isAdmin: userData.isAdmin === true, // Ensure isAdmin is explicitly true
            });
          } else {
            // No custom user document found, defaults to not admin
            setCurrentUser({ ...firebaseUser, isAdmin: false });
            console.log(`No custom user document found for UID: ${firebaseUser.uid}. Defaulting to non-admin.`);
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          // Handle error (e.g., user still logs in but without custom roles)
          setCurrentUser({ ...firebaseUser, isAdmin: false });
        }
      } else {
        // User is signed out
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
