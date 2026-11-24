"use client";

import { useLocale } from "next-intl";
import { ReCaptchaProvider as NextReCaptchaProvider } from "next-recaptcha-v3";

export function RecaptchaProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();

  if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
    return children;
  }

  return (
    <NextReCaptchaProvider language={locale} useEnterprise>
      {children}
    </NextReCaptchaProvider>
  );
}
