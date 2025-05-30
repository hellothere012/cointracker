'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { getCoins } from '../../lib/firestoreService';
import { Coin } from '../../types/inventory';
import CoinRow from './CoinRow';
import { SpotPrices } from '../../lib/calculations'; // Import SpotPrices type

interface CoinTableProps {
  onEditCoin: (coin: Coin) => void; // Callback to signal editing a coin
  spotPrices: SpotPrices | null;
  spotPricesLoading: boolean;
}

export default function CoinTable({ onEditCoin, spotPrices, spotPricesLoading }: CoinTableProps) {
  const { currentUser } = useAuth();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      setError("Please log in to view your inventory.");
      setCoins([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = getCoins(currentUser.uid, (fetchedCoins) => {
      setCoins(fetchedCoins);
      setIsLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  if (isLoading) {
    return <p className="text-center text-gray-600 py-8">Loading inventory...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-8 bg-red-100 p-4 rounded-md">{error}</p>;
  }

  if (coins.length === 0) {
    return <p className="text-center text-gray-600 py-8">No coins found in your inventory. Try adding some!</p>;
  }

  return (
    <div className="overflow-x-auto bg-white shadow-md rounded-lg">
      <table className="min-w-full table-auto">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metal</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purity</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Value</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Melt Value</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium Paid %</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit Margin %</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {coins.map((coin) => (
            <CoinRow
              key={coin.id}
              coin={coin}
              onEdit={onEditCoin}
              spotPrices={spotPrices}
              spotPricesLoading={spotPricesLoading}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
