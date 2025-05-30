'use client';

import Link from 'next/link';
import { useAuth } from '../../lib/authContext'; // Adjusted path
import { auth } from '../../lib/firebaseConfig'; // Adjusted path
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { currentUser } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error('Logout Error:', error);
      // Optionally show an error message to the user
    }
  };

  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold hover:text-gray-300">
          ArbitrageTracker
        </Link>
        <ul className="flex space-x-4 items-center">
          <li>
            <Link href="/" className="hover:text-gray-300">Home</Link>
          </li>
          {currentUser ? (
            <>
              <li>
                <Link href="/dashboard" className="hover:text-gray-300">Dashboard</Link>
              </li>
              <li>
                <Link href="/inventory" className="hover:text-gray-300">Inventory</Link>
              </li>
              {currentUser && currentUser.isAdmin && ( // Conditional Admin link
                <li>
                  <Link href="/admin" className="text-yellow-400 hover:text-yellow-300">Admin</Link>
                </li>
              )}
              <li>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-md text-sm"
                >
                  Logout
                </button>
              </li>
              {currentUser.email && (
                <li className="text-sm text-gray-400">
                  {currentUser.email}
                </li>
              )}
            </>
          ) : (
            <>
              <li>
                <Link href="/login" className="hover:text-gray-300">Login</Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-gray-300">Sign Up</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
