import { z } from "zod";

function todayIsoLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export const bookingSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(10, "Valid phone is required"),
    eventType: z.string().min(2, "Event type is required"),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Event date must use YYYY-MM-DD format"),
    startTime: z.string().optional().default(""),
    endTime: z.string().optional().default(""),
    venueName: z.string().optional().default(""),
    venueAddress: z.string().optional().default(""),
    city: z.string().optional().default(""),
    settingType: z.enum(["indoor", "outdoor", "hybrid"]).optional().default("indoor"),
    guestCount: z.coerce.number().int().min(1).optional().default(1),
    genres: z.string().optional().default(""),
    cleanMusic: z.enum(["yes", "no"]).optional().default("yes"),
    mcService: z.enum(["yes", "no"]).optional().default("no"),
    lights: z.enum(["yes", "no"]).optional().default("no"),
    packageId: z.string().optional().or(z.literal("")),
    addOns: z.array(z.string().min(1)).optional().default([]),
    selectedAddOns: z.array(z.string().min(1)).optional().default([]),
    budgetRange: z.string().optional().default(""),
    preferredContactMethod: z.enum(["email", "phone", "text"]),
    specialNotes: z.string().max(1200).optional().or(z.literal(""))
  })
  .superRefine((payload, ctx) => {
    if (payload.startTime && payload.endTime && payload.startTime >= payload.endTime) {
      ctx.addIssue({
        code: "custom",
        message: "End time must be after start time",
        path: ["endTime"]
      });
    }

    if (payload.eventDate < todayIsoLocal()) {
      ctx.addIssue({
        code: "custom",
        message: "Event date cannot be in the past",
        path: ["eventDate"]
      });
    }
  })
  .transform((payload) => {
    const mergedAddOns = payload.selectedAddOns.length > 0 ? payload.selectedAddOns : payload.addOns;
    return {
      ...payload,
      addOns: mergedAddOns,
      selectedAddOns: mergedAddOns
    };
  });
