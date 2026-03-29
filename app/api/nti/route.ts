import { NextResponse } from 'next/server';
import { NTIRequestSchema } from '../../../lib/schemas/noisezer';
import { fetchAllData } from '../../../lib/data-fetcher';
import { runNTIEngine } from '../../../lib/nti-engine';
import { generateNarrative } from './narrator';
import { rateLimit } from '../../../lib/utils/rate-limit';
import { auditLog } from '../../../lib/utils/audit-logger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = NTIRequestSchema.parse(body);
    
    // Rate Limiting
    rateLimit(req.headers.get('x-forwarded-for') || 'anonymous', 100, 60000);

    // Pipeline
    const data = await fetchAllData(validatedData.ca);
    if (!data.onChain || !data.offChain) throw new Error('Data fetch failed');
    
    const ntiResult = runNTIEngine(data.onChain, data.offChain);
    const narrative = await generateNarrative(ntiResult);

    // Audit Log
    auditLog({
      timestamp: new Date(),
      event_type: 'NTI_ANALYSIS',
      ca: validatedData.ca,
      result: ntiResult.verdict
    });

    return NextResponse.json({ ...ntiResult, narrative });
  } catch (error) {
    console.error('[API ERROR]', error);
    return NextResponse.json({ status: 'error', message: 'Analysis failed' }, { status: 400 });
  }
}
