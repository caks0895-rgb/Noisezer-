import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export async function checkRateLimit(identifier: string): Promise<boolean> {
  const ref = doc(db, 'rate_limits', identifier);
  const snap = await getDoc(ref);
  const now = Date.now();
  const today = new Date(now).toDateString();
  
  if (!snap.exists()) {
    await setDoc(ref, { count: 1, lastReset: today });
    return true;
  }
  
  const data = snap.data();
  if (data.lastReset !== today) {
    await updateDoc(ref, { count: 1, lastReset: today });
    return true;
  }
  
  if (data.count < 3) {
    await updateDoc(ref, { count: data.count + 1 });
    return true;
  }
  
  return false;
}
