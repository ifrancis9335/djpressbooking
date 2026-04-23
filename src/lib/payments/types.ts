export type PaymentProvider = "stripe" | "none";

export interface PaymentsConfiguration {
  enabled: boolean;
  provider: PaymentProvider;
  currency: string;
  providerConfigured: boolean;
  webhookConfigured: boolean;
}

export interface CreatePaymentIntentInput {
  bookingId: string;
  amount: number;
  currency?: string;
  customerEmail?: string;
  description: string;
  kind: "deposit" | "subscription" | "manual";
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  provider: "stripe";
  paymentIntentId: string;
  clientSecret: string;
  status: string;
  amount: number;
  currency: string;
}