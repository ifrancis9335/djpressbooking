import { NextResponse } from "next/server";
import { patchSiteSettings, getSiteSettings } from "../../../../lib/site-settings";
import { requireAdminRequest } from "../../../../lib/admin-auth";
import { SiteSettings } from "../../../../types/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  try {
    const body = (await request.json()) as Partial<SiteSettings>;
    const settings = await patchSiteSettings(body);
    return NextResponse.json({ message: "Settings saved", settings });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to save settings" },
      { status: 500 }
    );
  }
}
