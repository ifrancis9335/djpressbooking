import { z } from "zod";

export const bookingSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(10, "Valid phone is required"),
    eventType: z.string().min(2, "Event type is required"),
    eventDate: z.string().min(1, "Event date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    venueName: z.string().min(2, "Venue name is required"),
    venueAddress: z.string().min(4, "Venue address is required"),
    city: z.string().min(2, "City is required"),
    settingType: z.enum(["indoor", "outdoor", "hybrid"]),
    guestCount: z.coerce.number().int().min(1, "Guest count must be at least 1"),
    genres: z.string().min(3, "Preferred genres are required"),
    cleanMusic: z.enum(["yes", "no"]),
    mcService: z.enum(["yes", "no"]),
    lights: z.enum(["yes", "no"]),
    packageId: z.string().optional().or(z.literal("")),
    addOns: z.array(z.string().min(1)).optional().default([]),
    selectedAddOns: z.array(z.string().min(1)).optional().default([]),
    budgetRange: z.string().min(2, "Budget range is required"),
    preferredContactMethod: z.enum(["email", "phone", "text"]),
    specialNotes: z.string().max(1200).optional().or(z.literal(""))
  })
  .superRefine((payload, ctx) => {
    if (payload.startTime >= payload.endTime) {
      ctx.addIssue({
        code: "custom",
        message: "End time must be after start time",
        path: ["endTime"]
      });
    }

    const eventDate = new Date(`${payload.eventDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
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
