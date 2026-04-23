export interface AdminSessionState {
  configured: boolean;
  authenticated: boolean;
  sessionCookieName: string;
  csrfCookieName: string;
}