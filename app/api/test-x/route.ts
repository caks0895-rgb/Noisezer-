import { NextResponse } from 'next/server';
import { fetchRecentTweets } from '@/lib/x-fetcher';

export async function GET() {
  try {
    const tweets = await fetchRecentTweets('Base chain alpha');
    return NextResponse.json({ success: true, tweets });
  } catch (error) {
    console.error('Test X Fetcher error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
