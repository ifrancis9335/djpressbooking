import { NextResponse } from "next/server";
import { createContactMessage, getContactMessages } from "../../../lib/services/contact-service";
import { contactSchema } from "../../../lib/validators/contact";
import { requireAdminRequest } from "../../../lib/admin-auth";
import { checkRateLimit } from "../../../lib/security/rate-limit";

export async function GET(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  try {
    const messages = await getContactMessages();
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load contact messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request, "contact-submit", { windowMs: 10 * 60 * 1000, maxRequests: 20 });
    if (rateLimit.limited) {
      const response = NextResponse.json({ message: "Too many contact attempts. Please try again later." }, { status: 429 });
      response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      return response;
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const message = await createContactMessage(parsed.data);

    return NextResponse.json(
      {
        message: "Contact inquiry submitted successfully",
        contact: message
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to process contact request" },
      { status: 500 }
    );
  }
}
