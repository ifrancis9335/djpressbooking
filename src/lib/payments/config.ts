import type { PaymentsConfiguration } from "./types";

export function getPaymentsConfiguration(): PaymentsConfiguration {
  const provider = process.env.PAYMENT_PROVIDER?.trim().toLowerCase() === "stripe" ? "stripe" : "none";
  const enabled = process.env.PAYMENTS_ENABLED?.trim().toLowerCase() === "true";

  return {
    enabled,
    provider,
    currency: process.env.PAYMENT_CURRENCY?.trim().toLowerCase() || "usd",
    providerConfigured: provider === "stripe" && Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    webhookConfigured: provider === "stripe" && Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim())
  };
}