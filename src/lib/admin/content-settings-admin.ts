"use client";

import { readCookieValue } from "../../utils/csrf";
import type { SiteContent } from "../../types/site-content";
import type { SiteSettings } from "../../types/site-settings";
import type { DashboardSummary } from "../../components/admin/dashboard/types";
import { parseAdminResponse } from "./http";

function adminJsonHeaders() {
  return {
    "Content-Type": "application/json",
    "X-CSRF-Token": readCookieValue("dj_admin_csrf")
  };
}

export async function fetchAdminSummary() {
  const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
  return parseAdminResponse<{ summary: DashboardSummary }>(response);
}

export async function fetchAdminSettings() {
  const response = await fetch("/api/admin/settings", { cache: "no-store" });
  return parseAdminResponse<{ settings: SiteSettings }>(response);
}

export async function saveAdminSettings(patch: Partial<SiteSettings>) {
  const response = await fetch("/api/admin/settings", {
    method: "PATCH",
    headers: adminJsonHeaders(),
    body: JSON.stringify(patch)
  });
  return parseAdminResponse<{ settings: SiteSettings; message: string }>(response);
}

export async function fetchAdminContent() {
  const response = await fetch("/api/admin/content", { cache: "no-store" });
  return parseAdminResponse<{ content: SiteContent }>(response);
}

export async function saveAdminContent<K extends keyof SiteContent>(section: K, value: SiteContent[K]) {
  const response = await fetch("/api/admin/content", {
    method: "PATCH",
    headers: adminJsonHeaders(),
    body: JSON.stringify({ section, value })
  });
  return parseAdminResponse<{ content: SiteContent; message: string }>(response);
}

export async function saveAdminSharedContent(payload: {
  homepageHero: {
    title: string;
    description: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
  };
  contact: {
    phone: string;
    email: string;
    serviceArea: string;
  };
  site: {
    primaryCtaLabel: string;
    serviceAreaLine: string;
  };
}) {
  const response = await fetch("/api/admin/shared-content", {
    method: "PATCH",
    headers: adminJsonHeaders(),
    body: JSON.stringify(payload)
  });

  return parseAdminResponse<{ settings: SiteSettings; content: SiteContent; message: string }>(response);
}
