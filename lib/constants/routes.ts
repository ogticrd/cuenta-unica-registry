/**
 * Centralized route constants for the application.
 * Use these instead of hardcoding strings to make future route changes easy.
 */
export const ROUTES = {
  // Auth
  login: "/login",
  register: "/register",
  verification: "/verification",
  recovery: "/recovery",
  error: "/error",

  // Dashboard
  dashboard: "/",
  profile: "/profile",
  settings: "/settings",
  history: "/history",
  support: "/support",
  about: "/about",
} as const

export type Route = (typeof ROUTES)[keyof typeof ROUTES]
