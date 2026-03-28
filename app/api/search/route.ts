import { NextResponse } from 'next/server';
import { searchSignalServerCoT } from '@/lib/gemini-server';
import { recordApiCost, recordRevenue } from '@/lib/economic-engine';
import { OnChainData, OffChainData } from '@/lib/scoring';
import { ErrorResponse } from '@/lib/a2a-schema';

// Simple API Key validation (In production, use Firebase/Database)
const VALID_API_KEYS = new Set([process.env.NOISEZER_API_KEY || 'dev-key-123']);
const DAILY_LIMIT = 10; // Updated to 10

function sendError(code: string, message: string, status: number = 400): NextResponse<ErrorResponse> {
  return NextResponse.json({ status: 'error', code, message }, { status });
}

export async function POST(req: Request) {
  const apiKey = req.headers.get('X-Noisezer-API-Key');
  if (!apiKey || !VALID_API_KEYS.has(apiKey)) {
    return sendError('UNAUTHORIZED', 'Invalid or missing API Key', 401);
  }

  // TODO: Implement actual Firebase quota tracking here
  // For now, enforcing the limit logic structure
  const currentUsage = 0; // Placeholder: Fetch from Firebase
  if (currentUsage >= DAILY_LIMIT) {
    return sendError('PAYMENT_REQUIRED', 'Kuota harian (10) habis. Bayar via X402.', 402);
  }

  const body = await req.json();
  if (!body.contract_address) {
    return sendError('INVALID_REQUEST', 'Missing contract_address parameter');
  }

  const { contract_address, isPaid } = body;

  if (isPaid) {
    recordRevenue();
  }

  try {
    recordApiCost();
    const mockOnChain: OnChainData = { liquidity: 50000, holders: 100, ageDays: 2, totalSupply: 1000000 };
    const mockOffChain: OffChainData = { sentimentScore: 50, narrativeStrength: 50 };
    const result = await searchSignalServerCoT(contract_address, mockOnChain, mockOffChain);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Search API error:', error);
    return sendError('INTERNAL_SERVER_ERROR', 'Failed to search signal', 500);
  }
}
