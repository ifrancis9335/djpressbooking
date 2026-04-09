import { NextResponse } from "next/server";
import { setDateBlocked } from "../../../../lib/availability";
import { blockDateSchema } from "../../../../lib/validators/api";
import { requireAdminApiKey } from "../../../../lib/api-auth";
import { isFirebaseAdminConfigured } from "../../../../lib/firebase";

export async function POST(request: Request) {
  const authError = requireAdminApiKey(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ message: "Firebase Admin is not configured." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const parsed = blockDateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Valid date is required (YYYY-MM-DD)." }, { status: 400 });
    }

    const record = await setDateBlocked(parsed.data.date, parsed.data.note);
    return NextResponse.json({ message: "Date blocked", record });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to block date" },
      { status: 500 }
    );
  }
}
