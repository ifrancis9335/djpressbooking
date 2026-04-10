import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, buildAdminSessionValue, validateAdminPassword } from "../../../../../lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    const password = body.password?.trim() || "";

    if (!validateAdminPassword(password)) {
      return NextResponse.json({ message: "Invalid admin password" }, { status: 401 });
    }

    const session = buildAdminSessionValue();
    const response = NextResponse.json({ message: "Authenticated" });

    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: session,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Unable to sign in" }, { status: 500 });
  }
}
