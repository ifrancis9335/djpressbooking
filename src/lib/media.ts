import { ManagedImageAsset } from "../types/site-content";

export const IMAGE_UPLOAD_SCOPES = ["branding", "gallery", "services", "packages"] as const;
export type ImageUploadScope = (typeof IMAGE_UPLOAD_SCOPES)[number];

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

export function getManagedImageUrl(asset: ManagedImageAsset | null | undefined, legacyUrl: string | undefined, fallbackUrl: string) {
  return asset?.url || legacyUrl || fallbackUrl;
}

export function isManagedUploadUrl(url: string | undefined) {
  if (typeof url !== "string") {
    return false;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }

  return (
    trimmed.startsWith("/uploads/") ||
    trimmed.startsWith("https://storage.googleapis.com/") ||
    trimmed.startsWith("https://firebasestorage.googleapis.com/v0/b/")
  );
}

export function getUploadExtension(fileName: string, mimeType: string) {
  const normalizedMimeType = mimeType.toLowerCase();
  if (normalizedMimeType === "image/jpeg") {
    return ".jpg";
  }
  if (normalizedMimeType === "image/png") {
    return ".png";
  }
  if (normalizedMimeType === "image/webp") {
    return ".webp";
  }

  const nameMatch = /\.(jpe?g|png|webp)$/i.exec(fileName);
  return nameMatch ? `.${nameMatch[1].toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
}

export function sanitizeUploadTitle(title: string | undefined, fallback: string) {
  const trimmed = title?.trim();
  return trimmed || fallback;
}