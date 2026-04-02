import { NextResponse } from 'next/server';
import { requestLLM } from '@/lib/gemini-server';
import { dbAdmin } from '@/lib/firebase-admin';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export async function POST(req: Request) {
  const apiKey = req.headers.get('X-Admin-API-Key');
  if (!ADMIN_API_KEY || apiKey !== ADMIN_API_KEY) {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  const { question } = await req.json();

  // 1. Fetch internal state from Firestore
  const agentsSnap = await dbAdmin.collection('agents').get();
  const transactionsSnap = await dbAdmin.collection('transactions').limit(10).get();

  const agents = agentsSnap.docs.map(doc => doc.data());
  const transactions = transactionsSnap.docs.map(doc => doc.data());

  // 2. System Monitor Prompt
  const systemPrompt = `You are Noisezer's System Monitor. 
  You have access to internal state:
  Agents: ${JSON.stringify(agents)}
  Recent Transactions: ${JSON.stringify(transactions)}
  
  Answer questions about internal system health, autonomous operations, and activity logs. 
  Be precise, technical, and transparent.`;

  // 3. Get response from Gemini
  const response = await requestLLM(question, systemPrompt);

  return NextResponse.json({ response });
}
