export interface OnChainData {
  liquidity: number;
  holders: number;
  volume24h: number;
  velocity: number;
  isVerified: boolean;
  totalSupply: string;
}

export interface OffChainData {
  sentimentScore: number;
  mentions: number;
  narrativeStrength: number;
  sources: string[];
}

export interface DataFetcherResult {
  onChain: OnChainData | null;
  offChain: OffChainData | null;
  error?: string;
}
