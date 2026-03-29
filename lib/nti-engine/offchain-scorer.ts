import { OffChainData } from '../data-fetcher/types';
import { ScoreBreakdown } from './types';

export function calculateOffChainScore(data: OffChainData): ScoreBreakdown {
  const sentimentPoints = data.sentimentScore * 30;
  const mentionsPoints = Math.min((data.mentions / 500) * 20, 20);
  const narrativePoints = data.narrativeStrength * 20;
  const influencerPoints = Math.min((data.sources.length / 10) * 20, 20);
  const engagementPoints = Math.min((data.mentions / 1000) * 10, 10);

  const totalScore = sentimentPoints + mentionsPoints + narrativePoints + influencerPoints + engagementPoints;

  return {
    score: totalScore,
    breakdown: {
      sentiment: { points: sentimentPoints, value: data.sentimentScore },
      mentions: { points: mentionsPoints, value: data.mentions },
      narrative: { points: narrativePoints, value: data.narrativeStrength },
      influencers: { points: influencerPoints, value: data.sources.length },
      engagement: { points: engagementPoints, value: data.mentions }
    }
  };
}
