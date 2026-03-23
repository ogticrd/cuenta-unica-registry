import type { Locale } from "@/lib/constants/locales"

export const oryCustomTranslations: Record<Locale, Record<string, string>> = {
  es: {
    "identities.messages.4000005": "La contraseña no cumple con los requisitos de seguridad.",
    "identities.messages.4000007": "Ya existe una cuenta con este correo electrónico.",
    "identities.messages.4000027": "Ya existe una cuenta con este correo electrónico. Inicia sesión para continuar.",
    "identities.messages.4000031": "La contraseña no puede contener tu correo electrónico.",
    "identities.messages.4000032": "La contraseña debe tener al menos 10 caracteres.",
    "identities.messages.4000033": "La contraseña excede la longitud máxima permitida.",
    "identities.messages.4000034": "La contraseña es demasiado débil. Elige una más segura.",
  },
  en: {
    "identities.messages.4000005": "The password does not meet the security requirements.",
    "identities.messages.4000007": "An account with this email already exists.",
    "identities.messages.4000027": "An account with this email already exists. Sign in to continue.",
    "identities.messages.4000031": "The password cannot contain your email address.",
    "identities.messages.4000032": "The password must be at least 10 characters long.",
    "identities.messages.4000033": "The password exceeds the maximum allowed length.",
    "identities.messages.4000034": "The password is too weak. Choose a stronger one.",
  },
}

export function translateOryMessageKey(
  key: string,
  locale: Locale,
  fallback?: string,
) {
  return oryCustomTranslations[locale]?.[key] ?? fallback ?? key
}
