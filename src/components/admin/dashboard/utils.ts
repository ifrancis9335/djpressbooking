import { SiteSettings } from "../../../types/site-settings";

export const week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function toIsoDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createStableId(prefix: string) {
  const seed = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${seed}`;
}

export function moveItem<T>(items: T[], index: number, direction: "up" | "down") {
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const copy = [...items];
  const [item] = copy.splice(index, 1);
  copy.splice(nextIndex, 0, item);
  return copy;
}

export const defaultSettings: SiteSettings = {
  contact: {
    phone: "",
    phoneHref: "",
    email: "",
    serviceArea: ""
  },
  packages: {
    basic: { name: "", startingAt: "", ctaLabel: "" },
    premium: { name: "", startingAt: "", ctaLabel: "" },
    vip: { name: "", startingAt: "", ctaLabel: "" }
  },
  booking: {
    enabled: true,
    notice: ""
  },
  site: {
    primaryCtaLabel: "",
    heroSupportText: "",
    serviceAreaLine: ""
  }
};

export async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload ? payload.message : undefined;
    throw new Error(message || "Request failed");
  }
  return payload as T;
}

export function warnAdminLoadFailure(section: "settings" | "content" | "dashboard" | "availability", error: unknown) {
  console.warn(`[admin-dashboard] ${section} load failed`, error);
  console.warn("[ADMIN LOAD PARTIAL FAILURE]", error);
}
