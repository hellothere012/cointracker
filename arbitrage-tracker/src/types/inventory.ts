import { Timestamp } from 'firebase/firestore';

export interface Coin {
  id?: string; // Document ID from Firestore, optional as it's not present on creation
  userId: string; // ID of the user who owns this coin
  name: string; // Name of the coin, e.g., "American Gold Eagle"
  metalType: 'Gold' | 'Silver' | 'Platinum'; // Type of metal
  year: number; // Year the coin was minted
  weight: number; // Weight of the coin
  weightUnit: 'g' | 'oz'; // Unit of weight (grams or ounces)
  purity: number; // Purity of the metal, e.g., 0.999 for 99.9%
  purchasePrice: number; // Price paid for the coin in USD
  purchaseDate: Timestamp; // Date the coin was purchased
  resaleMarketValue?: number; // Optional: current estimated resale market value in USD
  createdAt: Timestamp; // Timestamp of when the coin record was created
  updatedAt: Timestamp; // Timestamp of when the coin record was last updated
}
