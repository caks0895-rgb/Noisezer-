import { OnChainData } from '../data-fetcher/types';
import { ScoreBreakdown } from './types';

export function calculateOnChainScore(data: OnChainData): ScoreBreakdown {
  const liquidityPoints = Math.min((data.liquidity / 5000000) * 30, 30);
  const holdersPoints = Math.min((data.holders / 50000) * 20, 20);
  const volumePoints = Math.min((data.volume24h / 1000000) * 20, 20);
  const velocityPoints = Math.min((data.velocity / 1000) * 20, 20);
  const verifiedPoints = data.isVerified ? 10 : 0;

  const totalScore = liquidityPoints + holdersPoints + volumePoints + velocityPoints + verifiedPoints;

  return {
    score: totalScore,
    breakdown: {
      liquidity: { points: liquidityPoints, value: data.liquidity },
      holders: { points: holdersPoints, value: data.holders },
      volume: { points: volumePoints, value: data.volume24h },
      velocity: { points: velocityPoints, value: data.velocity },
      verified: { points: verifiedPoints, value: data.isVerified }
    }
  };
}
