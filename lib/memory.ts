import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export interface AgentMemory {
  chatId: string;
  history: { role: 'user' | 'assistant', content: string, timestamp: number }[];
  lastUpdated: number;
}

export async function getAgentMemory(chatId: string): Promise<AgentMemory> {
  const docRef = doc(db, 'agent_memory', chatId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as AgentMemory;
  }
  
  return { chatId, history: [], lastUpdated: Date.now() };
}

export async function saveAgentMemory(chatId: string, role: 'user' | 'assistant', content: string) {
  const docRef = doc(db, 'agent_memory', chatId);
  const docSnap = await getDoc(docRef);
  
  const entry = { role, content, timestamp: Date.now() };
  
  if (docSnap.exists()) {
    await updateDoc(docRef, {
      history: arrayUnion(entry),
      lastUpdated: Date.now()
    });
  } else {
    await setDoc(docRef, {
      chatId,
      history: [entry],
      lastUpdated: Date.now()
    });
  }
}
