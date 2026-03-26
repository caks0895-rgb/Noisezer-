// lib/cache.ts
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface CachedConsensus {
  score: number;
  lastUpdated: number;
}

const COLLECTION = 'consensus_cache';

export async function updateConsensusCache(marketId: string, score: number): Promise<void> {
  const path = `${COLLECTION}/${marketId}`;
  try {
    await setDoc(doc(db, COLLECTION, marketId), {
      score,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getConsensusCache(marketId: string): Promise<CachedConsensus | null> {
  const path = `${COLLECTION}/${marketId}`;
  try {
    const docSnap = await getDoc(doc(db, COLLECTION, marketId));
    if (docSnap.exists()) {
      return docSnap.data() as CachedConsensus;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}
