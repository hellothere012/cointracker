import { NextResponse } from 'next/server';

interface MetalsDevResponse {
  status: string;
  currency: string;
  unit: string;
  metals: {
    gold?: number;
    silver?: number;
    platinum?: number;
    palladium?: number; // Example, Metals.dev provides this
    // Other metals might be present
    [key: string]: number | undefined;
  };
  currencies: {
    [key: string]: number;
  };
  timestamp: string; // ISO 8601 timestamp string e.g. "2023-07-04T09:01:04.744Z"
}

// Standardized response structure for our API
interface SpotPriceResponse {
  XAUUSD: number | null;
  XAGUSD: number | null;
  XPTUSD: number | null;
  source: string;
  timestamp: number; // Unix timestamp of the prices from the source
  lastFetched?: number; // Optional: Unix timestamp of when our server fetched it
}

// In-memory cache variables
let cachedSpotPrices: SpotPriceResponse | null = null;
let lastFetchTimestamp: number | null = null; // Unix timestamp (ms) of the last successful fetch

const CACHE_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

export async function GET() {
  // Check cache first
  if (cachedSpotPrices && lastFetchTimestamp && (Date.now() - lastFetchTimestamp) < CACHE_DURATION_MS) {
    console.log('Serving spot prices from cache.');
    return NextResponse.json({ ...cachedSpotPrices, lastFetched: Math.floor(lastFetchTimestamp / 1000) });
  }

  console.log('Cache stale or empty. Fetching fresh spot prices.');
  const apiKey = process.env.METALS_DEV_API_KEY;

  if (!apiKey) {
    console.error('METALS_DEV_API_KEY environment variable is not set.');
    return NextResponse.json(
      { error: 'API key for spot prices is not configured. Please set METALS_DEV_API_KEY.' },
      { status: 500 }
    );
  }

  const externalApiUrl = `https://api.metals.dev/v1/latest?api_key=${apiKey}`;

  try {
    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        // Metals.dev typically doesn't require special headers beyond the API key in query
      },
      // It's good practice to set a timeout for external API calls
      // cache: 'no-store', // To ensure fresh data, or use revalidate options
    });

    if (!response.ok) {
      const errorData = await response.text(); // Try to get more error info
      console.error(`Error fetching spot prices from Metals.dev: ${response.status} ${response.statusText}`, errorData);
      return NextResponse.json(
        { error: `Failed to fetch spot prices from provider. Status: ${response.status}. ${errorData}` },
        { status: response.status }
      );
    }

    const data: MetalsDevResponse = await response.json();

    if (data.status !== 'success' || !data.metals) {
        console.error('Metals.dev API response indicates failure or missing metals data:', data);
        return NextResponse.json(
            { error: 'Failed to retrieve valid spot price data from provider.', details: data },
            { status: 500 }
        );
    }

    // Convert ISO timestamp to Unix timestamp (seconds)
    const unixTimestamp = Math.floor(new Date(data.timestamp).getTime() / 1000);

    const freshSpotPrices: SpotPriceResponse = {
      XAUUSD: data.metals.gold !== undefined ? data.metals.gold : null,
      XAGUSD: data.metals.silver !== undefined ? data.metals.silver : null,
      XPTUSD: data.metals.platinum !== undefined ? data.metals.platinum : null,
      source: 'Metals.dev',
      timestamp: unixTimestamp,
    };

    // Update cache
    cachedSpotPrices = freshSpotPrices;
    lastFetchTimestamp = Date.now();
    console.log('Spot prices fetched and cache updated.');

    return NextResponse.json({ ...freshSpotPrices, lastFetched: Math.floor(lastFetchTimestamp / 1000) });

  } catch (error: unknown) {
    let errorMessage = 'An unexpected error occurred while fetching spot prices.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('Error in spot prices API route:', error); // Log the original error object for more details server-side
    // Do not update cache with error
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching spot prices.', details: errorMessage },
      { status: 500 }
    );
  }
}
