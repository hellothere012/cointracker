'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { Coin } from '../../types/inventory';
import { updateCoin } from '../../lib/firestoreService';
import { Timestamp } from 'firebase/firestore';

interface EditCoinModalProps {
  coin: Coin | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback for successful update
}

// Prepare a version of Coin for the form, where Timestamp is string for date input
type EditCoinFormData = Omit<Coin, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'purchaseDate'> & {
  purchaseDate: string; // Use string for form input
};


export default function EditCoinModal({ coin, isOpen, onClose, onSuccess }: EditCoinModalProps) {
  const [formData, setFormData] = useState<Partial<EditCoinFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Added success message state

  useEffect(() => {
    setError(null); // Clear error when coin changes or modal opens/closes
    setSuccessMessage(null); // Clear success message
    if (coin) {
      // Convert purchaseDate Timestamp to YYYY-MM-DD string for the form
      const purchaseDateString = coin.purchaseDate instanceof Timestamp 
        ? new Date(coin.purchaseDate.seconds * 1000).toISOString().split('T')[0]
        : (coin.purchaseDate ? coin.purchaseDate.toString() : new Date().toISOString().split('T')[0]); // Fallback if it's already a string or other format

      setFormData({
        name: coin.name,
        metalType: coin.metalType,
        year: coin.year,
        weight: coin.weight,
        weightUnit: coin.weightUnit,
        purity: coin.purity,
        purchasePrice: coin.purchasePrice,
        purchaseDate: purchaseDateString,
        resaleMarketValue: coin.resaleMarketValue,
      });
    } else {
      // Reset form if no coin is provided (e.g., when modal is closed and reopened)
      setFormData({});
    }
  }, [coin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | undefined = value;

    if (type === 'number') {
      processedValue = value === '' ? undefined : parseFloat(value);
    }
     if (name === 'resaleMarketValue' && value === '') {
        processedValue = undefined; // Allow clearing optional field
    } else if (type === 'number' && name !== 'year' && name !== 'purchasePrice' && name !== 'resaleMarketValue') {
        processedValue = value === '' ? 0 : parseFloat(value);
    }


    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!coin || !coin.id) {
      setError('No coin selected for editing or coin ID is missing.');
      return;
    }
    
    // Basic Validations (similar to AddCoinForm, can be extracted to a utility)
    if (formData.name && formData.name.trim() === '') {
        setError('Coin name is required.');
        return;
    }
    if (formData.weight !== undefined && formData.weight <= 0) {
        setError('Weight must be greater than 0.');
        return;
    }
     if (formData.purity !== undefined && (formData.purity <= 0 || formData.purity > 1)) {
        setError('Purity must be between 0 and 1 (e.g., 0.999).');
        return;
    }
    if (formData.purchasePrice !== undefined && formData.purchasePrice < 0) {
        setError('Purchase price cannot be negative.');
        return;
    }
    if (formData.resaleMarketValue !== undefined && formData.resaleMarketValue < 0) {
        setError('Resale market value cannot be negative.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null); // Clear previous success messages

    try {
      const updateData = { ...formData };
      // Convert purchaseDate string back to Timestamp if it was changed
      if (formData.purchaseDate) {
        updateData.purchaseDate = Timestamp.fromDate(new Date(formData.purchaseDate));
      }
      
      // Ensure only defined fields are passed to updateCoin to avoid overwriting with undefined
      const definedUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );

      await updateCoin(coin.id, definedUpdateData as Partial<Omit<Coin, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>);
      setSuccessMessage('Coin updated successfully!'); // Set success message
      onSuccess(); // Call success callback
      // Optionally delay onClose to let user see success message, or keep immediate close
      // For now, keeping immediate close after onSuccess call. User will see changes in table.
      // To show message before closing:
      // setTimeout(() => {
      //   onClose(); 
      //   setSuccessMessage(null); // Clear message after modal is closed
      // }, 1500);
      // But for now, the parent page (InventoryPage) can show a global success message if needed via onSuccess prop.
      // Let's simplify: close immediately. The success is implicit by data update.
      // Reconsidering: a brief message in modal is better UX.
      // Let's set success, then parent can close or it can auto-close after a delay.
      // For now, the modal will show success, and parent's onSuccess can handle closing.
      // No, `onSuccess` should be for data refresh. Modal itself should show its own success.
      // The current `onSuccess` in `InventoryPage` just refreshes a key, doesn't show a message.
      // So, this modal should show its own success.
      // Let's keep it simple: set success message, and it will be visible until next form interaction or modal close.
    } catch (e: any) {
      setError(e.message || 'Failed to update coin. Please try again.');
      console.error(e);
      setSuccessMessage(null); // Clear success message on error
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !coin) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Coin: {coin.name}</h3>
          {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded-md mb-4">{error}</p>}
          {successMessage && <p className="text-green-500 text-sm bg-green-100 p-3 rounded-md mb-4">{successMessage}</p>}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">Coin Name</label>
                <input type="text" name="name" id="edit-name" value={formData.name || ''} onChange={handleChange} required
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="edit-metalType" className="block text-sm font-medium text-gray-700">Metal Type</label>
                <select name="metalType" id="edit-metalType" value={formData.metalType || 'Gold'} onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Platinum">Platinum</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-year" className="block text-sm font-medium text-gray-700">Year</label>
                <input type="number" name="year" id="edit-year" value={formData.year || ''} onChange={handleChange} required
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="edit-weight" className="block text-sm font-medium text-gray-700">Weight</label>
                <input type="number" name="weight" id="edit-weight" value={formData.weight || ''} onChange={handleChange} required step="any"
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="edit-weightUnit" className="block text-sm font-medium text-gray-700">Weight Unit</label>
                <select name="weightUnit" id="edit-weightUnit" value={formData.weightUnit || 'oz'} onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  <option value="g">Grams (g)</option>
                  <option value="oz">Ounces (oz)</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-purity" className="block text-sm font-medium text-gray-700">Purity</label>
                <input type="number" name="purity" id="edit-purity" value={formData.purity || ''} onChange={handleChange} required step="any"
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="edit-purchasePrice" className="block text-sm font-medium text-gray-700">Purchase Price (USD)</label>
                <input type="number" name="purchasePrice" id="edit-purchasePrice" value={formData.purchasePrice || ''} onChange={handleChange} required step="any"
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="edit-purchaseDate" className="block text-sm font-medium text-gray-700">Purchase Date</label>
                <input type="date" name="purchaseDate" id="edit-purchaseDate" value={formData.purchaseDate || ''} onChange={handleChange} required
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="edit-resaleMarketValue" className="block text-sm font-medium text-gray-700">Resale Market Value (USD, Optional)</label>
                <input type="number" name="resaleMarketValue" id="edit-resaleMarketValue" value={formData.resaleMarketValue === undefined ? '' : formData.resaleMarketValue} onChange={handleChange} step="any"
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
            </div>
            <div className="items-center gap-4 px-4 py-3 sm:px-6 flex flex-row-reverse">
              <button type="submit" disabled={isLoading}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-indigo-300">
                {isLoading ? 'Updating...' : 'Save Changes'}
              </button>
              <button type="button" onClick={onClose}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
