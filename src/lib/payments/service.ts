import { NextResponse } from "next/server";
import { readJsonBody } from "../api/http";
import { getBookingById } from "../bookings";
import { writeRequestLog } from "../data/request-logs";
import { getPaymentsConfiguration } from "./config";
import { createStripePaymentIntent, verifyStripeWebhookSignature } from "./stripe";
import { paymentIntentSchema } from "./validators";

export async function getPaymentIntentRoute() {
  const config = getPaymentsConfiguration();
  return NextResponse.json(config);
}

export async function postPaymentIntentRoute(request: Request) {
  const requestId = crypto.randomUUID();
  const path = new URL(request.url).pathname;
  const config = getPaymentsConfiguration();

  if (!config.enabled) {
    return NextResponse.json(
      { message: "Payments are disabled. Enable PAYMENTS_ENABLED and provider credentials before going live." },
      { status: 503 }
    );
  }

  if (config.provider !== "stripe" || !config.providerConfigured) {
    return NextResponse.json(
      { message: "Stripe is not fully configured. Set PAYMENT_PROVIDER=stripe and STRIPE_SECRET_KEY." },
      { status: 503 }
    );
  }

  try {
    const body = await readJsonBody<Record<string, unknown>>(request);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = paymentIntentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const booking = await getBookingById(parsed.data.bookingId);
    if (!booking) {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }

    const payment = await createStripePaymentIntent(
      {
        ...parsed.data,
        metadata: {
          bookingStatus: booking.status,
          ...(parsed.data.metadata || {})
        }
      },
      config.currency
    );

    void writeRequestLog(request, {
      requestId,
      domain: "payments",
      action: "payment_intent_created",
      method: "POST",
      path,
      statusCode: 201,
      metadata: {
        bookingId: booking.id,
        paymentIntentId: payment.paymentIntentId,
        kind: parsed.data.kind,
        amount: payment.amount
      }
    });

    return NextResponse.json({ payment, requestId }, { status: 201 });
  } catch (error) {
    void writeRequestLog(request, {
      requestId,
      domain: "payments",
      action: "payment_intent_error",
      method: "POST",
      path,
      statusCode: 500,
      metadata: { message: error instanceof Error ? error.message : String(error) }
    });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create payment intent" },
      { status: 500 }
    );
  }
}

export async function postPaymentWebhookRoute(request: Request) {
  const requestId = crypto.randomUUID();
  const path = new URL(request.url).pathname;
  const config = getPaymentsConfiguration();

  if (!config.enabled || config.provider !== "stripe") {
    return NextResponse.json({ message: "Payments are disabled." }, { status: 503 });
  }

  if (!config.webhookConfigured) {
    return NextResponse.json({ message: "Missing STRIPE_WEBHOOK_SECRET." }, { status: 503 });
  }

  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("stripe-signature") || "";
    verifyStripeWebhookSignature(rawBody, signatureHeader, process.env.STRIPE_WEBHOOK_SECRET as string);

    const event = JSON.parse(rawBody) as { id?: string; type?: string; data?: { object?: { metadata?: Record<string, string> } } };
    void writeRequestLog(request, {
      requestId,
      domain: "payments",
      action: "payment_webhook_received",
      method: "POST",
      path,
      statusCode: 200,
      metadata: {
        eventId: event.id || "",
        eventType: event.type || "",
        bookingId: event.data?.object?.metadata?.bookingId || ""
      }
    });

    return NextResponse.json({ received: true, eventType: event.type || "unknown", requestId });
  } catch (error) {
    void writeRequestLog(request, {
      requestId,
      domain: "payments",
      action: "payment_webhook_error",
      method: "POST",
      path,
      statusCode: 400,
      metadata: { message: error instanceof Error ? error.message : String(error) }
    });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to process webhook" },
      { status: 400 }
    );
  }
}