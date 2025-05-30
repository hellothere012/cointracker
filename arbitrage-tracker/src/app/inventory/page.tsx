'use client';

import React, { useState, useEffect } from 'react'; // Added useEffect
import withAuth from '../../components/withAuth';
import { useAuth } from '../../lib/authContext';
import { SpotPrices } from '../../lib/calculations'; // Import SpotPrices type
import AddCoinForm from '../../components/inventory/AddCoinForm';
import CoinTable from '../../components/inventory/CoinTable';
import EditCoinModal from '../../components/inventory/EditCoinModal';
import { Coin } from '../../types/inventory';
import { PreloadedCoinData } from '../../types/preloadedCoin'; // Import PreloadedCoinData
import { batchAddPreloadedCoins } from '../../lib/firestoreService'; // Import batch function

import {
  calculateMeltValue,
  calculatePremiumPaidPercent,
  calculateProfitMarginPercent
} from '../../lib/calculations'; // Import calculation functions
import { Timestamp } from 'firebase/firestore'; // Import Timestamp

// Sample data for preloading
const samplePreloadedCoins: PreloadedCoinData[] = [
  {
    "name": "American Gold Eagle 1 oz",
    "metalType": "Gold",
    "weightOz": 1,
    "purity": 0.9167,
    "commonYearRange": "1986-present",
    "finenessMarking": "1 OZ FINE GOLD",
    "country": "USA",
    "description": "Iconic American gold bullion coin."
  },
  {
    "name": "Canadian Gold Maple Leaf 1 oz",
    "metalType": "Gold",
    "weightOz": 1,
    "purity": 0.9999,
    "commonYearRange": "1979-present",
    "finenessMarking": "1 OZ OR PUR .9999",
    "country": "Canada",
    "description": "Renowned for its high purity."
  },
  {
    "name": "South African Krugerrand 1 oz",
    "metalType": "Gold",
    "weightOz": 1,
    "purity": 0.9167,
    "commonYearRange": "1967-present",
    "finenessMarking": "1 OZ FYNGOUD",
    "country": "South Africa",
    "description": "The original 1 oz gold bullion coin."
  },
  {
    "name": "American Silver Eagle 1 oz",
    "metalType": "Silver",
    "weightOz": 1,
    "purity": 0.999,
    "commonYearRange": "1986-present",
    "finenessMarking": "1 OZ. FINE SILVER~ONE DOLLAR",
    "country": "USA",
    "description": "Official silver bullion coin of the United States."
  },
  {
    "name": "Canadian Silver Maple Leaf 1 oz",
    "metalType": "Silver",
    "weightOz": 1,
    "purity": 0.9999,
    "commonYearRange": "1988-present",
    "finenessMarking": "1 OZ ARGENT PUR .9999",
    "country": "Canada",
    "description": "Known for its .9999 silver purity."
  },
  {
    "name": "British Silver Britannia 1 oz",
    "metalType": "Silver",
    "weightOz": 1,
    "purity": 0.999,
    "commonYearRange": "1997-present (0.999 since 2013)",
    "finenessMarking": "1 OZ .999 FINE SILVER",
    "country": "UK",
    "description": "Official silver bullion coin of Great Britain."
  },
  {
    "name": "Australian Silver Kangaroo 1 oz",
    "metalType": "Silver",
    "weightOz": 1,
    "purity": 0.9999,
    "commonYearRange": "2016-present",
    "finenessMarking": "1OZ 9999 SILVER",
    "country": "Australia",
    "description": "Perth Mint silver bullion coin with .9999 purity."
  }
];


function InventoryPage() {
  const { currentUser } = useAuth();
  const [coins, setCoins] = useState<Coin[]>([]); // State for coins
  const [coinsLoading, setCoinsLoading] = useState(true); // State for coins loading
  const [coinsError, setCoinsError] = useState<string | null>(null); // State for coins error
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPopulating, setIsPopulating] = useState(false);
  const [populateMessage, setPopulateMessage] = useState<string | null>(null);

  // State for spot prices
  const [spotPrices, setSpotPrices] = useState<SpotPrices | null>(null);
  const [spotPricesLoading, setSpotPricesLoading] = useState(true);
  const [spotPricesError, setSpotPricesError] = useState<string | null>(null);

  // Fetch Coins (moved from original spot, added error/loading)
  useEffect(() => {
    if (currentUser?.uid) {
      setCoinsLoading(true);
      const unsubscribe = getCoins(currentUser.uid, (fetchedCoins) => {
        setCoins(fetchedCoins);
        setCoinsLoading(false);
        setCoinsError(null);
      });
      return () => unsubscribe();
    } else {
      setCoins([]);
      setCoinsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchPrices = async () => {
      setSpotPricesLoading(true);
      setSpotPricesError(null);
      try {
        const response = await fetch('/api/spot-prices');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch spot prices: ${response.status}`);
        }
        const data = await response.json();
        setSpotPrices({
          XAUUSD: data.XAUUSD,
          XAGUSD: data.XAGUSD,
          XPTUSD: data.XPTUSD,
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          setSpotPricesError(err.message);
        } else {
          setSpotPricesError('An unexpected error occurred while fetching spot prices.');
        }
        console.error("Failed to fetch spot prices:", err);
      } finally {
        setSpotPricesLoading(false);
      }
    };

    fetchPrices();
    // Consider adding a timer to refetch prices periodically, e.g., every 5-15 minutes
    // For now, it fetches once on mount.
  }, []);

  const handleEditCoin = (coin: Coin) => {
    setSelectedCoin(coin);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedCoin(null);
  };

  const handleUpdateSuccess = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  const formatDateForCSV = (timestamp: Timestamp | Date | undefined | null): string => {
    if (!timestamp) return '';
    if (timestamp instanceof Date) {
      return timestamp.toISOString().split('T')[0];
    }
    if (timestamp && typeof timestamp.seconds === 'number') {
      return new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
    }
    return ''; // Fallback for unexpected format
  };

  const escapeCSVField = (field: unknown): string => {
    if (field === null || field === undefined) return ''; // Return empty string for null/undefined
    const stringField = String(field);
    // Basic CSV escaping: if field contains comma, newline or double quote, wrap in double quotes
    // and escape existing double quotes by doubling them.
    if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const handleExportCSV = () => {
    if (coinsLoading || spotPricesLoading || !coins || coins.length === 0) {
      alert("Data is still loading or no coins available to export.");
      return;
    }
    if (!spotPrices) {
      alert("Spot prices are not available. Cannot calculate all CSV fields.");
      // Optionally proceed with N/A for price-dependent fields or stop. For now, we'll proceed.
    }

    const headers = [
      'ID', 'Name', 'Metal Type', 'Year', 'Weight', 'Weight Unit', 'Purity',
      'Purchase Price', 'Purchase Date', 'Resale Market Value',
      'Live Melt Value', 'Premium Paid (%)', 'Profit Margin (%)', 'Created At', 'Updated At'
    ];

    const rows = coins.map(coin => {
      const meltValue = spotPrices ? calculateMeltValue(coin, spotPrices) : null;
      const premiumPaid = spotPrices ? calculatePremiumPaidPercent(coin.purchasePrice, meltValue) : null;
      const profitMargin = spotPrices ? calculateProfitMarginPercent(coin.resaleMarketValue, meltValue) : null;

      return [
        escapeCSVField(coin.id),
        escapeCSVField(coin.name),
        escapeCSVField(coin.metalType),
        escapeCSVField(coin.year),
        escapeCSVField(coin.weight),
        escapeCSVField(coin.weightUnit),
        escapeCSVField(coin.purity),
        escapeCSVField(coin.purchasePrice !== undefined ? coin.purchasePrice.toFixed(2) : ''),
        escapeCSVField(formatDateForCSV(coin.purchaseDate)),
        escapeCSVField(coin.resaleMarketValue !== undefined && coin.resaleMarketValue !== null ? coin.resaleMarketValue.toFixed(2) : ''),
        escapeCSVField(meltValue !== null ? meltValue.toFixed(2) : 'N/A'),
        escapeCSVField(premiumPaid !== null ? premiumPaid.toFixed(2) : 'N/A'),
        escapeCSVField(profitMargin !== null ? profitMargin.toFixed(2) : 'N/A'),
        escapeCSVField(formatDateForCSV(coin.createdAt)),
        escapeCSVField(formatDateForCSV(coin.updatedAt)),
      ].join(',');
    });

    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filename = `coin_inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!currentUser) {
    // This should ideally be handled by withAuth, but as a fallback:
    return <p className="text-center text-xl font-semibold mt-20">Please log in to view your inventory.</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Coin Inventory</h1>

      {/* Temporary Button to Populate Preloaded Coins */}
      <div className="my-4 p-4 border rounded-md bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">Dev Tools (Temporary)</h3>
        <button
          onClick={async () => {
            setIsPopulating(true);
            setPopulateMessage(null);
            try {
              await batchAddPreloadedCoins(samplePreloadedCoins);
              setPopulateMessage("Preloaded coins processed. Check console for details.");
            } catch (error: unknown) {
              console.error("Failed to populate preloaded coins:", error);
              if (error instanceof Error) {
                setPopulateMessage(`Error: ${error.message}`);
              } else {
                setPopulateMessage('An unexpected error occurred during population.');
              }
            } finally {
              setIsPopulating(false);
            }
          }}
          disabled={isPopulating}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300"
        >
          {isPopulating ? 'Populating...' : 'Populate Preloaded Coins'}
        </button>
        {populateMessage && <p className={`mt-2 text-sm ${populateMessage.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{populateMessage}</p>}
      </div>

      <div className="mb-12">
        <AddCoinForm />
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your Collection</h2>
        {spotPricesLoading && <p className="text-center text-gray-600 py-4">Loading spot prices...</p>}
        {spotPricesError && <p className="text-center text-red-500 py-4 bg-red-100 p-3 rounded-md">Error loading spot prices: {spotPricesError}</p>}
        <CoinTable
          key={refreshKey}
          onEditCoin={handleEditCoin}
          spotPrices={spotPrices}
          spotPricesLoading={spotPricesLoading}
        />
        {coinsError && <p className="text-sm text-red-600 mt-2">Error loading coins: {coinsError}</p>}
      </div>

      <div className="mt-8 mb-4">
        <button
          onClick={handleExportCSV}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          disabled={coinsLoading || spotPricesLoading || coins.length === 0}
        >
          Export to CSV
        </button>
        {coins.length === 0 && !coinsLoading && <p className="text-sm text-gray-600 mt-2">Add some coins to your inventory to enable export.</p>}
      </div>

      {selectedCoin && (
        <EditCoinModal
          coin={selectedCoin}
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}

export default withAuth(InventoryPage);
