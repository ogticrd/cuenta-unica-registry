import { API } from "@/lib/constants/api"

// ─── Response Types ────────────────────────────────────────────────────────────

export interface LogoutResponse {
    success: boolean
    redirect_to?: string
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
        }).then((res) => res.json())
    },
}

