import { getRecentBaseActivity } from './blockchain';

// Simple Cache for Discovery
const discoveryCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1800000; // 30 minutes

export async function getBaseAlphaInsights() {
  const cacheKey = 'base_alpha_insights';
  const cached = discoveryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // 1. Fetch DexScreener Data (New Pairs on Base)
    const dexResponse = await fetch('https://api.dexscreener.com/latest/dex/tokens/base');
    const dexData = dexResponse.ok ? await dexResponse.json() : { pairs: [] };

    // 2. Fetch RSS News (Example: CryptoPanic - using public feed without token for now)
    const rssResponse = await fetch('https://cryptopanic.com/api/v1/posts/?public=true');
    const rssData = rssResponse.ok ? await rssResponse.json() : { results: [] };

    // 3. GitHub Activity (Placeholder for Base-related repos)
    const ghResponse = await fetch('https://api.github.com/repos/base-org/node/commits?per_page=5');
    const ghData = ghResponse.ok ? await ghResponse.json() : [];

    // 4. On-chain Activity
    const onChainData = await getRecentBaseActivity();

    // 5. Polymarket Order Book (Placeholder for BTC prediction market)
    // Note: In a real scenario, we'd need to resolve the market ID from the URL.
    const polymarketData = await getPolymarketOrderBook('21033'); // Placeholder ID

    // Combine and Analyze (This will be passed to Gemini)
    const rawData = {
      dex: dexData.pairs?.slice(0, 5) || [],
      news: rssData.results?.slice(0, 5) || [],
      github: Array.isArray(ghData) ? ghData.slice(0, 3) : [],
      onChain: onChainData,
      polymarket: polymarketData
    };

    // Note: Analysis happens in gemini.ts
    const result = {
      rawData,
      timestamp: Date.now()
    };

    discoveryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error('Discovery failed:', error);
    return { rawData: null, timestamp: Date.now() };
  }
}

/**
 * Get Polymarket Order Book for a specific market
 */
export async function getPolymarketOrderBook(marketId: string) {
  try {
    const response = await fetch(`https://gamma-api.polymarket.com/orderbook?marketId=${marketId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching Polymarket order book:', error);
    return null;
  }
}
