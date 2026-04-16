/* eslint-disable no-console */
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const siteSettingsPath = path.join(projectRoot, "data", "site-settings.json");

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const firstEquals = trimmed.indexOf("=");
  if (firstEquals < 1) {
    return null;
  }

  const key = trimmed.slice(0, firstEquals).trim();
  let value = trimmed.slice(firstEquals + 1).trim();

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

async function loadLocalEnvFile(fileName) {
  const target = path.join(projectRoot, fileName);
  try {
    const raw = await fs.readFile(target, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const parsed = parseEnvLine(line);
      if (!parsed) {
        return;
      }

      if (!process.env[parsed.key]) {
        process.env[parsed.key] = parsed.value;
      }
    });
  } catch {
    // Optional local env files may not exist in all environments.
  }
}

function normalizePrivateKey(value) {
  if (!value) return undefined;
  return value.replace(/\\n/g, "\n");
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin is not configured. Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY.");
  }

  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${projectId}.appspot.com`;

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    }),
    storageBucket
  });
}

function getBucket() {
  const app = getAdminApp();
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${projectId}.appspot.com`;

  return getStorage(app).bucket(bucketName);
}

function isLegacyUploadUrl(value) {
  return typeof value === "string" && value.trim().startsWith("/uploads/");
}

function isSafeUploadsPath(objectPath) {
  const normalized = objectPath.trim().replace(/^\/+/, "");
  if (!normalized.startsWith("uploads/")) {
    return false;
  }

  const parts = normalized.split("/");
  if (parts.length < 3) {
    return false;
  }

  return !parts.some((part) => part === "" || part === "." || part === "..");
}

function toEncodedObjectPath(objectPath) {
  return objectPath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function buildFirebaseDownloadUrl(bucketName, objectPath, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${toEncodedObjectPath(objectPath)}?alt=media&token=${token}`;
}

async function ensureDownloadToken(fileRef) {
  const [metadata] = await fileRef.getMetadata();
  const metadataMap = metadata.metadata || {};
  const tokenList = (metadataMap.firebaseStorageDownloadTokens || "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokenList.length > 0) {
    return tokenList[0];
  }

  const nextToken = crypto.randomUUID();
  await fileRef.setMetadata({
    metadata: {
      ...metadataMap,
      firebaseStorageDownloadTokens: nextToken
    }
  });
  return nextToken;
}

function isScopedCmsImagePath(pathLabel) {
  return (
    pathLabel === "content.branding.logoImage" ||
    pathLabel === "content.homepageHero.heroImage" ||
    pathLabel.includes("content.gallery") ||
    pathLabel.includes("content.services") ||
    pathLabel.includes("content.packages") ||
    pathLabel.startsWith("content") ||
    pathLabel.startsWith("site") ||
    pathLabel.startsWith("packages")
  );
}

async function main() {
  await loadLocalEnvFile(".env.local");
  await loadLocalEnvFile(".env");

  const bucket = getBucket();
  const raw = await fs.readFile(siteSettingsPath, "utf8");
  const settings = JSON.parse(raw);

  const scanned = [];
  const migrated = [];
  const skipped = [];
  const missingFiles = [];
  const cache = new Map();

  async function resolveMigrationForUrl(legacyUrl) {
    if (cache.has(legacyUrl)) {
      return cache.get(legacyUrl);
    }

    const objectPath = legacyUrl.trim().replace(/^\/+/, "");
    if (!isSafeUploadsPath(objectPath)) {
      const result = { migrated: false, reason: "invalid_upload_path" };
      cache.set(legacyUrl, result);
      return result;
    }

    const fileRef = bucket.file(objectPath);
    const [exists] = await fileRef.exists();
    if (!exists) {
      const result = { migrated: false, reason: "missing_in_firebase", objectPath };
      cache.set(legacyUrl, result);
      return result;
    }

    const token = await ensureDownloadToken(fileRef);
    const firebaseUrl = buildFirebaseDownloadUrl(bucket.name, objectPath, token);
    const result = { migrated: true, objectPath, firebaseUrl };
    cache.set(legacyUrl, result);
    return result;
  }

  async function walk(node, pathLabel) {
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i += 1) {
        await walk(node[i], `${pathLabel}[${i}]`);
      }
      return;
    }

    if (!node || typeof node !== "object") {
      return;
    }

    const entries = Object.entries(node);
    for (const [key, value] of entries) {
      const nextPath = pathLabel ? `${pathLabel}.${key}` : key;

      if (typeof value === "string" && isLegacyUploadUrl(value) && isScopedCmsImagePath(nextPath)) {
        scanned.push({ path: nextPath, url: value });

        const result = await resolveMigrationForUrl(value);
        if (result.migrated) {
          node[key] = result.firebaseUrl;
          migrated.push({ path: nextPath, from: value, to: result.firebaseUrl, objectPath: result.objectPath });
        } else {
          skipped.push({ path: nextPath, url: value, reason: result.reason });
          if (result.reason === "missing_in_firebase") {
            missingFiles.push({ path: nextPath, url: value, objectPath: result.objectPath });
          }
        }
        continue;
      }

      await walk(value, nextPath);
    }
  }

  await walk(settings, "");

  if (migrated.length > 0) {
    await fs.writeFile(siteSettingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
  }

  const summary = {
    bucket: bucket.name,
    scannedCount: scanned.length,
    migratedCount: migrated.length,
    skippedCount: skipped.length,
    missingCount: missingFiles.length,
    uniqueMigratedObjects: [...new Set(migrated.map((item) => item.objectPath))].length,
    uniqueMissingObjects: [...new Set(missingFiles.map((item) => item.objectPath))].length
  };

  console.log(JSON.stringify({ summary, migrated, skipped, missingFiles }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
