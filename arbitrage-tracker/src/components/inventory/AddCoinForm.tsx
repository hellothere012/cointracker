'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import { addCoin, getPreloadedCoins } from '../../lib/firestoreService'; // Import getPreloadedCoins
import { Coin } from '../../types/inventory';
import { PreloadedCoinData } from '../../types/preloadedCoin'; // Import PreloadedCoinData
import { Timestamp } from 'firebase/firestore';

type AddCoinFormData = Omit<Coin, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'purchaseDate'> & {
  purchaseDate: string; // Use string for form input
};

const initialFormData: AddCoinFormData = {
  name: '',
  metalType: 'Gold',
  year: new Date().getFullYear(),
  weight: 0,
  weightUnit: 'oz',
  purity: 0.999,
  purchasePrice: 0,
  purchaseDate: new Date().toISOString().split('T')[0], // Defaults to today
  resaleMarketValue: undefined,
};

export default function AddCoinForm() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<AddCoinFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [preloadedCoins, setPreloadedCoins] = useState<PreloadedCoinData[]>([]);
  const [preloadedCoinsLoading, setPreloadedCoinsLoading] = useState(true);
  const [preloadedCoinsError, setPreloadedCoinsError] = useState<string | null>(null);
  const [selectedPreloadedCoinId, setSelectedPreloadedCoinId] = useState<string>('');


  useEffect(() => {
    setPreloadedCoinsLoading(true);
    const unsubscribe = getPreloadedCoins((data) => {
      setPreloadedCoins(data);
      setPreloadedCoinsLoading(false);
      setPreloadedCoinsError(null);
    });
    // Handle errors from getPreloadedCoins if any (e.g. permissions)
    // This basic setup assumes it will connect or already has data.
    // A more robust error handling for the subscription itself might be needed here.
    // For now, errors during data processing are caught by the callback's error handling.

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);


  const handlePreloadedCoinSelect = (selectedId: string) => {
    setSelectedPreloadedCoinId(selectedId);
    const selectedCoin = preloadedCoins.find(c => c.id === selectedId);

    if (selectedCoin) {
      let weight = 0;
      let weightUnit: 'g' | 'oz' = 'oz'; // Default to oz

      if (selectedCoin.weightOz !== undefined) {
        weight = selectedCoin.weightOz;
        weightUnit = 'oz';
      } else if (selectedCoin.weightG !== undefined) {
        weight = selectedCoin.weightG;
        weightUnit = 'g';
      }

      setFormData(prev => ({
        ...prev,
        name: selectedCoin.name || prev.name,
        metalType: selectedCoin.metalType || prev.metalType,
        purity: selectedCoin.purity || prev.purity,
        weight: weight,
        weightUnit: weightUnit,
        // Year is often specific to the purchased coin, so not auto-filled from commonYearRange
        // purchasePrice, purchaseDate, resaleMarketValue are user-specific
      }));
    } else if (selectedId === "") { // "-- Select a coin --" chosen
        // Optionally reset fields or leave them as they are from manual input
        // For now, we do nothing, allowing manual edits to persist.
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    let processedValue: string | number | undefined = value;
    if (type === 'number') {
      processedValue = value === '' ? undefined : parseFloat(value);
    }
    if (name === 'resaleMarketValue' && value === '') {
        processedValue = undefined; // Allow clearing optional field
    } else if (type === 'number' && name !== 'year' && name !== 'purchasePrice' && name !== 'resaleMarketValue') {
        processedValue = value === '' ? 0 : parseFloat(value); // Default to 0 for other numeric fields if empty
    }


    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      setError('You must be logged in to add a coin.');
      return;
    }
    if (formData.name.trim() === '') {
        setError('Coin name is required.');
        return;
    }
    if (formData.weight <= 0) {
        setError('Weight must be greater than 0.');
        return;
    }
     if (formData.purity <= 0 || formData.purity > 1) {
        setError('Purity must be between 0 and 1 (e.g., 0.999).');
        return;
    }
    if (formData.purchasePrice < 0) {
        setError('Purchase price cannot be negative.');
        return;
    }
    if (formData.resaleMarketValue !== undefined && formData.resaleMarketValue < 0) {
        setError('Resale market value cannot be negative.');
        return;
    }


    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const coinDataForFirestore = {
        ...formData,
        purchaseDate: Timestamp.fromDate(new Date(formData.purchaseDate)), // Convert string date to Timestamp
      };
      await addCoin(currentUser.uid, coinDataForFirestore);
      setSuccessMessage('Coin added successfully!');
      setFormData(initialFormData); // Reset form
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || 'Failed to add coin. Please try again.');
      } else {
        setError('An unexpected error occurred while adding the coin.');
      }
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md mb-10">
      <h3 className="text-xl font-semibold text-gray-700 mb-6">Add New Coin</h3>
      {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded-md">{error}</p>}
      {successMessage && <p className="text-green-500 text-sm bg-green-100 p-3 rounded-md">{successMessage}</p>}

      {/* Preloaded Coin Selector */}
      <div className="col-span-1 md:col-span-2">
        <label htmlFor="preloadedCoin" className="block text-sm font-medium text-gray-700">
          Or Select a Common Coin (Auto-fills some fields)
        </label>
        <select
          id="preloadedCoin"
          name="preloadedCoin"
          value={selectedPreloadedCoinId}
          onChange={(e) => handlePreloadedCoinSelect(e.target.value)}
          disabled={preloadedCoinsLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">-- Select a coin --</option>
          {preloadedCoinsLoading && <option value="" disabled>Loading common coins...</option>}
          {preloadedCoinsError && <option value="" disabled>Error loading coins</option>}
          {!preloadedCoinsLoading && !preloadedCoinsError && preloadedCoins.map(pc => (
            <option key={pc.id} value={pc.id}>
              {pc.name} ({pc.metalType}, {pc.weightOz ? `${pc.weightOz}oz` : ''}{pc.weightG ? `${pc.weightG}g` : ''}, {pc.purity})
            </option>
          ))}
        </select>
        {preloadedCoinsError && <p className="text-xs text-red-500 mt-1">{preloadedCoinsError}</p>}
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"> {/* Added mt-6 for spacing */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Coin Name</label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="metalType" className="block text-sm font-medium text-gray-700">Metal Type</label>
          <select name="metalType" id="metalType" value={formData.metalType} onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Platinum">Platinum</option>
          </select>
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
          <input type="number" name="year" id="year" value={formData.year} onChange={handleChange} required
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight</label>
          <input type="number" name="weight" id="weight" value={formData.weight} onChange={handleChange} required step="any"
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="weightUnit" className="block text-sm font-medium text-gray-700">Weight Unit</label>
          <select name="weightUnit" id="weightUnit" value={formData.weightUnit} onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            <option value="g">Grams (g)</option>
            <option value="oz">Ounces (oz)</option>
          </select>
        </div>
        <div>
          <label htmlFor="purity" className="block text-sm font-medium text-gray-700">Purity (e.g., 0.999)</label>
          <input type="number" name="purity" id="purity" value={formData.purity} onChange={handleChange} required step="any"
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700">Purchase Price (USD)</label>
          <input type="number" name="purchasePrice" id="purchasePrice" value={formData.purchasePrice} onChange={handleChange} required step="any"
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">Purchase Date</label>
          <input type="date" name="purchaseDate" id="purchaseDate" value={formData.purchaseDate} onChange={handleChange} required
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="resaleMarketValue" className="block text-sm font-medium text-gray-700">Resale Market Value (USD, Optional)</label>
          <input type="number" name="resaleMarketValue" id="resaleMarketValue" value={formData.resaleMarketValue === undefined ? '' : formData.resaleMarketValue} onChange={handleChange} step="any"
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
      </div>

      <div className="pt-2">
        <button type="submit" disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300">
          {isLoading ? 'Adding Coin...' : 'Add Coin'}
        </button>
      </div>
    </form>
  );
}
