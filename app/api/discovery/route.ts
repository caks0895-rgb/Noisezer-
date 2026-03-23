import { NextResponse } from 'next/server';
import { getBaseAlphaInsights } from '@/lib/discovery';
import { analyzeDiscoveryDataServer } from '@/lib/gemini-server';

export async function GET() {
  try {
    const rawData = await getBaseAlphaInsights();
    const insights = await analyzeDiscoveryDataServer(rawData.rawData);
    return NextResponse.json({ insights, timestamp: rawData.timestamp });
  } catch (error) {
    console.error('Discovery API error:', error);
    return NextResponse.json({ error: 'Failed to fetch discovery data' }, { status: 500 });
  }
}
