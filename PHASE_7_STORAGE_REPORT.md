# PHASE_7_STORAGE_REPORT

## Storage Provider Used
Firebase Storage (Google Cloud Storage via Firebase Admin SDK).

Implementation summary:
- Admin upload API now writes image binaries to Firebase Storage instead of local disk.
- Managed image URLs are returned as Firebase download URLs.
- Delete API removes objects from Firebase Storage using validated object paths.

## Files Changed
- `src/app/api/admin/uploads/route.ts`
- `src/lib/firebase.ts`
- `src/lib/media.ts`
- `src/components/ui/fallback-image.tsx`
- `next.config.mjs`
- `ENVIRONMENT_VARIABLES.md`

## What Changed

### 1) Durable Upload Storage
`src/app/api/admin/uploads/route.ts`
- Replaced local filesystem writes (`public/uploads`) with Firebase Storage object writes.
- Upload object key format:
  - `uploads/<scope>/<generated-file-name>`
- Preserved existing security checks:
  - scope allowlist
  - MIME allowlist (`jpg/png/webp`)
  - max size (5 MB)
- Preserved `ManagedImageAsset` shape in API response:
  - `url`, `title`, `type`, `mimeType`, `size`

### 2) Durable Delete Behavior
`src/app/api/admin/uploads/route.ts`
- Delete path now resolves and validates storage object paths and removes from Firebase Storage.
- Safe delete guards:
  - only expected bucket is accepted
  - only objects under `uploads/` are accepted
  - rejects traversal/invalid segments
- Supports migration-safe deletion input forms:
  - new Firebase download URLs
  - Google Cloud Storage URLs
  - legacy `/uploads/...` paths (mapped to cloud object key)

### 3) Firebase Admin Storage Access
`src/lib/firebase.ts`
- Added `getServerStorageBucket()` helper.
- Firebase Admin app initialization now includes storage bucket configuration.
- Bucket resolution order:
  1. `FIREBASE_STORAGE_BUCKET`
  2. `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  3. `<FIREBASE_PROJECT_ID>.appspot.com`

### 4) Managed URL Recognition
`src/lib/media.ts`
- Expanded `isManagedUploadUrl()` to recognize both legacy and cloud-managed URLs:
  - `/uploads/...`
  - `https://storage.googleapis.com/...`
  - `https://firebasestorage.googleapis.com/v0/b/...`

### 5) Missing Image Fallback Hardening
`src/components/ui/fallback-image.tsx`
- Kept existing error-to-fallback behavior.
- Added handling to mark external (`http/https`) image sources as unoptimized for safer cloud URL rendering behavior.

### 6) Next.js Remote Image Allowlist
`next.config.mjs`
- Added image remote patterns for:
  - `firebasestorage.googleapis.com`
  - `storage.googleapis.com`

### 7) Environment Documentation
`ENVIRONMENT_VARIABLES.md`
- Added server variable docs for:
  - `FIREBASE_STORAGE_BUCKET`

## Migration Behavior
- Existing `ManagedImageAsset` structure is unchanged.
- Admin image picker behavior remains unchanged (upload, replace, remove, preview).
- Existing CMS content continues to load; legacy image URLs still resolve in UI logic.
- Deletion endpoint is backward-compatible with legacy `/uploads/...` style URLs to support transition cleanup.
- New uploads are cloud-backed and durable.

## Security and Flow Safety
Preserved and verified:
- Admin auth + CSRF requirements on upload/delete routes.
- Existing file type and size restrictions.
- Existing CMS and booking flows were not redesigned or behaviorally altered.

## Test Results
Required commands executed after migration:
- `npm run lint` -> PASS (`__LINT_EXIT__0`)
- `npx tsc --noEmit` -> PASS (`__TSC_EXIT__0`)
- `npm run build` -> PASS (`__BUILD_EXIT__0`)

Build output confirms successful compilation and route generation, including `/api/admin/uploads`.