import type { OryClientConfiguration } from "@ory/elements-react"

const config = {
    intl: {
        locale: "es",
    },
    project: {
        name: "Cuenta Única Ciudadana",
        default_locale: "es",
        default_redirect_url: "/",
        error_ui_url: "/error",
        registration_ui_url: "/auth/register",
        verification_ui_url: "/auth/verification",
        recovery_ui_url: "/recovery",
        login_ui_url: "/login",
        settings_ui_url: "/",
        recovery_enabled: true,
        registration_enabled: true,
        verification_enabled: true,
        locale_behavior: "respect_accept_language",
    }
} satisfies OryClientConfiguration;

export default config;
