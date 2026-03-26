import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const config = {
  ...firebaseConfig,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey
};

const app = initializeApp(config);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
