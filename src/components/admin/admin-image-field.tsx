"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { isManagedUploadUrl } from "../../lib/media";
import { ManagedImageAsset } from "../../types/site-content";
import { FallbackImage } from "../ui/fallback-image";

interface AdminImageFieldProps {
  label: string;
  scope: "branding" | "gallery" | "services" | "packages";
  uploadTitle: string;
  fallbackSrc: string;
  value?: ManagedImageAsset | null;
  legacyUrl?: string;
  previewClassName: string;
  onChange: (next: ManagedImageAsset | null | undefined) => void;
  onLegacyClear?: () => void;
}

const ACCEPTED_FILE_TYPES = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export function AdminImageField({
  label,
  scope,
  uploadTitle,
  fallbackSrc,
  value,
  legacyUrl,
  previewClassName,
  onChange,
  onLegacyClear
}: AdminImageFieldProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setMessage(null);
    setError(null);

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }

    if (file) {
      setLocalPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      return;
    }

    setUploading(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("scope", scope);
      formData.append("title", uploadTitle);

      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json().catch(() => null)) as { asset?: ManagedImageAsset; message?: string } | null;
      if (!response.ok || !payload?.asset) {
        throw new Error(payload?.message || "Upload failed");
      }

      onChange(payload.asset);
      setSelectedFile(null);
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
        setLocalPreviewUrl(null);
      }
      setMessage(payload.message || `${label} uploaded`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async () => {
    setMessage(null);
    setError(null);

    try {
      if (value?.url && isManagedUploadUrl(value.url)) {
        const response = await fetch("/api/admin/uploads", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: value.url })
        });
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        if (!response.ok) {
          throw new Error(payload?.message || "Unable to remove uploaded file");
        }
      }

      onChange(null);
      onLegacyClear?.();
      setSelectedFile(null);
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
        setLocalPreviewUrl(null);
      }
      setMessage(`${label} removed`);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove image");
    }
  };

  const previewSrc = localPreviewUrl || value?.url || legacyUrl || fallbackSrc;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-300">{label}</p>
      <FallbackImage
        src={previewSrc}
        fallbackSrc={fallbackSrc}
        alt={`${label} preview`}
        width={1200}
        height={320}
        className={`mt-3 ${previewClassName}`}
      />
      <label className="field mt-3">
        <span className="field-label">Upload Image</span>
        <input className="field-input" type="file" accept={ACCEPTED_FILE_TYPES} onChange={handleFileChange} />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary md:w-auto" onClick={uploadFile} disabled={!selectedFile || uploading}>
          {uploading ? "Uploading..." : value?.url || legacyUrl ? "Replace Image" : "Upload Image"}
        </button>
        <button type="button" className="btn-ghost" onClick={removeFile} disabled={!value && !legacyUrl && !localPreviewUrl}>
          Remove Image
        </button>
      </div>
      {value?.url ? <p className="mt-2 text-xs text-slate-400">Stored at {value.url}</p> : null}
      {message ? <p className="status-ok mt-3">{message}</p> : null}
      {error ? <p className="status-bad mt-3">{error}</p> : null}
    </div>
  );
}