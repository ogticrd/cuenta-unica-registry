/**
 * Centralized route constants for the application.
 * Use these instead of hardcoding strings to make future route changes easy.
 */
export const ROUTES = {
  landing: "/",
  // Auth
  login: "/login",
  // register: "/self-service/registration/browser",
  register: "/register",
  verification: "/verification",
  // verification: "/self-service/verification/browser",
  recovery: "/recovery",
  error: "/error",
  emailSent: "/register/email-sent",

  // Dashboard
  dashboard: "/dashboard",
  profile: "/profile",
  // settings: "/self-service/settings/browser",
  settings: "/settings",
  history: "/history",

  terms: "/terms",
  notifications: "/notifications",
  support: "/support",
  about: "/about",
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
