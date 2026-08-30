import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from './env.js';

export function getFirebaseAdminAuth() {
  if (!env.firebaseProjectId || !env.firebaseClientEmail || !env.firebasePrivateKey) return null;
  if (!getApps().length) {
    initializeApp({ credential: cert({ projectId: env.firebaseProjectId, clientEmail: env.firebaseClientEmail, privateKey: env.firebasePrivateKey.replace(/\\n/g, '\n') }) });
  }
  return getAuth();
}
