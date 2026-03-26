import { SiweMessage } from 'siwe';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-change-this');

export async function generateNonce(): Promise<string> {
  return Math.random().toString(36).substring(2, 15);
}

export async function verifySignature(message: string, signature: string, nonce: string): Promise<boolean> {
  try {
    const siweMessage = new SiweMessage(message);
    const { data } = await siweMessage.verify({ signature, nonce });
    return !!data;
  } catch (e) {
    return false;
  }
}

export async function createSession(address: string): Promise<string> {
  return await new SignJWT({ address })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.address as string;
  } catch (e) {
    return null;
  }
}
