'use client';

import React, { useEffect, useState, useMemo } from 'react';
import withAuth from '../../components/withAuth';
import { useAuth } from '../../lib/authContext';
import { getCoins } from '../../lib/firestoreService';
import { Coin } from '../../types/inventory';
import { SpotPrices, calculateMeltValue } from '../../lib/calculations'; // Removed calculatePremiumPaidPercent
import Widget from '../../components/dashboard/Widget'; // Import Widget

const formatCurrency = (value: number | null | undefined, placeholder: string = 'N/A', decimals = 2): string => {
  if (value === null || value === undefined) return placeholder;
  return `$${value.toFixed(decimals)}`;
};

const formatPercent = (value: number | null | undefined, placeholder: string = 'N/A'): string => {
  if (value === null || value === undefined) return placeholder;
  return `${value.toFixed(2)}%`;
};


function DashboardPage() {
  const { currentUser } = useAuth();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [coinsLoading, setCoinsLoading] = useState(true);
  const [coinsError, setCoinsError] = useState<string | null>(null);

  const [spotPrices, setSpotPrices] = useState<SpotPrices | null>(null);
  const [spotPricesLoading, setSpotPricesLoading] = useState(true);
  const [spotPricesError, setSpotPricesError] = useState<string | null>(null);

  // Fetch Coins
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

  // Fetch Spot Prices
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
  }, []);

  // Aggregate Calculations
  const dashboardStats = useMemo(() => {
    if (coinsLoading || spotPricesLoading || !spotPrices || coinsError) {
      return {
        totalCollectionMeltValue: null,
        averagePremiumPaid: null,
        totalPotentialProfit: null,
      };
    }

    let totalMeltValue = 0;
    let sumOfPurchasePrices = 0;
    let sumOfMeltValuesForPremiumCalc = 0;
    let totalProfit = 0;
    let coinsIncludedInPremiumCalc = 0;

    coins.forEach(coin => {
      const meltValue = calculateMeltValue(coin, spotPrices);
      if (meltValue !== null && meltValue > 0) {
        totalMeltValue += meltValue;

        // For weighted average premium
        if (coin.purchasePrice !== undefined) {
            sumOfPurchasePrices += coin.purchasePrice;
            sumOfMeltValuesForPremiumCalc += meltValue;
            coinsIncludedInPremiumCalc++;
        }

        // For total potential profit
        if (coin.resaleMarketValue !== undefined && coin.resaleMarketValue !== null) {
          totalProfit += coin.resaleMarketValue - meltValue;
        }
      }
    });

    let averagePremium: number | null = null;
    if (coinsIncludedInPremiumCalc > 0 && sumOfMeltValuesForPremiumCalc > 0) {
        averagePremium = ((sumOfPurchasePrices - sumOfMeltValuesForPremiumCalc) / sumOfMeltValuesForPremiumCalc) * 100;
    }


    return {
      totalCollectionMeltValue: totalMeltValue,
      averagePremiumPaid: averagePremium,
      totalPotentialProfit: totalProfit,
    };
  }, [coins, spotPrices, coinsLoading, spotPricesLoading, coinsError]);

  const overallLoading = coinsLoading || spotPricesLoading;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        {currentUser && (
          <p className="text-md text-gray-600">
            Welcome, <span className="font-semibold">{currentUser.email}</span>
          </p>
        )}
      </div>

      {coinsError && <p className="text-center text-red-500 py-4 bg-red-100 p-3 rounded-md mb-6">Error loading coin data: {coinsError}</p>}
      {spotPricesError && <p className="text-center text-red-500 py-4 bg-red-100 p-3 rounded-md mb-6">Error loading spot prices: {spotPricesError}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Widget
          title="Gold Spot Price"
          value={spotPrices?.XAUUSD ? formatCurrency(spotPrices.XAUUSD, 'N/A') : (spotPricesLoading ? undefined : 'N/A')}
          unit="/oz"
          isLoading={spotPricesLoading}
          error={!spotPrices?.XAUUSD && !spotPricesLoading ? 'Not available' : undefined}
        />
        <Widget
          title="Silver Spot Price"
          value={spotPrices?.XAGUSD ? formatCurrency(spotPrices.XAGUSD, 'N/A') : (spotPricesLoading ? undefined : 'N/A')}
          unit="/oz"
          isLoading={spotPricesLoading}
          error={!spotPrices?.XAGUSD && !spotPricesLoading ? 'Not available' : undefined}
        />
        <Widget
          title="Platinum Spot Price"
          value={spotPrices?.XPTUSD ? formatCurrency(spotPrices.XPTUSD, 'N/A') : (spotPricesLoading ? undefined : 'N/A')}
          unit="/oz"
          isLoading={spotPricesLoading}
          error={!spotPrices?.XPTUSD && !spotPricesLoading && spotPrices ? 'Not available' : undefined} // Only show error if prices loaded but PT is null
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Widget
            title="Total Collection Melt Value"
            value={formatCurrency(dashboardStats.totalCollectionMeltValue, 'N/A')}
            isLoading={overallLoading}
            error={coinsError || (!dashboardStats.totalCollectionMeltValue && !overallLoading && coins.length > 0) ? 'Calculation Error' : undefined}
        />
        <Widget
            title="Weighted Avg. Premium Paid"
            value={formatPercent(dashboardStats.averagePremiumPaid, 'N/A')}
            isLoading={overallLoading}
            error={coinsError || (!dashboardStats.averagePremiumPaid && !overallLoading && coins.length > 0) ? 'Calculation Error' : undefined}
        />
        <Widget
            title="Total Potential Profit (vs Melt)"
            value={formatCurrency(dashboardStats.totalPotentialProfit, 'N/A')}
            isLoading={overallLoading}
            error={coinsError || (!dashboardStats.totalPotentialProfit && !overallLoading && coins.length > 0 && coins.some(c => c.resaleMarketValue)) ? 'Calculation Error' : undefined}
        />
      </div>

      {/* Future: Add charts or more detailed breakdowns here */}
    </div>
  );
}

export default withAuth(DashboardPage);
