import crypto from "crypto";
import type { CreatePaymentIntentInput, PaymentIntentResult } from "./types";

interface StripeErrorPayload {
  error?: {
    message?: string;
  };
  id?: string;
  client_secret?: string;
  status?: string;
  amount?: number;
  currency?: string;
}

function requireStripeSecret() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  return secret;
}

export async function createStripePaymentIntent(
  input: CreatePaymentIntentInput,
  defaultCurrency: string
): Promise<PaymentIntentResult> {
  const secret = requireStripeSecret();
  const params = new URLSearchParams();

  params.set("amount", String(input.amount));
  params.set("currency", input.currency || defaultCurrency);
  params.set("automatic_payment_methods[enabled]", "true");
  params.set("description", input.description);
  params.set("metadata[bookingId]", input.bookingId);
  params.set("metadata[kind]", input.kind);

  if (input.customerEmail) {
    params.set("receipt_email", input.customerEmail);
  }

  Object.entries(input.metadata || {}).forEach(([key, value]) => {
    params.set(`metadata[${key}]`, value);
  });

  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString(),
    cache: "no-store"
  });

  const raw = await response.text();
  const parsed = raw ? (JSON.parse(raw) as StripeErrorPayload) : {};
  if (!response.ok) {
    throw new Error(
      typeof parsed.error?.message === "string" ? parsed.error.message : "Unable to create Stripe payment intent."
    );
  }

  if (typeof parsed.id !== "string" || typeof parsed.client_secret !== "string") {
    throw new Error("Stripe did not return a usable payment intent response.");
  }

  return {
    provider: "stripe",
    paymentIntentId: parsed.id,
    clientSecret: parsed.client_secret,
    status: typeof parsed.status === "string" ? parsed.status : "requires_payment_method",
    amount: typeof parsed.amount === "number" ? parsed.amount : input.amount,
    currency: typeof parsed.currency === "string" ? parsed.currency : input.currency || defaultCurrency
  };
}

function parseStripeSignatureHeader(header: string) {
  return header.split(",").reduce<{ timestamp: string; signatures: string[] }>(
    (accumulator, part) => {
      const [key, value] = part.split("=");
      if (key === "t" && value) {
        accumulator.timestamp = value;
      }
      if (key === "v1" && value) {
        accumulator.signatures.push(value);
      }
      return accumulator;
    },
    { timestamp: "", signatures: [] }
  );
}

export function verifyStripeWebhookSignature(rawBody: string, header: string, secret: string) {
  const parsed = parseStripeSignatureHeader(header);
  if (!parsed.timestamp || parsed.signatures.length === 0) {
    throw new Error("Missing Stripe webhook signature.");
  }

  const timestampAge = Math.abs(Math.floor(Date.now() / 1000) - Number(parsed.timestamp));
  if (!Number.isFinite(timestampAge) || timestampAge > 300) {
    throw new Error("Stripe webhook timestamp is outside the accepted tolerance.");
  }

  const signedPayload = `${parsed.timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  const expectedBytes = new Uint8Array(Buffer.from(expected, "utf8"));
  const matched = parsed.signatures.some((signature) => {
    const actualBytes = new Uint8Array(Buffer.from(signature, "utf8"));
    return actualBytes.length === expectedBytes.length && crypto.timingSafeEqual(actualBytes, expectedBytes);
  });

  if (!matched) {
    throw new Error("Invalid Stripe webhook signature.");
  }
}