import { ContactMessage, ContactRequest } from "../../types/contact";
import { FieldValue } from "firebase-admin/firestore";
import { getServerFirestore, isFirebaseAdminConfigured } from "../firebase/admin";

const CONTACT_COLLECTION = "contact_submissions";

interface FirestoreContactMessage {
  name: string;
  email: string;
  message: string;
  createdAt?: string | { toDate?: () => Date };
}

function toCreatedAt(input?: FirestoreContactMessage["createdAt"]) {
  if (!input) return new Date().toISOString();
  if (typeof input === "string") return input;
  if (typeof input === "object" && input !== null && "toDate" in input && typeof input.toDate === "function") {
    return input.toDate().toISOString();
  }
  return new Date().toISOString();
}

export async function createContactMessage(input: ContactRequest): Promise<ContactMessage> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Contact backend is not configured.");
  }

  const db = getServerFirestore();
  const docRef = db.collection(CONTACT_COLLECTION).doc();
  const nowIso = new Date().toISOString();

  await docRef.set({
    name: input.name,
    email: input.email,
    message: input.message,
    createdAt: FieldValue.serverTimestamp()
  });

  return {
    id: docRef.id,
    name: input.name,
    email: input.email,
    message: input.message,
    createdAt: nowIso,
    status: "new"
  };
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Contact backend is not configured.");
  }

  const db = getServerFirestore();
  const snapshot = await db.collection(CONTACT_COLLECTION).orderBy("createdAt", "desc").get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as FirestoreContactMessage;
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      message: data.message,
      createdAt: toCreatedAt(data.createdAt),
      status: "new"
    };
  });
}
