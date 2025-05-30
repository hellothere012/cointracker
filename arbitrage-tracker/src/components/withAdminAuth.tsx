'use client';

import { useEffect } from 'react';
import { useAuth } from '../lib/authContext'; // AppUser removed from import
import { useRouter } from 'next/navigation';
import React from 'react';

const withAdminAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const ComponentWithAdminAuth = (props: P) => {
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && (!currentUser || !currentUser.isAdmin)) {
        // If not loading, and user is not logged in or not an admin
        console.log('Access denied: User not admin or not logged in. Redirecting...');
        router.replace('/dashboard'); // Or '/login' or a specific 'access-denied' page
      }
    }, [currentUser, loading, router]);

    if (loading) {
      return <p className="text-center text-xl font-semibold mt-20">Loading user data...</p>;
    }

    if (!currentUser || !currentUser.isAdmin) {
      // Render nothing or a redirect message while router effect takes place
      // This helps prevent flashing the protected content
      return <p className="text-center text-xl font-semibold mt-20">Redirecting...</p>;
    }

    return <WrappedComponent {...props} />;
  };

  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  ComponentWithAdminAuth.displayName = `withAdminAuth(${displayName})`;

  return ComponentWithAdminAuth;
};

export default withAdminAuth;
