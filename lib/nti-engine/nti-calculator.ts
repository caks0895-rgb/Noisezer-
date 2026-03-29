import { ScoreBreakdown } from './types';

export function calculateNTI(onChain: ScoreBreakdown, offChain: ScoreBreakdown): number {
  const offChainScore = offChain.score === 0 ? 1 : offChain.score;
  const nti = (onChain.score / offChainScore) * 100;
  return Math.min(nti, 200);
}

export function determineVerdict(nti: number): 'ALPHA_SIGNAL' | 'NEUTRAL' | 'BS_SIGNAL' {
  if (nti >= 80) return 'ALPHA_SIGNAL';
  if (nti < 40) return 'BS_SIGNAL';
  return 'NEUTRAL';
}
