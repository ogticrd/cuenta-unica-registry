import { API } from "@/lib/constants/api"

// ─── Response Types ────────────────────────────────────────────────────────────

export interface OryIdentity {
    id: string
    traits?: Record<string, unknown>
    schema_id?: string
    verifiable_addresses?: Array<{ value: string; verified: boolean }>
}

export interface OrySession {
    id?: string
    authenticated_at?: string
    authenticator_assurance_level?: string
    identity?: OryIdentity
    other_sessions?: OrySession[]
    [key: string]: unknown
}

export interface SessionResponse {
    isAuthenticated: boolean
    identity?: OryIdentity
    session?: OrySession
    otherSessions?: OrySession[]
}

export interface RevokeSessionResponse {
    success: boolean
    error?: string
}

// ─── Service ───────────────────────────────────────────────────────────────────

export const sessionService = {
    /**
     * Fetches the current Ory session from the internal API.
     * Returns session data and identity if authenticated.
     */
    getSession(): Promise<SessionResponse> {
        return fetch(API.session, {
            credentials: "include",
        }).then((res) => res.json())
    },

    /**
     * Revokes (disables) a specific session by its ID.
     */
    revokeSession(sessionId: string): Promise<RevokeSessionResponse> {
        return fetch(`${API.sessions}/${sessionId}`, {
            method: "DELETE",
        }).then((res) => res.json())
    },
}
