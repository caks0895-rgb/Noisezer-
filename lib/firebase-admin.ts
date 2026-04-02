import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const dbAdmin = admin.firestore();
export { admin };
