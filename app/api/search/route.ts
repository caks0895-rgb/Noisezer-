import { NextResponse } from 'next/server';
import { searchSignalServerCoT } from '@/lib/gemini-server';
import { recordApiCost, recordRevenue } from '@/lib/economic-engine';
import { OnChainData, OffChainData } from '@/lib/scoring';
import { ErrorResponse } from '@/lib/a2a-schema';
import { dbAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const DAILY_LIMIT = 5;

function sendError(code: string, message: string, status: number = 400): NextResponse<ErrorResponse> {
  return NextResponse.json({ status: 'error', code, message }, { status });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { contract_address, agentId, isPaid } = body;

  if (!contract_address) {
    return sendError('INVALID_REQUEST', 'Missing contract_address parameter');
  }

  // 1. Check for API Key (Paid access)
  const apiKey = req.headers.get('X-Noisezer-API-Key');
  const isValidKey = apiKey && process.env.NOISEZER_API_KEY === apiKey;

  if (!isValidKey) {
    // 2. If no valid API Key, check for free quota (requires agentId)
    if (!agentId) {
      return sendError('UNAUTHORIZED', 'Invalid API Key or missing agentId for free quota', 401);
    }

    const today = new Date().toISOString().split('T')[0];
    const quotaRef = dbAdmin.collection('quotas').doc(agentId);
    const quotaSnap = await quotaRef.get();

    if (!quotaSnap.exists) {
      await quotaRef.set({ count: 1, lastReset: today, uid: agentId });
    } else {
      const data = quotaSnap.data();
      if (data?.lastReset !== today) {
        await quotaRef.update({ count: 1, lastReset: today });
      } else if ((data?.count || 0) >= DAILY_LIMIT) {
        return sendError('PAYMENT_REQUIRED', 'Kuota harian (5) habis. Bayar via X402.', 402);
      } else {
        await quotaRef.update({ count: FieldValue.increment(1) });
      }
    }
  }

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
