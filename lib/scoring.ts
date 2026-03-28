export interface OnChainData {
  liquidity: number; // in USD
  holders: number;
  ageDays: number;
  totalSupply: number;
}

export interface OffChainData {
  sentimentScore: number; // 0-100
  narrativeStrength: number; // 0-100
}

export function calculateNTI(onChain: OnChainData, offChain: OffChainData): { score: number; verdict: string } {
  let score = 50; // Base score

  // 1. Liquidity Logic (Hard Data)
  if (onChain.liquidity < 10000) score -= 30;
  else if (onChain.liquidity < 50000) score -= 10;
  else score += 10;

  // 2. Age Logic
  if (onChain.ageDays < 1) score -= 20;
  else if (onChain.ageDays > 7) score += 10;

  // 3. Sentiment vs Reality (The Core Truth Filter)
  // If Sentiment is high but Liquidity is low -> Divergence (BS)
  if (offChain.sentimentScore > 80 && onChain.liquidity < 50000) {
    score -= 20;
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  let verdict = "NEUTRAL";
  if (score > 75) verdict = "OPPORTUNITY_HIGH";
  else if (score > 50) verdict = "OPPORTUNITY_LOW";
  else verdict = "HIGH_RISK";

  return { score, verdict };
}
