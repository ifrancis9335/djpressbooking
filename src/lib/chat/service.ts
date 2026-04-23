import { NextResponse } from "next/server";
import { readJsonBody, withRetryAfter } from "../api/http";
import { writeRequestLog } from "../data/request-logs";
import { checkRateLimit } from "../security/rate-limit";
import { getSiteSettings } from "../site-settings";
import { buildChatAssistantReply, detectChatIntent, detectConversionIntent } from "./intents";
import { persistChatLead } from "./leads";
import { persistChatSession } from "./sessions";
import { generateChatReply, getChatProviderStatus } from "./provider";
import type { ChatSupportResponse } from "./types";
import { chatSupportSchema } from "./validators";

function isChatEnabled() {
  return process.env.CHAT_ENABLED?.trim().toLowerCase() !== "false";
}

export async function getChatRoute() {
  const siteSettings = await getSiteSettings();
  const providerStatus = getChatProviderStatus();

  return NextResponse.json({
    enabled: isChatEnabled(),
    provider: providerStatus.provider,
    providerConfigured: providerStatus.providerConfigured,
    bookingEnabled: siteSettings.booking.enabled
  });
}

export async function postChatRoute(request: Request) {
  const requestId = crypto.randomUUID();
  const path = new URL(request.url).pathname;
  const rateLimit = checkRateLimit(request, "chat-public", { windowMs: 10 * 60 * 1000, maxRequests: 20 });

  if (rateLimit.limited) {
    const response = NextResponse.json(
      { message: "Too many chat requests. Please try again shortly." },
      { status: 429 }
    );
    withRetryAfter(response, rateLimit.retryAfterSeconds);
    void writeRequestLog(request, {
      requestId,
      domain: "chat",
      action: "chat_limited",
      method: "POST",
      path,
      statusCode: 429,
      metadata: { retryAfterSeconds: rateLimit.retryAfterSeconds }
    });
    return response;
  }

  if (!isChatEnabled()) {
    void writeRequestLog(request, {
      requestId,
      domain: "chat",
      action: "chat_disabled",
      method: "POST",
      path,
      statusCode: 503
    });
    return NextResponse.json({ message: "Chat is currently disabled." }, { status: 503 });
  }

  try {
    const body = await readJsonBody<Record<string, unknown>>(request);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = chatSupportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const siteSettings = await getSiteSettings();
    const intent = detectChatIntent(parsed.data.message);
    const currentFlow = parsed.data.context?.bookingFlow;
    const conversionIntent = detectConversionIntent(parsed.data.message, currentFlow);
    const guidedReply = buildChatAssistantReply({
      message: parsed.data.message,
      intent,
      conversionIntent,
      currentState: currentFlow,
      siteSettings
    });

    let provider: ChatSupportResponse["provider"] = "rules";
    let replyMessage = guidedReply.message;

    if (!guidedReply.bookingAssistant.active && conversionIntent === "general_question") {
      const providerReply = await generateChatReply({
        request: parsed.data,
        intent,
        siteSettings
      });
      provider = providerReply.provider;
      replyMessage = providerReply.message;
    }

    const leadCaptured = await persistChatLead({
      lead: parsed.data.lead,
      intent,
      message: parsed.data.message,
      requestId,
      context: parsed.data.context
    });

    void persistChatSession({
      requestId,
      bookingFlow: parsed.data.context?.bookingFlow,
      readyForBooking: guidedReply.bookingAssistant.readyForBooking,
      conversionIntent
    });

    const response: ChatSupportResponse = {
      intent,
      provider,
      message: replyMessage,
      recommendedAction: guidedReply.recommendedAction,
      escalationRequired: intent === "support" || intent === "unknown",
      leadCaptured,
      bookingAssistant: guidedReply.bookingAssistant,
      structuredData: {
        conversionIntent,
        bookingEnabled: siteSettings.booking.enabled,
        contactEmail: siteSettings.contact.email,
        contactPhone: siteSettings.contact.phone,
        packageNames: [
          siteSettings.packages.basic.name,
          siteSettings.packages.premium.name,
          siteSettings.packages.vip.name
        ],
        requestedPage: parsed.data.context?.page || null,
        requestedEventDate: parsed.data.context?.eventDate || null,
        bookingFlowActive: guidedReply.bookingAssistant.active,
        readyForBooking: guidedReply.bookingAssistant.readyForBooking,
        nextField: guidedReply.bookingAssistant.nextField
      }
    };

    void writeRequestLog(request, {
      requestId,
      domain: "chat",
      action: "chat_completed",
      method: "POST",
      path,
      statusCode: 200,
      metadata: {
        intent,
        provider: response.provider,
        leadCaptured,
        page: parsed.data.context?.page || ""
      }
    });

    return NextResponse.json({ reply: response, requestId });
  } catch (error) {
    void writeRequestLog(request, {
      requestId,
      domain: "chat",
      action: "chat_error",
      method: "POST",
      path,
      statusCode: 500,
      metadata: { message: error instanceof Error ? error.message : String(error) }
    });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to process chat request" },
      { status: 500 }
    );
  }
}