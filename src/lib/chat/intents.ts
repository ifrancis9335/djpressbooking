import type { SiteSettings } from "../../types/site-settings";
import type {
  ChatBookingAssistantReply,
  ChatBookingFlowField,
  ChatBookingSessionState,
  ChatConversionIntent,
  ChatIntent
} from "./types";

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

const pricingTerms = ["how much", "price", "pricing", "cost", "rate", "budget", "package", "packages", "premium", "vip", "basic"];
const availabilityTerms = ["available", "availability", "date open", "date free", "open date"];
const bookingTerms = ["book", "booking", "reserve", "secure", "dj for", "event", "party", "wedding", "birthday", "reception"];

const eventTypeMatchers: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /wedding/i, value: "Wedding" },
  { pattern: /birthday/i, value: "Birthday" },
  { pattern: /private party|house party/i, value: "Private Party" },
  { pattern: /corporate|company|office/i, value: "Corporate Event" },
  { pattern: /club|lounge/i, value: "Club / Lounge" },
  { pattern: /holiday/i, value: "Holiday Party" }
];

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function looksLikeAnswer(message: string) {
  const trimmed = message.trim();
  return trimmed.length > 1 && trimmed.length <= 80 && !trimmed.includes("?");
}

function normalizeDateValue(year: number, month: number, day: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function extractDate(message: string) {
  const trimmed = message.trim();

  const isoMatch = trimmed.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    return normalizeDateValue(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const slashMatch = trimmed.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (slashMatch) {
    const now = new Date();
    const yearValue = slashMatch[3] ? Number(slashMatch[3]) : now.getFullYear();
    const normalizedYear = yearValue < 100 ? 2000 + yearValue : yearValue;
    return normalizeDateValue(normalizedYear, Number(slashMatch[1]), Number(slashMatch[2]));
  }

  const naturalMatch = trimmed.match(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,?\s+\d{4})?/i);
  if (naturalMatch) {
    const parsed = new Date(naturalMatch[0]);
    if (!Number.isNaN(parsed.getTime())) {
      return normalizeDateValue(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
    }
  }

  return undefined;
}

function extractEventType(message: string, nextField: ChatBookingFlowField | null) {
  for (const matcher of eventTypeMatchers) {
    if (matcher.pattern.test(message)) {
      return matcher.value;
    }
  }

  if (nextField === "eventType" && looksLikeAnswer(message)) {
    return titleCase(message.replace(/^it(?:'s| is)\s+/i, ""));
  }

  return undefined;
}

function extractGuestCount(message: string) {
  const directMatch = message.match(/\b(\d{1,4})\s*(?:guest|guests|people|person|ppl)\b/i);
  if (directMatch) {
    return Number(directMatch[1]);
  }

  if (/^\d{1,4}$/.test(message.trim())) {
    return Number(message.trim());
  }

  return undefined;
}

function cleanLocationAnswer(message: string) {
  return message
    .trim()
    .replace(/^(it'?s|it is|we'?re in|we are in|at|in)\s+/i, "")
    .replace(/[.?!]+$/, "")
    .trim();
}

function extractLocation(message: string, nextField: ChatBookingFlowField | null) {
  const explicitMatch = message.match(/(?:located|location|venue|at|in)\s+([A-Za-z0-9'&.,\-\s]{3,})/i);
  if (explicitMatch?.[1]) {
    return cleanLocationAnswer(explicitMatch[1]);
  }

  if (nextField === "location" && looksLikeAnswer(message)) {
    return cleanLocationAnswer(message);
  }

  return undefined;
}

function extractBudgetPackage(message: string, siteSettings: SiteSettings) {
  const normalized = message.toLowerCase();

  const namedPackages = [
    { keyword: "basic", label: siteSettings.packages.basic.name || "Basic", packageId: "basic" },
    { keyword: "premium", label: siteSettings.packages.premium.name || "Premium", packageId: "premium" },
    { keyword: "vip", label: siteSettings.packages.vip.name || "Luxury / VIP", packageId: "vip" },
    { keyword: "luxury", label: siteSettings.packages.vip.name || "Luxury / VIP", packageId: "vip" }
  ];

  const packageMatch = namedPackages.find((entry) => normalized.includes(entry.keyword));
  if (packageMatch) {
    return {
      budgetPackage: packageMatch.label,
      packageId: packageMatch.packageId
    };
  }

  const budgetMatch = normalized.match(/\$\s?\d[\d,]*/);
  if (budgetMatch) {
    return {
      budgetPackage: budgetMatch[0].replace(/\s+/g, ""),
      packageId: undefined
    };
  }

  return {
    budgetPackage: undefined,
    packageId: undefined
  };
}

function buildSummary(state: ChatBookingSessionState) {
  const summary: string[] = [];

  if (state.eventType) summary.push(`Event: ${state.eventType}`);
  if (state.date) summary.push(`Date: ${state.date}`);
  if (state.location) summary.push(`Location: ${state.location}`);
  if (state.guestCount) summary.push(`Guests: ${state.guestCount}`);
  if (state.budgetPackage) summary.push(`Budget / Package: ${state.budgetPackage}`);

  return summary;
}

function getNextBookingField(state: ChatBookingSessionState): ChatBookingFlowField | null {
  if (!state.eventType) return "eventType";
  if (!state.date) return "date";
  if (!state.location) return "location";
  if (!state.guestCount) return "guestCount";
  return null;
}

function buildPrefill(state: ChatBookingSessionState) {
  const noteParts: string[] = [];

  if (state.location) noteParts.push(`Location: ${state.location}`);
  if (state.guestCount) noteParts.push(`Guest count: ${state.guestCount}`);
  if (state.budgetPackage) noteParts.push(`Budget / package interest: ${state.budgetPackage}`);

  return {
    eventType: state.eventType,
    date: state.date,
    packageId: state.packageId,
    venueName: state.location,
    guestCount: state.guestCount,
    specialNotes: noteParts.join("\n")
  };
}

function buildGuidedQuestion(nextField: ChatBookingFlowField, siteSettings: SiteSettings) {
  switch (nextField) {
    case "eventType":
      return "What type of event are you planning?";
    case "date":
      return "What date are you looking at? You can send it like YYYY-MM-DD or MM/DD/YYYY.";
    case "location":
      return "Where is the event taking place?";
    case "guestCount":
      return "About how many people are you expecting?";
    default:
      return `Bookings are open. You can also reach the team at ${siteSettings.contact.email} or ${siteSettings.contact.phone}.`;
  }
}

function updateBookingState(message: string, currentState: ChatBookingSessionState | undefined, siteSettings: SiteSettings) {
  const nextField = getNextBookingField(currentState || {});
  const packageSelection = extractBudgetPackage(message, siteSettings);

  return {
    active: true,
    ...(currentState || {}),
    eventType: extractEventType(message, nextField) || currentState?.eventType,
    date: extractDate(message) || currentState?.date,
    location: extractLocation(message, nextField) || currentState?.location,
    guestCount: extractGuestCount(message) || currentState?.guestCount,
    budgetPackage: packageSelection.budgetPackage || currentState?.budgetPackage,
    packageId: packageSelection.packageId || currentState?.packageId
  } satisfies ChatBookingSessionState;
}

export function detectConversionIntent(message: string, currentState?: ChatBookingSessionState): ChatConversionIntent {
  const normalized = message.trim().toLowerCase();

  if (!normalized) return "general_question";
  if (currentState?.active) return "booking_intent";
  if (includesAny(normalized, pricingTerms)) return "pricing_inquiry";
  if (includesAny(normalized, [...availabilityTerms, ...bookingTerms])) return "booking_intent";
  return "general_question";
}

export function detectChatIntent(message: string): ChatIntent {
  const normalized = message.trim().toLowerCase();

  if (!normalized) return "unknown";
  if (includesAny(normalized, ["hello", "hi", "hey", "good morning", "good evening"])) return "greeting";
  if (includesAny(normalized, availabilityTerms)) return "availability_check";
  if (includesAny(normalized, [...pricingTerms, "deposit", "retainer", "payment"])) return "pricing";
  if (includesAny(normalized, ["package", "packages", "premium", "vip", "basic", "add-on", "add on"])) return "package_question";
  if (includesAny(normalized, [...bookingTerms, "dj"])) return "booking_inquiry";
  if (includesAny(normalized, ["contact", "support", "help", "reply", "email", "phone"])) return "support";
  return "unknown";
}

export function getRecommendedAction(intent: ChatIntent): "book_now" | "check_availability" | "view_packages" | "contact_admin" | "none" {
  switch (intent) {
    case "availability_check":
      return "check_availability";
    case "pricing":
    case "package_question":
      return "view_packages";
    case "booking_inquiry":
      return "book_now";
    case "support":
    case "unknown":
      return "contact_admin";
    default:
      return "none";
  }
}

export function buildChatAssistantReply(input: {
  message: string;
  intent: ChatIntent;
  conversionIntent: ChatConversionIntent;
  currentState?: ChatBookingSessionState;
  siteSettings: SiteSettings;
}) {
  const bookingState = updateBookingState(input.message, input.currentState, input.siteSettings);
  const nextField = getNextBookingField(bookingState);
  const readyForBooking = nextField === null;
  const summary = buildSummary(bookingState);

  const bookingAssistant: ChatBookingAssistantReply = {
    active: input.conversionIntent !== "general_question" || Boolean(input.currentState?.active),
    conversionIntent: input.conversionIntent,
    nextField,
    nextQuestion: readyForBooking ? null : buildGuidedQuestion(nextField as ChatBookingFlowField, input.siteSettings),
    readyForBooking,
    collected: bookingState,
    prefill: buildPrefill(bookingState),
    summary
  };

  if (bookingAssistant.active) {
    if (readyForBooking) {
      return {
        message: `Perfect. I have your ${bookingState.eventType?.toLowerCase() || "event"}, ${bookingState.date}, ${bookingState.location}, and estimated guest count. You're ready to book — click below to secure your date.`,
        recommendedAction: "book_now" as const,
        bookingAssistant
      };
    }

    if (input.conversionIntent === "pricing_inquiry") {
      return {
        message: `Pricing depends on the event, coverage, and package fit. The current options are ${input.siteSettings.packages.basic.name}, ${input.siteSettings.packages.premium.name}, and ${input.siteSettings.packages.vip.name}. ${bookingAssistant.nextQuestion}`,
        recommendedAction: "view_packages" as const,
        bookingAssistant
      };
    }

    if (input.intent === "availability_check" && !bookingState.date) {
      return {
        message: `I can help move this toward booking, but I need the event date first. ${bookingAssistant.nextQuestion}`,
        recommendedAction: "none" as const,
        bookingAssistant
      };
    }

    return {
      message: bookingAssistant.nextQuestion || `Bookings are open. You can also reach the team at ${input.siteSettings.contact.email} or ${input.siteSettings.contact.phone}.`,
      recommendedAction: "none" as const,
      bookingAssistant
    };
  }

  if (input.intent === "pricing") {
    return {
      message: `Pricing depends on the event type, coverage window, and package level. The current package lineup includes ${input.siteSettings.packages.basic.name}, ${input.siteSettings.packages.premium.name}, and ${input.siteSettings.packages.vip.name}. If you want, I can turn this into a booking inquiry starting with your event type and date.`,
      recommendedAction: "view_packages" as const,
      bookingAssistant
    };
  }

  if (input.intent === "availability_check") {
    return {
      message: `I can help check whether your date is a fit and move you straight into booking. Start with the event date when you're ready.`,
      recommendedAction: "check_availability" as const,
      bookingAssistant
    };
  }

  return {
    message: `I can help with pricing, package guidance, availability, and getting your booking started. If you're planning an event, tell me what type of event it is and I can guide the next step.`,
    recommendedAction: getRecommendedAction(input.intent),
    bookingAssistant
  };
}

export function buildRuleBasedReply(message: string, intent: ChatIntent, siteSettings: SiteSettings) {
  return buildChatAssistantReply({
    message,
    intent,
    conversionIntent: detectConversionIntent(message),
    siteSettings
  }).message;
}