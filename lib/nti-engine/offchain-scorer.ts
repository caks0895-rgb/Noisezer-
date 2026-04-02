import { OffChainData } from '../data-fetcher/types';
import { ScoreBreakdown } from './types';

export function calculateOffChainScore(data: OffChainData): ScoreBreakdown {
  const sentimentPoints = (data.sentimentScore || 0) * 30;
  const mentionsPoints = Math.min(((data.mentions || 0) / 500) * 20, 20);
  const narrativePoints = (data.narrativeStrength || 0) * 20;
  const influencerPoints = Math.min(((data.sources?.length || 0) / 10) * 20, 20);
  const engagementPoints = Math.min(((data.mentions || 0) / 1000) * 10, 10);

  const totalScore = sentimentPoints + mentionsPoints + narrativePoints + influencerPoints + engagementPoints;

  return {
    score: totalScore,
    breakdown: {
      sentiment: { points: sentimentPoints, value: data.sentimentScore || 0 },
      mentions: { points: mentionsPoints, value: data.mentions || 0 },
      narrative: { points: narrativePoints, value: data.narrativeStrength || 0 },
      influencers: { points: influencerPoints, value: data.sources?.length || 0 },
      engagement: { points: engagementPoints, value: data.mentions || 0 }
    }
  };
}
