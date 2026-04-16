const LOCAL_FALLBACK = "http://localhost:3000";

export function getPublicBaseUrl() {
  const input = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
  if (!input) {
    return LOCAL_FALLBACK;
  }

  try {
    return new URL(input).toString().replace(/\/$/, "");
  } catch {
    return LOCAL_FALLBACK;
  }
}

export function toPublicAbsoluteUrl(pathname: string) {
  const baseUrl = getPublicBaseUrl();
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${baseUrl}${normalizedPath}`;
}
