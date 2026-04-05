"use client";

import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  type VerifyCodeState,
  verifyCodeAction,
} from "@/app/(auth)/register/email-sent/actions";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useT } from "@/hooks/use-t";
import { ROUTES } from "@/lib/constants/routes";

interface VerificationOTPFormProps {
  flowId: string;
  returnUrl?: string;
}

export function VerificationOTPForm({
  flowId,
  returnUrl,
}: VerificationOTPFormProps) {
  const router = useRouter();
  const t = useT("email_sent");
  const [otpValue, setOtpValue] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState<
    VerifyCodeState,
    FormData
  >(verifyCodeAction, {});

  // Handle success: toast + redirect to login
  useEffect(() => {
    if (state.success) {
      toast.success(t("success_title"), {
        description: t("success_description"),
      });
      const timeout = setTimeout(() => {
        if (returnUrl) {
          window.location.assign(returnUrl);
        } else {
          router.push(ROUTES.login);
        }
      }, 6000);
      return () => clearTimeout(timeout);
    }
  }, [state.success, router, t, returnUrl]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otpValue.length === 6 && formRef.current) {
      formRef.current.requestSubmit();
    }
  }, [otpValue]);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            {t("success_message")}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t("success_redirecting")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col items-center gap-5"
    >
      <input type="hidden" name="flow" value={flowId} />
      <input type="hidden" name="code" value={otpValue} />

      <div className="flex flex-col items-center gap-3 w-full">
        <InputOTP
          maxLength={6}
          value={otpValue}
          onChange={setOtpValue}
          disabled={isPending}
          containerClassName="w-full"
        >
          <InputOTPGroup className="w-full flex">
            <InputOTPSlot index={0} className="h-12 sm:h-14 flex-1 text-lg" />
            <InputOTPSlot index={1} className="h-12 sm:h-14 flex-1 text-lg" />
            <InputOTPSlot index={2} className="h-12 sm:h-14 flex-1 text-lg" />
            <InputOTPSlot index={3} className="h-12 sm:h-14 flex-1 text-lg" />
            <InputOTPSlot index={4} className="h-12 sm:h-14 flex-1 text-lg" />
            <InputOTPSlot index={5} className="h-12 sm:h-14 flex-1 text-lg" />
          </InputOTPGroup>
        </InputOTP>

        {state.error && (
          <Alert
            variant="destructive"
            className="border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 w-full text-left animate-in fade-in duration-200"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending || otpValue.length !== 6}
        className="w-full h-12 text-base font-semibold rounded-full bg-primary hover:bg-[#002f5c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("verifying")}
          </>
        ) : (
          t("verify_button")
        )}
      </Button>
    </form>
  );
}
