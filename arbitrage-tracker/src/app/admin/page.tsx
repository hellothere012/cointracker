'use client'; 

import React, { useEffect, useState } from 'react';
import withAdminAuth from '../../components/withAdminAuth';
import AddArbitrageCoinForm from '../../components/admin/AddArbitrageCoinForm';
import { getArbitrageCoins } from '../../lib/firestoreService';
import { ArbitrageCoin } from '../../types/arbitrage';
import Image from 'next/image'; // For optimized images
import { Timestamp } from 'firebase/firestore';


const formatDate = (timestamp: Timestamp | undefined | null): string => {
  if (!timestamp) return 'N/A';
  if (timestamp instanceof Date) { // Should not happen with Firestore Timestamps directly
    return timestamp.toLocaleDateString();
  }
  if (timestamp && typeof timestamp.seconds === 'number') {
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  }
  return 'Invalid Date';
};


function AdminPage() {
  const [arbitrageCoins, setArbitrageCoins] = useState<ArbitrageCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = getArbitrageCoins((coins) => {
      setArbitrageCoins(coins);
      setLoading(false);
      setError(null);
    });
    // Handle potential errors from the subscription itself if needed, e.g. permissions
    // For now, assuming errors are handled by the callback or are less common for read.
    return () => unsubscribe();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage Arbitrage Coin Opportunities</p>
      </div>
      
      <section>
        <AddArbitrageCoinForm />
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-t pt-8">Published Arbitrage Coins</h2>
        {loading && <p className="text-gray-500">Loading arbitrage coins...</p>}
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">Error loading arbitrage coins: {error}</p>}
        
        {!loading && !error && arbitrageCoins.length === 0 && (
          <p className="text-gray-500">No arbitrage coins published yet.</p>
        )}

        {!loading && !error && arbitrageCoins.length > 0 && (
          <div className="space-y-8">
            {arbitrageCoins.map(coin => (
              <div key={coin.id} className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                <div className="flex flex-col md:flex-row gap-6">
                  {coin.imageUrl && (
                    <div className="md:w-1/4 flex-shrink-0">
                      <Image 
                        src={coin.imageUrl} 
                        alt={coin.name} 
                        width={150} 
                        height={150} 
                        className="rounded-md object-cover aspect-square" 
                        onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if image fails to load
                      />
                    </div>
                  )}
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-indigo-700 mb-2">{coin.name}</h3>
                    <p className="text-sm text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded-full mb-3">
                      {coin.metalType}
                    </p>
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">{coin.description}</p>
                    
                    {coin.notes && (
                      <div className="mt-3 mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <h5 className="font-semibold text-sm text-yellow-800">Admin Notes:</h5>
                        <p className="text-sm text-yellow-700 whitespace-pre-wrap">{coin.notes}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-gray-600 mb-1">Resale Links:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {coin.resaleLinks.map((link, index) => (
                          <li key={index} className="text-sm">
                            <span className="font-medium">{link.platform}:</span>{' '}
                            <a href={link.url} target="_blank" rel="noopener noreferrer" 
                               className="text-blue-500 hover:text-blue-700 hover:underline break-all">
                              {link.url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">
                      Published: {formatDate(coin.publishedAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default withAdminAuth(AdminPage);
