/**
 * Internal API endpoint constants.
 * All fetch calls should use these instead of hardcoded strings.
 */
export const API = {
  session: "/api/ory/session",
  logout: "/api/ory/logout",
  sessions: "/api/ory/sessions",
  registrationCitizen: "/api/registration/citizen",
  registrationAccount: "/api/registration/account",
  registrationVerification: "/api/registration/verification",
  registrationSessionReset: "/api/registration/session/reset",
  registrationLivenessSession: "/api/registration/verification/liveness-session",
  registrationLivenessResult: "/api/registration/verification/liveness-result",
} as const;
