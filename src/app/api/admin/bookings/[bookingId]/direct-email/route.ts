import { Resend } from "resend";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminActivity } from "../../../../../../lib/admin-activity";
import { requireAdminCsrf, requireAdminRequest } from "../../../../../../lib/admin-auth";
import { getBookingById } from "../../../../../../lib/bookings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const directEmailParamsSchema = z.object({
  bookingId: z.string().trim().min(1)
});

const directEmailBodySchema = z.object({
  to: z.string().trim().email(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(10000)
});

function ok(message: string, id?: string) {
  return NextResponse.json({ ok: true, message, ...(id ? { id } : {}) });
}

function fail(message: string, status: number) {
  return NextResponse.json(
    { ok: false, message },
    { status }
  );
}

function getReplyToAddress() {
  return (process.env.BOOKING_REPLY_TO?.trim() || "djpressbookings@gmail.com").trim();
}

function debugLog(message: string, details?: Record<string, unknown>) {
  if (!IS_PRODUCTION) {
    console.info(message, details);
  }
}

function serializeErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(IS_PRODUCTION ? {} : { stack: error.stack })
    };
  }

  return {
    message: typeof error === "string" ? error : "Unknown error"
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  const rawParams = await context.params;
  const parsedParams = directEmailParamsSchema.safeParse(rawParams);
  if (!parsedParams.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid request.", errors: parsedParams.error.flatten() },
      { status: 400 }
    );
  }

  const bookingId = parsedParams.data.bookingId;

  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = process.env.BOOKING_NOTIFICATION_EMAIL_FROM?.trim() ?? "";

  // ── Auth ────────────────────────────────────────────────────────────────────
  const authError = requireAdminRequest(request);
  if (authError) {
    return fail(authError, authError === "Unauthorized" ? 401 : 503);
  }

  const csrfError = requireAdminCsrf(request);
  if (csrfError) {
    return fail(csrfError, 403);
  }

  debugLog("[direct-email] request_validated", {
    bookingId,
    resendConfigured: Boolean(apiKey),
    senderConfigured: Boolean(from)
  });

  // ── Env guard ────────────────────────────────────────────────────────────────
  if (!apiKey) {
    return fail("Server configuration error: RESEND_API_KEY is not set.", 500);
  }

  if (!from) {
    return fail("Server configuration error: BOOKING_NOTIFICATION_EMAIL_FROM is not set.", 500);
  }

  const replyTo = getReplyToAddress();
  debugLog("[direct-email] sender_validated", {
    bookingId,
    replyToConfigured: Boolean(replyTo)
  });

  if (!EMAIL_RE.test(replyTo)) {
    return fail(
      `Server configuration error: BOOKING_REPLY_TO contains an invalid email address ("${replyTo}").`,
      500
    );
  }

  // ── URL params ───────────────────────────────────────────────────────────────
  if (!bookingId) {
    return fail("Missing bookingId in URL.", 400);
  }

  // ── Body parsing ─────────────────────────────────────────────────────────────
  const rawText = await request.text().catch(() => "");

  if (!rawText) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  let body: unknown = null;
  try {
    body = JSON.parse(rawText) as unknown;
  } catch {
    debugLog("[direct-email] invalid_json_body", { bookingId });
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }
  const parsedBody = directEmailBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid request.", errors: parsedBody.error.flatten() },
      { status: 400 }
    );
  }

  const { to, subject, message } = parsedBody.data;

  // ── Build email content ──────────────────────────────────────────────────────
  const safeMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /></head>
  <body style="font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:20px;margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
      <tr>
        <td style="padding:24px 0 8px;">
          <h2 style="margin:0;font-size:20px;color:#0f172a;">Message from DJ Press Booking</h2>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 20px;">
          <p style="margin:0;line-height:1.7;white-space:pre-wrap;color:#1e293b;">${safeMessage}</p>
        </td>
      </tr>
      <tr>
        <td style="border-top:1px solid #e2e8f0;padding-top:16px;">
          <p style="margin:0;font-size:12px;color:#64748b;">Booking ref: ${bookingId}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;">
            Reply directly to this email or contact us at <a href="mailto:${replyTo}" style="color:#6366f1;">${replyTo}</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "Message from DJ Press Booking",
    "-------------------------------",
    "",
    message,
    "",
    `Booking ref: ${bookingId}`,
    `Contact: ${replyTo}`
  ].join("\n");

  // ── Send via Resend ──────────────────────────────────────────────────────────
  try {
    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
      replyTo
    });

    if (result.error) {
      console.error("[direct-email] resend_send_failed", {
        bookingId,
        ...serializeErrorDetails(result.error)
      });
      return fail("Email provider send failed. Please try again shortly.", 502);
    }

    debugLog("[direct-email] resend_send_succeeded", {
      bookingId,
      emailId: result.data?.id || ""
    });

    const booking = await getBookingById(bookingId).catch(() => null);
    await logAdminActivity({
      bookingId,
      action: "direct_email_sent",
      actorType: "admin",
      summary: `Direct email sent for booking ${bookingId}`,
      booking,
      metadata: {
        recipient: to,
        subject,
        emailId: result.data?.id || null
      }
    });

    return ok("Email sent successfully.", result.data?.id);
  } catch (err) {
    console.error("[direct-email] unexpected_send_error", {
      bookingId,
      ...serializeErrorDetails(err)
    });
    return fail("Unexpected email error. Please try again shortly.", 500);
  }
}


