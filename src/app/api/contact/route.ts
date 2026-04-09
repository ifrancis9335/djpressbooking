import { NextResponse } from "next/server";
import { createContactMessage, getContactMessages } from "../../../lib/services/contact-service";
import { contactSchema } from "../../../lib/validators/contact";
import { requireAdminApiKey } from "../../../lib/api-auth";

export async function GET(request: Request) {
  const authError = requireAdminApiKey(request);
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
    const body = await request.json();
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
