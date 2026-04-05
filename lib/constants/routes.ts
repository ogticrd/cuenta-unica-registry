/**
 * Centralized route constants for the application.
 * Use these instead of hardcoding strings to make future route changes easy.
 */
export const ROUTES = {
  // Auth
  login: "/self-service/login/browser",
  // register: "/self-service/registration/browser",
  register: "/register",
  verification: "/verification",
  // verification: "/self-service/verification/browser",
  recovery: "/self-service/recovery/browser",
  error: "/error",
  emailSent: "/register/email-sent",

  // Dashboard
  dashboard: "/dashboard",
  profile: "/profile",
  // settings: "/self-service/settings/browser",
  settings: "/settings",
  history: "/history",
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
