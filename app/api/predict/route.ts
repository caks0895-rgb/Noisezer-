import { NextResponse } from 'next/server';
import { getConsensusCache } from '@/lib/cache';

/**
 * Endpoint: /api/predict
 * Returns the latest consensus prediction in JSON format.
 * 
 * Example usage:
 * GET /api/predict?marketId=base_alpha_001
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const marketId = searchParams.get('marketId');

  if (!marketId) {
    return NextResponse.json(
      { error: 'Missing marketId parameter' },
      { status: 400 }
    );
  }

  try {
    const cachedData = await getConsensusCache(marketId);

    if (!cachedData) {
      return NextResponse.json(
        { error: 'Prediction not found or not yet calculated' },
        { status: 404 }
      );
    }

    // Noisezer Output Format (JSON Murni)
    return NextResponse.json({
      market_id: marketId,
      consensus_score: cachedData.score,
      last_updated: new Date(cachedData.lastUpdated).toISOString(),
      status: 'success',
      agent: 'Noisezer'
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
