import { API } from "@/lib/constants/api";
import { parseJsonResponse } from "@/lib/services/api-response";

// ─── Response Types ────────────────────────────────────────────────────────────

export interface LogoutResponse {
  success: boolean;
  code?: "ory_logout_failed";
  error?: string;
  redirect_to?: string;
}

// ─── Service ───────────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Performs logout via the internal API.
   * Returns a redirect_to URL on success.
   */
  logout(): Promise<LogoutResponse> {
    return fetch(API.logout, {
      method: "POST",
      credentials: "include",
    }).then(parseJsonResponse<LogoutResponse>);
  },
};
