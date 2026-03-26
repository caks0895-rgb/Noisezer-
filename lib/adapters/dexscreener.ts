export async function fetchDexScreenerData(tokenAddress: string): Promise<any> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    if (!res.ok) throw new Error(`DexScreener API error! status: ${res.status}`);
    const data = await res.json();
    
    if (data.pairs && data.pairs.length > 0) {
      // Return the pair with highest liquidity
      const bestPair = data.pairs.sort((a: any, b: any) => parseFloat(b.liquidity.usd) - parseFloat(a.liquidity.usd))[0];
      return {
        priceUsd: bestPair.priceUsd,
        liquidityUsd: bestPair.liquidity.usd,
        volume24h: bestPair.volume.h24,
        priceChange24h: bestPair.priceChange.h24,
        dex: bestPair.dexId,
        fdv: bestPair.fdv,
        marketCap: bestPair.marketCap,
        pairCreatedAt: bestPair.pairCreatedAt
      };
    }
    return { error: 'No pairs found' };
  } catch (e) {
    console.error('[DEXSCREENER] Error:', e);
    return { error: 'Failed to fetch on-chain data' };
  }
}
