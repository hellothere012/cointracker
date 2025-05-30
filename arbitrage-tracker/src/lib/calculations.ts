import { Coin } from '../types/inventory';

const GRAMS_IN_TROY_OUNCE = 31.1035;

export interface SpotPrices {
  XAUUSD?: number | null; // Gold in USD per troy ounce
  XAGUSD?: number | null; // Silver in USD per troy ounce
  XPTUSD?: number | null; // Platinum in USD per troy ounce
}

/**
 * Calculates the melt value of a coin based on its metal type, weight, purity, and current spot prices.
 * @param coin - The Coin object.
 * @param spotPrices - An object containing current spot prices for gold, silver, and platinum.
 * @returns The calculated melt value in USD, or null if essential data is missing.
 */
export const calculateMeltValue = (coin: Coin, spotPrices: SpotPrices): number | null => {
  if (!coin || !spotPrices) return null;

  let spotPricePerOz: number | null | undefined = null;
  switch (coin.metalType) {
    case 'Gold':
      spotPricePerOz = spotPrices.XAUUSD;
      break;
    case 'Silver':
      spotPricePerOz = spotPrices.XAGUSD;
      break;
    case 'Platinum':
      spotPricePerOz = spotPrices.XPTUSD;
      break;
    default:
      return null; // Unknown metal type
  }

  if (spotPricePerOz === null || spotPricePerOz === undefined || spotPricePerOz <= 0) {
    return null; // Spot price not available or invalid
  }

  if (coin.weight === undefined || coin.weight <= 0 || coin.purity === undefined || coin.purity <= 0) {
    return null; // Essential coin data missing or invalid
  }

  let weightInOz = coin.weight;
  if (coin.weightUnit === 'g') {
    weightInOz = coin.weight / GRAMS_IN_TROY_OUNCE;
  }

  const meltValue = spotPricePerOz * weightInOz * coin.purity;
  return meltValue;
};

/**
 * Calculates the premium paid over melt value as a percentage.
 * @param purchasePrice - The price paid for the coin.
 * @param meltValue - The current melt value of the coin.
 * @returns The premium paid as a percentage, or null if inputs are invalid.
 */
export const calculatePremiumPaidPercent = (purchasePrice: number, meltValue: number | null): number | null => {
  if (meltValue === null || meltValue <= 0 || purchasePrice === undefined || purchasePrice < 0) {
    return null;
  }
  const premium = ((purchasePrice - meltValue) / meltValue) * 100;
  return premium;
};

/**
 * Calculates the potential profit margin over melt value if sold at resaleMarketValue, as a percentage.
 * @param resaleMarketValue - The potential resale market value of the coin.
 * @param meltValue - The current melt value of the coin.
 * @returns The profit margin as a percentage, or null if inputs are invalid or resaleMarketValue is not provided.
 */
export const calculateProfitMarginPercent = (resaleMarketValue: number | undefined | null, meltValue: number | null): number | null => {
  if (meltValue === null || meltValue <= 0) {
    return null;
  }
  if (resaleMarketValue === undefined || resaleMarketValue === null || resaleMarketValue < 0) {
    return null; // No resale value provided or it's invalid
  }

  const profitMargin = ((resaleMarketValue - meltValue) / meltValue) * 100;
  return profitMargin;
};
