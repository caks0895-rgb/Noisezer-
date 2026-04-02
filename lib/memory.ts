import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export interface AgentMemory {
  chatId: string;
  uid: string;
  history: { role: 'user' | 'assistant', content: string, timestamp: number }[];
  lastUpdated: number;
}

export async function getAgentMemory(chatId: string, uid: string): Promise<AgentMemory> {
  const normalizedChatId = chatId.toLowerCase();
  const path = `agent_memory/${normalizedChatId}`;
  try {
    const docRef = doc(db, 'agent_memory', normalizedChatId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.uid !== uid) {
        if (chatId.toLowerCase() === auth.currentUser?.email?.toLowerCase()) {
          await updateDoc(docRef, { uid: uid });
        } else {
          throw new Error("Unauthorized");
        }
      }
      return { ...data, uid } as AgentMemory;
    }
    
    return { chatId: normalizedChatId, uid, history: [], lastUpdated: Date.now() };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error; // Ensure function returns or throws
  }
}

export async function saveAgentMemory(chatId: string, uid: string, role: 'user' | 'assistant', content: string) {
  const normalizedChatId = chatId.toLowerCase();
  const path = `agent_memory/${normalizedChatId}`;
  try {
    const docRef = doc(db, 'agent_memory', normalizedChatId);
    const docSnap = await getDoc(docRef);
    
    const entry = { role, content, timestamp: Date.now() };
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.uid !== uid) {
        if (chatId.toLowerCase() === auth.currentUser?.email?.toLowerCase()) {
          await updateDoc(docRef, { uid: uid });
        } else {
          throw new Error("Unauthorized");
        }
      }
      await updateDoc(docRef, {
        history: arrayUnion(entry),
        lastUpdated: Date.now()
      });
    } else {
      await setDoc(docRef, {
        chatId: normalizedChatId,
        uid,
        history: [entry],
        lastUpdated: Date.now()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
