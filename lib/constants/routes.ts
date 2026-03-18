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

  // Dashboard
  dashboard: "/",
  profile: "/profile",
  // settings: "/self-service/settings/browser",
  settings: "/settings",
  history: "/history",
  support: "/support",
  about: "/about",
} as const

export type Route = (typeof ROUTES)[keyof typeof ROUTES]
