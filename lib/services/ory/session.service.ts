import { API } from "@/lib/constants/api";

export interface OryIdentity {
  id: string;
  traits?: Record<string, unknown>;
  schema_id?: string;
  verifiable_addresses?: Array<{ value: string; verified: boolean }>;
}

export interface OrySessionDevice {
  id?: string;
  user_agent?: string;
  ip_address?: string;
  location?: string;
  [key: string]: unknown;
}

export interface OrySession {
  id?: string;
  authenticated_at?: string;
  expires_at?: string;
  authenticator_assurance_level?: string;
  identity?: OryIdentity;
  devices?: OrySessionDevice[];
  other_sessions?: OrySession[];
  [key: string]: unknown;
}

export interface SessionResponse {
  isAuthenticated: boolean;
  identity?: OryIdentity;
  session?: OrySession;
  otherSessions?: OrySession[];
}

export interface RevokeSessionResponse {
  success: boolean;
  error?: string;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return payload;
}

export const sessionService = {
  /**
   * Fetches the current Ory session from the internal API.
   * Returns session data and identity if authenticated.
   */
  getSession(): Promise<SessionResponse> {
    return fetch(API.session, {
      credentials: "include",
    }).then(parseJsonResponse<SessionResponse>);
  },

  /**
   * Revokes (disables) a specific session by its ID.
   */
  revokeSession(sessionId: string): Promise<RevokeSessionResponse> {
    return fetch(`${API.sessions}/${sessionId}`, {
      method: "DELETE",
    }).then(parseJsonResponse<RevokeSessionResponse>);
  },
};
