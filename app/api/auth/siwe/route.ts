import { NextResponse } from 'next/server';
import { generateNonce, verifySignature, createSession } from '@/lib/siwe';
import { cookies } from 'next/headers';

export async function GET() {
  const nonce = await generateNonce();
  return NextResponse.json({ nonce });
}

export async function POST(request: Request) {
  const { message, signature, nonce } = await request.json();

  const isValid = await verifySignature(message, signature, nonce);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const sessionToken = await createSession(new URL(message).searchParams.get('address') || '');
  
  (await cookies()).set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return NextResponse.json({ success: true });
}
