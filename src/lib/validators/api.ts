import { z } from "zod";

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format");

export const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Month must use YYYY-MM format")
  .optional();

export const blockDateSchema = z.object({
  date: isoDateSchema,
  note: z.string().max(160).optional()
});
