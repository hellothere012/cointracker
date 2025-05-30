import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  DocumentReference,
  Unsubscribe,
  writeBatch,
  getDocs, // Added for checking existing documents
} from 'firebase/firestore';
import { app } from './firebaseConfig'; // Your Firebase app initialization
import { Coin } from '../types/inventory'; // Coin type interface
import { PreloadedCoinData } from '../types/preloadedCoin'; // Import PreloadedCoinData

// Initialize Firestore
const db = getFirestore(app);
const coinsCollectionRef = collection(db, 'coins');
const preloadedCoinsCollectionRef = collection(db, 'preloadedCoins'); // New collection ref

/**
 * Adds a new coin to the 'coins' collection in Firestore.
 * @param userId - The ID of the user adding the coin.
 * @param coinData - The coin data (excluding id, userId, createdAt, updatedAt).
 * @returns A Promise that resolves with the DocumentReference of the newly added coin.
 */
export const addCoin = async (
  userId: string,
  coinData: Omit<Coin, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<DocumentReference> => {
  if (!userId) {
    throw new Error('User ID is required to add a coin.');
  }
  try {
    const newCoinData = {
      ...coinData,
      userId: userId,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      // Convert purchaseDate string to Timestamp if it's not already
      purchaseDate: coinData.purchaseDate instanceof Timestamp ? coinData.purchaseDate : Timestamp.fromDate(new Date(coinData.purchaseDate)),
    };
    const docRef = await addDoc(coinsCollectionRef, newCoinData);
    return docRef;
  } catch (error) {
    console.error('Error adding coin to Firestore: ', error);
    throw error;
  }
};

/**
 * Fetches preloaded coin data in real-time.
 * @param onSnapshotCallback - Callback function to be called with the array of PreloadedCoinData.
 * @returns An unsubscribe function to detach the listener.
 */
export const getPreloadedCoins = (
  onSnapshotCallback: (coins: PreloadedCoinData[]) => void
): Unsubscribe => {
  const q = query(preloadedCoinsCollectionRef);

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const preloadedCoins: PreloadedCoinData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        preloadedCoins.push({
          id: doc.id,
          name: data.name,
          metalType: data.metalType,
          weightOz: data.weightOz,
          weightG: data.weightG,
          purity: data.purity,
          commonYearRange: data.commonYearRange,
          finenessMarking: data.finenessMarking,
          country: data.country,
          description: data.description,
        } as PreloadedCoinData);
      });
      onSnapshotCallback(preloadedCoins);
    },
    (error) => {
      console.error('Error fetching preloaded coins from Firestore: ', error);
      onSnapshotCallback([]);
    }
  );
  return unsubscribe;
};

/**
 * Adds an array of preloaded coin data to the 'preloadedCoins' collection in Firestore.
 * Skips adding if a coin with the same name already exists.
 * @param coinsData - An array of PreloadedCoinData objects.
 * @returns A Promise that resolves when the batch operation is complete.
 */
export const batchAddPreloadedCoins = async (coinsData: PreloadedCoinData[]): Promise<void> => {
  const batch = writeBatch(db);
  let operationsCount = 0;

  for (const coin of coinsData) {
    // Check if a coin with the same name already exists
    const q = query(preloadedCoinsCollectionRef, where('name', '==', coin.name));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // If no existing coin with the same name, add it to the batch
      const docRef = doc(preloadedCoinsCollectionRef); // Firestore generates ID
      batch.set(docRef, coin);
      operationsCount++;
      console.log(`Coin "${coin.name}" will be added.`);
    } else {
      console.log(`Coin "${coin.name}" already exists. Skipping.`);
    }
  }

  if (operationsCount > 0) {
    try {
      await batch.commit();
      console.log(`${operationsCount} new preloaded coins added successfully.`);
    } catch (error) {
      console.error('Error batch adding preloaded coins: ', error);
      throw error;
    }
  } else {
    console.log('No new preloaded coins to add.');
  }
};

/**
 * Fetches coins for a given userId in real-time.
 * @param userId - The ID of the user whose coins to fetch.
 * @param onSnapshotCallback - Callback function to be called with the array of coins.
 * @returns An unsubscribe function to detach the listener.
 */
export const getCoins = (
  userId: string,
  onSnapshotCallback: (coins: Coin[]) => void
): Unsubscribe => {
  if (!userId) {
    console.error('User ID is required to get coins.');
    onSnapshotCallback([]); // Return empty if no user ID
    return () => {}; // Return a no-op unsubscribe function
  }
  const q = query(coinsCollectionRef, where('userId', '==', userId));

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const coins: Coin[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        coins.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          metalType: data.metalType,
          year: data.year,
          weight: data.weight,
          weightUnit: data.weightUnit,
          purity: data.purity,
          purchasePrice: data.purchasePrice,
          purchaseDate: data.purchaseDate, // Already a Timestamp from Firestore
          resaleMarketValue: data.resaleMarketValue,
          createdAt: data.createdAt, // Already a Timestamp
          updatedAt: data.updatedAt, // Already a Timestamp
        } as Coin);
      });
      onSnapshotCallback(coins);
    },
    (error) => {
      console.error('Error fetching coins from Firestore: ', error);
      // Optionally, call the callback with an empty array or an error indicator
      onSnapshotCallback([]);
    }
  );

  return unsubscribe;
};

/**
 * Updates an existing coin in Firestore.
 * @param coinId - The ID of the coin to update.
 * @param coinData - An object containing the fields to update.
 * @returns A Promise that resolves when the update is complete.
 */
export const updateCoin = async (
  coinId: string,
  coinData: Partial<Omit<Coin, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  if (!coinId) {
    throw new Error('Coin ID is required to update a coin.');
  }
  const coinDocRef = doc(db, 'coins', coinId);
  const updateData: any = {
    ...coinData,
    updatedAt: serverTimestamp() as Timestamp,
  };

  // If purchaseDate is being updated and is a string, convert it
  if (coinData.purchaseDate && !(coinData.purchaseDate instanceof Timestamp)) {
    updateData.purchaseDate = Timestamp.fromDate(new Date(coinData.purchaseDate as any));
  }


  try {
    await updateDoc(coinDocRef, updateData);
  } catch (error) {
    console.error('Error updating coin in Firestore: ', error);
    throw error;
  }
};

/**
 * Deletes a coin from Firestore.
 * @param coinId - The ID of the coin to delete.
 * @returns A Promise that resolves when the deletion is complete.
 */
export const deleteCoin = async (coinId: string): Promise<void> => {
  if (!coinId) {
    throw new Error('Coin ID is required to delete a coin.');
  }
  const coinDocRef = doc(db, 'coins', coinId);
  try {
    await deleteDoc(coinDocRef);
  } catch (error) {
    console.error('Error deleting coin from Firestore: ', error);
    throw error;
  }
};
