// lib/normalizer.ts

/**
 * Normalizes raw data from adapters into a 0.0 - 1.0 scale.
 */

export function normalizeBaseChainData(liquidityChange24h: number, activeContracts: number): number {
  // Logic: 
  // - Liquidity change > 5% is very bullish (1.0)
  // - Active contracts > 1000 is healthy (1.0)
  const liquidityScore = Math.min(Math.max(liquidityChange24h / 5, 0), 1);
  const contractScore = Math.min(Math.max(activeContracts / 1000, 0), 1);
  
  return (liquidityScore * 0.6) + (contractScore * 0.4);
}

export function normalizePolymarketData(odds: number, volume24h: number): number {
  // Logic:
  // - Odds are already 0.0 - 1.0
  // - Volume > 500k is high activity (1.0)
  const volumeScore = Math.min(Math.max(volume24h / 500000, 0), 1);
  
  return (odds * 0.7) + (volumeScore * 0.3);
}
