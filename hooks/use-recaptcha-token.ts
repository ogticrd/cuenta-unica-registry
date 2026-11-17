"use client";

import { useReCaptcha } from "next-recaptcha-v3";
import { useCallback } from "react";

const DEFAULT_RECAPTCHA_ACTION = "form_submit";

export function useRecaptchaToken(action = DEFAULT_RECAPTCHA_ACTION) {
  const { executeRecaptcha, loaded } = useReCaptcha();

  const generateToken = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      return process.env.NODE_ENV === "production" ? null : "local-development";
    }

    if (!loaded || !executeRecaptcha) {
      return null;
    }

    try {
      return await executeRecaptcha(action);
    } catch (error) {
      console.error("[recaptcha] Failed to generate token:", error);
      return null;
    }
  }, [action, executeRecaptcha, loaded]);

  return {
    generateToken,
    isLoaded: loaded || !process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
  };
}
