import type { SiteSettings } from "../../types/site-settings";
import { buildRuleBasedReply } from "./intents";
import type { ChatIntent, ChatProvider, ChatSupportRequest } from "./types";

function getConfiguredProvider(): ChatProvider {
  return process.env.CHAT_PROVIDER?.trim().toLowerCase() === "openai" ? "openai" : "rules";
}

function isOpenAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function buildSystemPrompt(intent: ChatIntent, siteSettings: SiteSettings) {
  return [
    "You are the server-side booking assistant for pressbookings.com.",
    "Respond with concise, professional customer support copy.",
    "Do not invent availability, pricing guarantees, contracts, or payment confirmations.",
    `Detected intent: ${intent}.`,
    `Current booking enabled state: ${siteSettings.booking.enabled ? "enabled" : "disabled"}.`,
    `Contact email: ${siteSettings.contact.email}.`,
    `Contact phone: ${siteSettings.contact.phone}.`,
    `Packages: ${siteSettings.packages.basic.name}, ${siteSettings.packages.premium.name}, ${siteSettings.packages.vip.name}.`
  ].join(" ");
}

export async function generateChatReply(input: {
  request: ChatSupportRequest;
  intent: ChatIntent;
  siteSettings: SiteSettings;
}): Promise<{ provider: ChatProvider; message: string }> {
  const provider = getConfiguredProvider();

  if (provider !== "openai" || !isOpenAiConfigured()) {
    return {
      provider: "rules",
      message: buildRuleBasedReply(input.request.message, input.intent, input.siteSettings)
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: buildSystemPrompt(input.intent, input.siteSettings) },
          ...(input.request.conversation || []).map((entry) => ({ role: entry.role, content: entry.content })),
          { role: "user", content: input.request.message }
        ]
      }),
      cache: "no-store"
    });

    const raw = await response.text();
    const parsed = raw ? (JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }> }) : {};
    const content = parsed.choices?.[0]?.message?.content?.trim();

    if (!response.ok || !content) {
      throw new Error("OpenAI response did not include assistant content.");
    }

    return {
      provider: "openai",
      message: content
    };
  } catch {
    return {
      provider: "rules",
      message: buildRuleBasedReply(input.request.message, input.intent, input.siteSettings)
    };
  }
}

export function getChatProviderStatus() {
  const provider = getConfiguredProvider();

  return {
    provider,
    providerConfigured: provider === "rules" || isOpenAiConfigured()
  };
}