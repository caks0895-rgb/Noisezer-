import { calculateOnChainScore } from './onchain-scorer';
import { calculateOffChainScore } from './offchain-scorer';
import { calculateNTI, determineVerdict } from './nti-calculator';
import { OnChainData, OffChainData } from '../data-fetcher/types';
import { NTIResult } from './types';

export function runNTIEngine(onChain: OnChainData, offChain: OffChainData): NTIResult {
  const onChainScore = calculateOnChainScore(onChain);
  const offChainScore = calculateOffChainScore(offChain);
  const nti = calculateNTI(onChainScore, offChainScore);
  const verdict = determineVerdict(nti);

  return {
    nti_score: nti,
    verdict,
    confidence: 0.9, // Placeholder
    analysis: {
      on_chain: onChainScore,
      off_chain: offChainScore
    }
  };
}
