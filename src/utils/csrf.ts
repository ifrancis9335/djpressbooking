export function readCookieValue(name: string): string {
  if (typeof document === "undefined") {
    return "";
  }

  const target = `${name}=`;
  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const chunk of cookies) {
    const trimmed = chunk.trim();
    if (!trimmed.startsWith(target)) continue;
    return decodeURIComponent(trimmed.slice(target.length));
  }

  return "";
}
