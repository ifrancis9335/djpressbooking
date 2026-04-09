import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

function isConfiguredValue(value?: string) {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.toLowerCase().startsWith("replace-with-")) return false;
  return true;
}

export const isFirebaseClientConfigured = Boolean(
  isConfiguredValue(firebaseConfig.apiKey) &&
    isConfiguredValue(firebaseConfig.authDomain) &&
    isConfiguredValue(firebaseConfig.projectId) &&
    isConfiguredValue(firebaseConfig.appId)
);

const app = isFirebaseClientConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const firebaseDb = app ? getFirestore(app) : null;
