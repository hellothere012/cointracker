export interface PreloadedCoinData {
  id?: string; // Document ID from Firestore
  name: string; // e.g., "American Gold Eagle 1 oz"
  metalType: 'Gold' | 'Silver' | 'Platinum';
  weightOz?: number; // Troy ounces
  weightG?: number; // Grams
  purity: number; // e.g., 0.999, 0.9167
  commonYearRange?: string; // e.g., "1986-present"
  finenessMarking?: string; // e.g., "1 OZ .999 FINE GOLD", "1 OZ FINE SILVER .999"
  country?: string; // e.g., "USA", "Canada"
  description?: string; // Short description or common name
}
