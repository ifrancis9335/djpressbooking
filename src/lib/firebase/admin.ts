import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function normalizePrivateKey(value?: string) {
  if (!value) return undefined;
  return value.replace(/\\n/g, "\n");
}

function isConfiguredValue(value?: string) {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.toLowerCase().startsWith("replace-with-")) return false;
  return true;
}

export function isFirebaseAdminConfigured() {
  return Boolean(
    isConfiguredValue(process.env.FIREBASE_PROJECT_ID) &&
      isConfiguredValue(process.env.FIREBASE_CLIENT_EMAIL) &&
      isConfiguredValue(process.env.FIREBASE_PRIVATE_KEY)
  );
}

function getRequiredStorageBucket() {
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET?.trim();

  if (!storageBucket) {
    throw new Error("Missing FIREBASE_STORAGE_BUCKET in server environment");
  }

  return storageBucket;
}

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin is not configured. Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY."
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    }),
    storageBucket: getRequiredStorageBucket()
  });
}

export function getServerFirestore() {
  return getFirestore(initFirebaseAdmin());
}

export function getServerStorageBucket() {
  const app = initFirebaseAdmin();

  return getStorage(app).bucket(getRequiredStorageBucket());
}

export function getAdminDb() {
  return getServerFirestore();
}
