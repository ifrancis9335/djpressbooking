export type ChatIntent =
  | "booking_inquiry"
  | "availability_check"
  | "pricing"
  | "package_question"
  | "support"
  | "greeting"
  | "unknown";

export type ChatConversionIntent = "general_question" | "pricing_inquiry" | "booking_intent";

export type ChatBookingFlowField = "eventType" | "date" | "location" | "guestCount";

export type ChatProvider = "openai" | "rules";

export interface ChatLeadInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ChatConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatBookingSessionState {
  active?: boolean;
  eventType?: string;
  date?: string;
  location?: string;
  guestCount?: number;
  budgetPackage?: string;
  packageId?: string;
}

export interface ChatBookingPrefill {
  eventType?: string;
  date?: string;
  packageId?: string;
  venueName?: string;
  guestCount?: number;
  specialNotes?: string;
}

export interface ChatBookingAssistantReply {
  active: boolean;
  conversionIntent: ChatConversionIntent;
  nextField: ChatBookingFlowField | null;
  nextQuestion: string | null;
  readyForBooking: boolean;
  collected: ChatBookingSessionState;
  prefill: ChatBookingPrefill;
  summary: string[];
}

export interface ChatSupportRequest {
  message: string;
  conversation?: ChatConversationTurn[];
  lead?: ChatLeadInput;
  context?: {
    page?: string;
    eventDate?: string;
    packageId?: string;
    bookingFlow?: ChatBookingSessionState;
  };
}

export interface ChatSupportResponse {
  intent: ChatIntent;
  provider: ChatProvider;
  message: string;
  recommendedAction: "book_now" | "check_availability" | "view_packages" | "contact_admin" | "none";
  escalationRequired: boolean;
  leadCaptured: boolean;
  bookingAssistant?: ChatBookingAssistantReply;
  structuredData: Record<string, unknown>;
}