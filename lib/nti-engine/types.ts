export interface ScoreBreakdown {
  score: number;
  breakdown: Record<string, { points: number; value: any }>;
}

export interface NTIResult {
  nti_score: number;
  verdict: 'ALPHA_SIGNAL' | 'NEUTRAL' | 'BS_SIGNAL';
  confidence: number;
  analysis: {
    on_chain: ScoreBreakdown;
    off_chain: ScoreBreakdown;
  };
}
