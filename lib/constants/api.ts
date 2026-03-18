/**
 * Internal API endpoint constants.
 * All fetch calls should use these instead of hardcoded strings.
 */
export const API = {
    session: "/api/ory/session",
    logout: "/api/ory/logout",
    sessions: "/api/ory/sessions",
    registrationCitizen: "/api/registration/citizen",
} as const
