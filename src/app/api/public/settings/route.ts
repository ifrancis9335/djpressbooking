import { NextResponse } from "next/server";
import { getPublicSiteData } from "../../../../lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getPublicSiteData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load public settings" },
      { status: 500 }
    );
  }
}
