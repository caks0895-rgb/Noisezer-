import { NextResponse } from 'next/server';
import { searchSignalServer } from '@/lib/gemini-server';
import { recordApiCost, recordRevenue } from '@/lib/economic-engine';

export async function POST(req: Request) {
  const { query, isPaid } = await req.json();

  // Placeholder for payment verification
  if (isPaid) {
    recordRevenue();
  }

  try {
    recordApiCost();
    const result = await searchSignalServer(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Failed to search signal' }, { status: 500 });
  }
}
