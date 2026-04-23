import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
	return NextResponse.json({ message: "Not found" }, { status: 404 });
}
