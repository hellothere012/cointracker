import { Timestamp } from 'firebase/firestore';

export interface ArbitrageCoinLink {
  platform: string; // e.g., "eBay", "Auction House", "Reddit"
  url: string;
}

export interface ArbitrageCoin {
  id?: string; // Firestore document ID
  name: string;
  metalType: 'Gold' | 'Silver' | 'Platinum';
  description: string; // Detailed description, potentially including condition, year, specific markings
  resaleLinks: ArbitrageCoinLink[]; // Array of links where this coin might be found for arbitrage
  imageUrl?: string; // Optional URL to an image of the coin
  notes?: string; // Optional internal notes for admins
  publishedAt: Timestamp; // Firestore Timestamp for when the entry was published
}
