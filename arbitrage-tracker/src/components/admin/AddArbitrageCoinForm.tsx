'use client';

import React, { useState, FormEvent } from 'react';
import { addArbitrageCoin } from '../../lib/firestoreService';
import { ArbitrageCoinLink, ArbitrageCoin } from '../../types/arbitrage';

type ArbitrageFormData = Omit<ArbitrageCoin, 'id' | 'publishedAt' | 'resaleLinks'> & {
  resaleLinks: Array<ArbitrageCoinLink & { tempId: number }>; // Add tempId for key prop during rendering
};

const initialLink: ArbitrageCoinLink & { tempId: number } = { platform: '', url: '', tempId: Date.now() };

const initialFormData: ArbitrageFormData = {
  name: '',
  metalType: 'Gold',
  description: '',
  imageUrl: '',
  notes: '',
  resaleLinks: [initialLink],
};

export default function AddArbitrageCoinForm() {
  const [formData, setFormData] = useState<ArbitrageFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLinkChange = (index: number, field: keyof ArbitrageCoinLink, value: string) => {
    const updatedLinks = formData.resaleLinks.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    );
    setFormData(prev => ({ ...prev, resaleLinks: updatedLinks }));
  };

  const addLink = () => {
    setFormData(prev => ({
      ...prev,
      resaleLinks: [...prev.resaleLinks, { ...initialLink, tempId: Date.now() }],
    }));
  };

  const removeLink = (index: number) => {
    if (formData.resaleLinks.length <= 1) return; // Keep at least one link input
    const updatedLinks = formData.resaleLinks.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, resaleLinks: updatedLinks }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (formData.name.trim() === '' || formData.description.trim() === '') {
      setError('Name and Description are required.');
      return;
    }
    if (formData.resaleLinks.some(link => link.platform.trim() === '' || link.url.trim() === '')) {
      setError('All resale links must have both platform and URL filled.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Prepare data for Firestore (remove tempId from links)
      const dataToSubmit: Omit<ArbitrageCoin, 'id' | 'publishedAt'> = {
        ...formData,
        resaleLinks: formData.resaleLinks.map(({ tempId, ...link }) => link),
      };

      await addArbitrageCoin(dataToSubmit);
      setSuccessMessage('Arbitrage coin added successfully!');
      setFormData(initialFormData); // Reset form
    } catch (e: any) {
      setError(e.message || 'Failed to add arbitrage coin. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md mb-10">
      <h3 className="text-xl font-semibold text-gray-700 mb-6 border-b pb-3">Add New Arbitrage Coin</h3>
      {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded-md">{error}</p>}
      {successMessage && <p className="text-green-500 text-sm bg-green-100 p-3 rounded-md">{successMessage}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
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
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
      </div>

      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">Image URL (Optional)</label>
        <input type="url" name="imageUrl" id="imageUrl" value={formData.imageUrl} onChange={handleChange}
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Admin Notes (Optional)</label>
        <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={2}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
      </div>

      <fieldset className="border p-4 rounded-md">
        <legend className="text-sm font-medium text-gray-700 px-1">Resale Links</legend>
        {formData.resaleLinks.map((link, index) => (
          <div key={link.tempId} className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-center mb-3 p-2 border-b last:border-b-0">
            <div className="md:col-span-5">
              <label htmlFor={`platform-${index}`} className="block text-xs font-medium text-gray-600">Platform</label>
              <input type="text" id={`platform-${index}`} value={link.platform} onChange={(e) => handleLinkChange(index, 'platform', e.target.value)} required
                     className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="md:col-span-6">
              <label htmlFor={`url-${index}`} className="block text-xs font-medium text-gray-600">URL</label>
              <input type="url" id={`url-${index}`} value={link.url} onChange={(e) => handleLinkChange(index, 'url', e.target.value)} required
                     className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="md:col-span-1 flex items-end justify-end md:justify-start">
              {formData.resaleLinks.length > 1 && (
                <button type="button" onClick={() => removeLink(index)}
                        className="mt-1 text-red-600 hover:text-red-800 text-sm p-1.5 rounded-md hover:bg-red-100">
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
        <button type="button" onClick={addLink}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 py-1 px-2 rounded-md hover:bg-indigo-50">
          + Add another link
        </button>
      </fieldset>

      <div className="pt-2">
        <button type="submit" disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300">
          {isLoading ? 'Adding Coin...' : 'Add Arbitrage Coin'}
        </button>
      </div>
    </form>
  );
}
