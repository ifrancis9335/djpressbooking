import type { BookingStatus } from "../../types/booking";
import {
  BookingConflictError,
  createBooking,
  getBookingByDate,
  getBookings,
  permanentlyDeleteBooking,
  purgeDeletedTestBookings,
  purgeExpiredBookings,
  purgeOldDeletedBookings,
  restoreBooking,
  softDeleteBooking,
  updateBookingStatus
} from "../bookings";
import { getSiteSettings } from "../site-settings";

export const bookingDataService = {
  create: createBooking,
  getByDate: getBookingByDate,
  list: getBookings,
  updateStatus: updateBookingStatus,
  softDelete: softDeleteBooking,
  restore: restoreBooking,
  permanentlyDelete: permanentlyDeleteBooking,
  purgeExpired: purgeExpiredBookings,
  purgeOldDeleted: purgeOldDeletedBookings,
  purgeTestDeleted: purgeDeletedTestBookings
};

export { BookingConflictError };

export function resolvePackageLabel(
  packageId: string | undefined,
  siteSettings: Awaited<ReturnType<typeof getSiteSettings>>
) {
  if (!packageId?.trim()) {
    return "Not selected";
  }

  const packageNameById: Record<string, string> = {
    basic: siteSettings.packages.basic.name || "Basic",
    premium: siteSettings.packages.premium.name || "Premium",
    vip: siteSettings.packages.vip.name || "Luxury / VIP"
  };

  return packageNameById[packageId.trim().toLowerCase()] || packageId;
}

export function getCustomerStatus(status: BookingStatus): "reviewed" | "confirmed" | "declined" | null {
  if (status === "pending_deposit") return "reviewed";
  if (status === "confirmed") return "confirmed";
  if (status === "cancelled") return "declined";
  return null;
}

export function toDeliveryStatus(result: { attempted: boolean; sent: boolean }) {
  if (!result.attempted) return "skipped";
  if (result.sent) return "sent";
  return "failed";
}