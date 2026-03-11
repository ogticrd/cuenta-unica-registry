import type { OryClientConfiguration } from "@ory/elements-react"
import { DEFAULT_LOCALE } from "./lib/constants/locales"

export const getOryConfig = (locale: string = DEFAULT_LOCALE): OryClientConfiguration => ({
  intl: {
    locale,
  },
  project: {
    name: "Cuenta Única Ciudadana",
    default_locale: "es",
    default_redirect_url: "/",
    error_ui_url: "/error",
    registration_ui_url: "/register",
    verification_ui_url: "/verification",
    recovery_ui_url: "/recovery",
    login_ui_url: "/login",
    settings_ui_url: "/settings",
    recovery_enabled: true,
    registration_enabled: true,
    verification_enabled: true,
    locale_behavior: "respect_accept_language",
  },
})

const config = getOryConfig(DEFAULT_LOCALE)

export default config
