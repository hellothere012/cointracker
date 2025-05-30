'use client';

import React, { useMemo } from 'react'; // Added useMemo
import { Coin } from '../../types/inventory';
import { deleteCoin } from '../../lib/firestoreService';
import { Timestamp } from 'firebase/firestore';
import { 
  SpotPrices, 
  calculateMeltValue, 
  calculatePremiumPaidPercent, 
  calculateProfitMarginPercent 
} from '../../lib/calculations'; // Import calculation functions and SpotPrices type

interface CoinRowProps {
  coin: Coin;
  onEdit: (coin: Coin) => void; // Callback to handle edit action
  spotPrices: SpotPrices | null;
  spotPricesLoading: boolean;
}

const formatDate = (timestamp: Timestamp | undefined | null): string => {
  if (!timestamp) return 'N/A';
  // Check if timestamp is already a Date object (might happen with optimistic updates or specific state management)
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString();
  }
  // Default Firestore Timestamp handling
  if (timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number') {
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  }
  return 'Invalid Date';
};

const formatCurrency = (value: number | null | undefined, placeholder: string = 'N/A'): string => {
  if (value === null || value === undefined) return placeholder;
  return `$${value.toFixed(2)}`;
};

const formatPercent = (value: number | null | undefined, placeholder: string = 'N/A'): string => {
  if (value === null || value === undefined) return placeholder;
  return `${value.toFixed(2)}%`;
};


export default function CoinRow({ coin, onEdit, spotPrices, spotPricesLoading }: CoinRowProps) {
  
  const calculatedValues = useMemo(() => {
    if (spotPricesLoading || !spotPrices) {
      return {
        meltValue: null,
        premiumPaidPercent: null,
        profitMarginPercent: null,
        profitabilityStatus: 'Calculating', // 'Calculating', 'Profitable', 'Loss', 'Neutral'
        tooltipTitle: '',
      };
    }
    const meltValue = calculateMeltValue(coin, spotPrices);
    const premiumPaidPercent = calculatePremiumPaidPercent(coin.purchasePrice, meltValue);
    const profitMarginPercent = calculateProfitMarginPercent(coin.resaleMarketValue, meltValue);

    let profitabilityStatus: 'Calculating' | 'Profitable' | 'Loss' | 'Neutral' = 'Neutral';
    let tooltipTitle = '';

    if (meltValue !== null && meltValue > 0 && coin.resaleMarketValue !== undefined && coin.resaleMarketValue !== null) {
      if (coin.resaleMarketValue > meltValue) {
        profitabilityStatus = 'Profitable';
        tooltipTitle = 'Potential Profit: Resale Market Value is greater than Melt Value.';
      } else if (coin.resaleMarketValue < meltValue) {
        profitabilityStatus = 'Loss';
        tooltipTitle = 'Potential Loss: Resale Market Value is less than Melt Value.';
      }
    } else if (meltValue === null && !spotPricesLoading) { // Melt value could not be calculated, and prices are loaded
        profitabilityStatus = 'Neutral'; // Or 'ErrorCalculating'
        tooltipTitle = 'Melt value could not be determined.';
    }


    return { meltValue, premiumPaidPercent, profitMarginPercent, profitabilityStatus, tooltipTitle };
  }, [coin, spotPrices, spotPricesLoading]);

  let rowClassName = "border-b border-gray-200 hover:bg-gray-100";
  if (calculatedValues.profitabilityStatus === 'Profitable') {
    rowClassName += " bg-green-100";
  } else if (calculatedValues.profitabilityStatus === 'Loss') {
    rowClassName += " bg-yellow-100";
  }
  
  const handleDelete = async () => {
    if (!coin.id) {
      console.error('Coin ID is missing, cannot delete.');
      alert('Error: Coin ID is missing.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${coin.name}"?`)) {
      try {
        await deleteCoin(coin.id);
        alert(`"${coin.name}" deleted successfully.`);
      } catch (error) {
        console.error('Error deleting coin:', error);
        alert(`Failed to delete "${coin.name}".`);
      }
    }
  };

  return (
    <tr className={rowClassName} title={calculatedValues.tooltipTitle}>
      <td className="py-3 px-4 text-sm text-gray-700">{coin.name}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{coin.metalType}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{coin.year}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{`${coin.weight} ${coin.weightUnit}`}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{coin.purity}</td>
      <td className="py-3 px-4 text-sm text-gray-700">${coin.purchasePrice.toFixed(2)}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{formatDate(coin.purchaseDate)}</td>
      <td className="py-3 px-4 text-sm text-gray-700">
        {formatCurrency(coin.resaleMarketValue)}
      </td>
      <td className="py-3 px-4 text-sm text-gray-700">
        {spotPricesLoading ? 'Calc...' : formatCurrency(calculatedValues.meltValue)}
      </td>
      <td className="py-3 px-4 text-sm text-gray-700">
        {spotPricesLoading ? 'Calc...' : formatPercent(calculatedValues.premiumPaidPercent)}
      </td>
      <td className="py-3 px-4 text-sm text-gray-700">
        {spotPricesLoading ? 'Calc...' : formatPercent(calculatedValues.profitMarginPercent)}
      </td>
      <td className="py-3 px-4 text-sm text-gray-700">{formatDate(coin.updatedAt)}</td>
      <td className="py-3 px-4 text-sm">
        <button
          onClick={() => onEdit(coin)}
          className="text-indigo-600 hover:text-indigo-900 mr-3 font-medium"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="text-red-600 hover:text-red-900 font-medium"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
