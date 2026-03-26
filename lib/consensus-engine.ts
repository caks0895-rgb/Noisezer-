// lib/consensus-engine.ts

/**
 * Calculates the weighted consensus score from 5 normalized sources.
 * Weights: 
 * - On-Chain: 50%
 * - News: 20%
 * - Polymarket: 15%
 * - Social: 10%
 * - GitHub: 5%
 */

export interface ConsensusInputs {
  onChain: number;
  news: number;
  polymarket: number;
  social: number;
  github: number;
}

export function calculateConsensus(inputs: ConsensusInputs): number {
  const weights = {
    onChain: 0.5,
    news: 0.2,
    polymarket: 0.15,
    social: 0.1,
    github: 0.05,
  };

  const consensusScore = 
    (inputs.onChain * weights.onChain) +
    (inputs.news * weights.news) +
    (inputs.polymarket * weights.polymarket) +
    (inputs.social * weights.social) +
    (inputs.github * weights.github);

  return Math.min(Math.max(consensusScore, 0), 1);
}
