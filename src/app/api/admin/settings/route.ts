import { NextResponse } from "next/server";
import { patchSiteSettings, getSiteSettings } from "../../../../lib/site-settings";
import { requireAdminCsrf, requireAdminRequest } from "../../../../lib/admin-auth";
import { logAdminDebug, logAdminDebugError } from "../../../../lib/admin-debug";
import { SiteSettings } from "../../../../types/site-settings";
import { siteSettingsPatchSchema } from "../../../../lib/validators/site-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  try {
    const settings = await getSiteSettings();
    logAdminDebug("admin_settings_get_success", { hasContent: Boolean(settings.content) });
    return NextResponse.json({ settings });
  } catch (error) {
    logAdminDebugError("admin_settings_get_error", error);
    return NextResponse.json({ message: "Unable to load settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  const csrfError = requireAdminCsrf(request);
  if (csrfError) {
    return NextResponse.json({ message: csrfError }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => null)) as Partial<SiteSettings> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
    }
    logAdminDebug("admin_settings_patch_received", { keys: Object.keys(body || {}) });
    const parsed = siteSettingsPatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: "Invalid request.", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const settings = await patchSiteSettings(parsed.data as Partial<SiteSettings>);
    logAdminDebug("admin_settings_patch_success", { keys: Object.keys(parsed.data || {}) });
    return NextResponse.json({ message: "Settings saved", settings });
  } catch (error) {
    logAdminDebugError("admin_settings_patch_error", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to save settings" },
      { status: 500 }
    );
  }
}
