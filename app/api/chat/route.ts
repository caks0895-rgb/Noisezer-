import { NextResponse } from 'next/server';
import { requestLLM, HUMAN_SYSTEM_PROMPT } from '@/lib/gemini-server';

const UNLOGGED_SYSTEM_PROMPT = `
${HUMAN_SYSTEM_PROMPT}
CRITICAL: The user is NOT logged in. You can ONLY answer questions about what Noisezer is, how it works, and usage guides. 
If the user asks for on-chain data, token analysis, or financial actions, politely decline and ask them to connect their wallet.
`;

const LOGGED_IN_SYSTEM_PROMPT = `
${HUMAN_SYSTEM_PROMPT}
CRITICAL: The user is logged in. You can provide on-chain data analysis and token reports. 
You MUST NOT perform any financial actions (God Mode). 
You MUST NOT leak personal or sensitive data. 
Keep responses concise to prevent spam. 
If the user asks for financial execution or God Mode features, politely decline and state that these are reserved for the Telegram bot.
`;

export async function POST(req: Request) {
  try {
    const { prompt, historyContext, uid } = await req.json();
    
    // Combine history with prompt
    const fullPrompt = historyContext ? `${historyContext}\nUser: ${prompt}` : prompt;
    
    const systemPrompt = uid ? LOGGED_IN_SYSTEM_PROMPT : UNLOGGED_SYSTEM_PROMPT;
    
    const responseText = await requestLLM(fullPrompt, 'gemini-3-flash', 0, systemPrompt);
    
    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json({ error: 'Failed to get response from LLM' }, { status: 500 });
  }
}
