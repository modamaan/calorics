/**
 * Firebase JS SDK initialization.
 * All config values come from EXPO_PUBLIC_* environment variables.
 * Never hardcode Firebase config — values must live in .env.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

// Prevent re-initializing on hot reload
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// React Native Android sometimes hangs on Firestore WebSocket connections. 
// Forcing long polling guarantees it connects instantly.
const db: Firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export { app, db };
