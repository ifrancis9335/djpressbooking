import { z } from "zod";

const bookingFlowSchema = z.object({
  active: z.boolean().optional(),
  eventType: z.string().max(120).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  location: z.string().max(200).optional(),
  guestCount: z.coerce.number().int().min(1).max(5000).optional(),
  budgetPackage: z.string().max(120).optional(),
  packageId: z.string().max(120).optional()
});

export const chatSupportSchema = z.object({
  message: z.string().min(2).max(2000),
  conversation: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000)
      })
    )
    .max(12)
    .optional(),
  lead: z
    .object({
      name: z.string().min(1).max(120).optional(),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().min(7).max(32).optional().or(z.literal(""))
    })
    .optional(),
  context: z
    .object({
      page: z.string().max(120).optional(),
      eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      packageId: z.string().max(120).optional(),
      bookingFlow: bookingFlowSchema.optional()
    })
    .optional()
});