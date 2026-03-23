import { NextResponse } from 'next/server';
import { analyzePostServer } from '@/lib/gemini-server';

export async function POST(req: Request) {
  const { text } = await req.json();
  try {
    const result = await analyzePostServer(text);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json({ error: 'Failed to analyze post' }, { status: 500 });
  }
}
