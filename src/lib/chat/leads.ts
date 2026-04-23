import { FieldValue } from "firebase-admin/firestore";
import { getServerFirestore, isFirebaseAdminConfigured } from "../firebase/admin";
import type { ChatIntent, ChatLeadInput } from "./types";

function hasLeadDetails(lead?: ChatLeadInput) {
  return Boolean(lead?.name?.trim() || lead?.email?.trim() || lead?.phone?.trim());
}

export async function persistChatLead(input: {
  lead?: ChatLeadInput;
  intent: ChatIntent;
  message: string;
  requestId: string;
  context?: { page?: string; eventDate?: string; packageId?: string };
}) {
  if (!hasLeadDetails(input.lead) || !isFirebaseAdminConfigured()) {
    return false;
  }

  await getServerFirestore().collection("chat_leads").add({
    requestId: input.requestId,
    intent: input.intent,
    name: input.lead?.name?.trim() || "",
    email: input.lead?.email?.trim().toLowerCase() || "",
    phone: input.lead?.phone?.trim() || "",
    messagePreview: input.message.slice(0, 500),
    page: input.context?.page || "",
    eventDate: input.context?.eventDate || "",
    packageId: input.context?.packageId || "",
    createdAt: FieldValue.serverTimestamp()
  });

  return true;
}