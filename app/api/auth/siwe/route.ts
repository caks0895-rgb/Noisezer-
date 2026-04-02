import { NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import { admin } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { message, signature } = await req.json();
    const siweMessage = new SiweMessage(message);
    
    // Verify signature
    const fields = await siweMessage.verify({ signature });
    
    // Create or get Firebase user
    const uid = `eth:${fields.data.address.toLowerCase()}`;
    
    try {
      await admin.auth().getUser(uid);
    } catch (error) {
      await admin.auth().createUser({
        uid,
        displayName: fields.data.address,
      });
    }
    
    // Create custom token
    const customToken = await admin.auth().createCustomToken(uid);
    
    return NextResponse.json({ customToken });
  } catch (error) {
    console.error('SIWE Auth Error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
