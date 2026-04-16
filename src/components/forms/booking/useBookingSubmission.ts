import { BookingRequest } from "../../../types/booking";
import { parseJson } from "../../../utils/api";
import { stripUndefinedFields } from "../../../utils/sanitize";

interface UseBookingSubmissionArgs {
  bookingEnabled: boolean;
  bookingNotice: string;
  todayIso: string;
  form: BookingRequest;
  setErrors: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  setStatus: (next: { kind: "ok" | "bad"; text: string } | null) => void;
  setLoading: (value: boolean) => void;
  routerPush: (url: string) => void;
  isDev: boolean;
  debugInfo: (...args: unknown[]) => void;
}

export function useBookingSubmission({
  bookingEnabled,
  bookingNotice,
  todayIso,
  form,
  setErrors,
  setStatus,
  setLoading,
  routerPush,
  isDev,
  debugInfo
}: UseBookingSubmissionArgs) {
  const validateInquiry = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.fullName?.trim()) nextErrors.fullName = "Full name is required";
    if (!form.email?.trim()) nextErrors.email = "Email is required";
    if (!form.phone?.trim()) nextErrors.phone = "Phone is required";
    if (!form.eventType?.trim()) nextErrors.eventType = "Event type is required";
    if (!form.eventDate?.trim()) nextErrors.eventDate = "Choose an available date first";

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }

    if (form.phone && form.phone.replace(/\D/g, "").length < 10) {
      nextErrors.phone = "Enter a valid phone number";
    }

    if (form.eventDate && form.eventDate < todayIso) {
      nextErrors.eventDate = "Event date cannot be in the past";
    }

    setErrors(() => nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const continueToReview = (setStep: (next: 4) => void) => {
    if (!validateInquiry()) {
      setStatus({ kind: "bad", text: "Please complete all required fields in the inquiry form." });
      return;
    }
    setStatus(null);
    setStep(4);
  };

  const submit = async () => {
    if (!validateInquiry()) {
      setStatus({ kind: "bad", text: "Please review highlighted fields." });
      return;
    }

    if (!bookingEnabled) {
      setStatus({
        kind: "bad",
        text: bookingNotice || "Bookings are temporarily paused. Please contact us directly."
      });
      return;
    }

    setLoading(true);
    try {
      debugInfo("[booking-flow] submit availability request", { date: form.eventDate });
      const availabilityResponse = await fetch(`/api/availability?date=${encodeURIComponent(form.eventDate)}`, {
        cache: "no-store"
      });
      const availabilityPayload = await parseJson<{ available?: boolean; status?: "available" | "blocked" }>(availabilityResponse);
      const selectedStatus = availabilityPayload.status ?? "available";
      const isAvailable = availabilityPayload.available ?? selectedStatus === "available";
      debugInfo("[booking-flow] submit availability response", { date: form.eventDate, status: selectedStatus });

      if (!isAvailable) {
        setStatus({
          kind: "bad",
          text: "Date not available"
        });
        return;
      }

      const requestPayloadBeforeClean: BookingRequest = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        eventType: form.eventType.trim(),
        eventDate: form.eventDate,
        packageId: form.packageId?.trim() || undefined,
        preferredContactMethod: form.preferredContactMethod ?? "email",
        specialNotes: form.specialNotes?.trim() ?? ""
      };

      if (isDev) {
        debugInfo("[booking-flow][dev] booking payload before clean", requestPayloadBeforeClean);
      }

      const requestPayload = stripUndefinedFields(requestPayloadBeforeClean) as BookingRequest;

      if (isDev) {
        debugInfo("[booking-flow][dev] booking payload after clean", requestPayload);
      }

      debugInfo("[booking-flow] booking submit request", {
        eventDate: requestPayload.eventDate,
        eventType: requestPayload.eventType
      });
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload)
      });

      const responsePayload = await parseJson<{ booking: { id: string }; replyToken?: string }>(response);
      debugInfo("[booking-flow] booking submit response", { bookingId: responsePayload.booking.id });
      setStatus({ kind: "ok", text: "Inquiry submitted successfully." });
      const summary = new URLSearchParams({
        bookingId: responsePayload.booking.id,
        date: form.eventDate
      });

      if (requestPayload.packageId) {
        summary.set("package", requestPayload.packageId);
      }

      if (responsePayload.replyToken?.trim()) {
        summary.set("token", responsePayload.replyToken.trim());
      }

      routerPush(`/thank-you?${summary.toString()}`);
    } catch (error) {
      setStatus({ kind: "bad", text: error instanceof Error ? error.message : "Submission failed" });
    } finally {
      setLoading(false);
    }
  };

  return { validateInquiry, continueToReview, submit };
}
