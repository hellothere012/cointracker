'use client';

import { useEffect } from 'react';
import { useAuth } from '../lib/authContext'; // Adjusted path
import { useRouter } from 'next/navigation';
import React from 'react';

const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const ComponentWithAuth = (props: P) => {
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !currentUser) {
        router.replace('/login'); // Redirect to login if not authenticated
      }
    }, [currentUser, loading, router]);

    if (loading) {
      return <p className="text-center text-xl font-semibold mt-20">Loading...</p>; // Or a spinner component
    }

    if (!currentUser) {
      return null; // Or a redirecting message, but router.replace should handle it
    }

    return <WrappedComponent {...props} />;
  };

  // Assign a display name for easier debugging
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  ComponentWithAuth.displayName = `withAuth(${displayName})`;

  return ComponentWithAuth;
};

export default withAuth;
