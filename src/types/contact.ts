export interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

export interface ContactMessage extends ContactRequest {
  id: string;
  createdAt: string;
  status: "new" | "awaiting_response" | "closed";
}
