import { NextResponse } from 'next/server';
import { getBaseAlphaInsights } from '@/lib/discovery';
import { analyzeNoiseServer } from '@/lib/gemini-server';

export async function GET() {
  console.log('[API] Discovery GET called');
  try {
    const rawData = await getBaseAlphaInsights();
    console.log('[API] Discovery rawData:', rawData ? 'Success' : 'Failed');
    
    if (!rawData || !rawData.rawData) {
      throw new Error('No rawData returned from getBaseAlphaInsights');
    }

    const insights = await analyzeNoiseServer('base', rawData.rawData);
    console.log('[API] Discovery insights analyzed');
    
    return NextResponse.json({ insights, timestamp: rawData.timestamp });
  } catch (error) {
    console.error('Discovery API error details:', error);
    return NextResponse.json({ error: 'Failed to fetch discovery data', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
