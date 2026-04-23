import { z } from "zod";

export const paymentIntentSchema = z
  .object({
    bookingId: z.string().min(1),
    amount: z.coerce.number().int().positive(),
    currency: z.string().regex(/^[a-zA-Z]{3}$/).optional(),
    customerEmail: z.string().email().optional().or(z.literal("")),
    description: z.string().min(3).max(200),
    kind: z.enum(["deposit", "subscription", "manual"]).default("deposit"),
    metadata: z.record(z.string().max(120)).optional().default({})
  })
  .transform((value) => ({
    ...value,
    currency: value.currency?.toLowerCase(),
    customerEmail: value.customerEmail?.trim().toLowerCase() || undefined
  }));