"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { useRecaptchaToken } from "@/hooks/use-recaptcha-token";
import { useT } from "@/hooks/use-t";
import { reportClientError } from "@/lib/logging/client";
import { RECOVERY_RECAPTCHA_ACTION } from "@/lib/security/recaptcha-proof-core";

export function RecoveryRecaptchaGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useT("login");
  const allowNextSubmit = useRef(false);
  const validating = useRef(false);
  const { generateToken } = useRecaptchaToken(RECOVERY_RECAPTCHA_ACTION);

  const handleSubmitCapture = async (
    event: React.FormEvent<HTMLDivElement>,
  ) => {
    if (allowNextSubmit.current) {
      allowNextSubmit.current = false;
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (validating.current) {
      return;
    }

    const form = event.target as HTMLFormElement;
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    validating.current = true;

    try {
      const token = await generateToken();
      if (!token) {
        reportClientError("form_error", {
          form: "account_recovery",
          source: "recovery",
          code: "recaptcha_failed",
        });
        toast.error(t("recovery_recaptcha_error"));
        return;
      }

      const response = await fetch("/api/security/recaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, action: RECOVERY_RECAPTCHA_ACTION }),
      });

      if (!response.ok) {
        reportClientError("form_error", {
          form: "account_recovery",
          source: "recovery",
          code: "recaptcha_failed",
        });
        toast.error(t("recovery_recaptcha_error"));
        return;
      }

      allowNextSubmit.current = true;
      form.requestSubmit(submitter ?? undefined);
    } catch (error) {
      reportClientError(
        "form_error",
        {
          form: "account_recovery",
          source: "recovery",
          code: "recaptcha_failed",
        },
        error,
      );
      toast.error(t("recovery_recaptcha_error"));
    } finally {
      validating.current = false;
    }
  };

  return <div onSubmitCapture={handleSubmitCapture}>{children}</div>;
}
