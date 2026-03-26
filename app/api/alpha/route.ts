import { NextResponse } from 'next/server';
import { getBaseAlphaInsights } from '@/lib/discovery';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { checkRateLimit } from '@/lib/rateLimit';

const API_KEY = process.env.NOISEZER_API_KEY;
const COST_PER_QUERY = 0.25;

export async function GET(request: Request) {
  const authHeader = request.headers.get('x-api-key');
  let isPaid = false;
  if (API_KEY && authHeader === API_KEY) {
    isPaid = true;
  }

  if (!isPaid) {
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
    const allowed = await checkRateLimit(identifier);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
  }

  try {
    // 1. Ambil data agent dari Firebase (hanya jika paid)
    if (isPaid) {
      const agentRef = doc(db, 'agents', 'noisezer-main');
      const agentSnap = await getDoc(agentRef);
      
      if (!agentSnap.exists()) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      const agentData = agentSnap.data();
      
      // 2. Cek saldo
      if ((agentData.x402Balance || 0) < COST_PER_QUERY) {
        return NextResponse.json({ error: 'Insufficient X402 balance' }, { status: 402 });
      }

      // 3. Deduct saldo dan catat transaksi
      await updateDoc(agentRef, {
        x402Balance: agentData.x402Balance - COST_PER_QUERY,
        totalEarned: (agentData.totalEarned || 0) + COST_PER_QUERY
      });

      const txId = `tx-api-${Date.now()}`;
      await setDoc(doc(db, 'transactions', txId), {
        id: txId,
        from: agentData.name,
        to: 'Noisezer',
        amount: COST_PER_QUERY,
        status: 'success',
        timestamp: Date.now(),
        type: 'API_QUERY'
      });
    }

    // 4. Ambil data alpha
    const insights = await getBaseAlphaInsights();
    
    return NextResponse.json({
      success: true,
      data: insights,
      cost: isPaid ? COST_PER_QUERY : 0
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
