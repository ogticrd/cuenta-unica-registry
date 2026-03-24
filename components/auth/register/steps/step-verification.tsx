"use client";

import { ArrowLeft, Camera, Check, ShieldAlert, Smile } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

import type {
  RegisterAccountDraft,
  RegisterAccountErrorCode,
  RegisterAccountStepErrors,
} from "@/lib/types/registration/account";
import type { VerifyLivenessErrorCode } from "@/lib/types/registration/verification";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FaceLiveness,
  FaceLivenessLoader,
} from "@/components/auth/register/face-liveness-detector";
import { useT } from "@/hooks/use-t";
import { verificationService } from "@/lib/services/registration/verification.service";
import { accountService } from "@/lib/services/registration/account.service";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type VerificationPhase =
  | "idle"
  | "creating_session"
  | "liveness_active"
  | "verifying"
  | "success";

interface StepVerificationProps {
  onBack: () => void;
  onRequireAccount: (accountErrors?: RegisterAccountStepErrors) => void;
  onRequireIdentification: () => void;
  accountDraft: RegisterAccountDraft;
  userData: { name: string };
}

export function StepVerification({
  onBack,
  onRequireAccount,
  onRequireIdentification,
  accountDraft,
  userData,
}: StepVerificationProps) {
  const t = useT("register");
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phase, setPhase] = useState<VerificationPhase>("idle");
  const [livenessSessionId, setLivenessSessionId] = useState<string | null>(
    null,
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const isHandlingError = useRef(false);

  const firstName =
    userData.name.split(" ")[0]?.toUpperCase() || userData.name.toUpperCase();

  const verificationErrorMessages: Record<VerifyLivenessErrorCode, string> = {
    registration_session_missing: t("verification.session_error"),
    invalid_session_id: t("verification.verification_failed"),
    liveness_check_failed: t("verification.liveness_failed"),
    citizen_photo_unavailable: t("verification.citizen_photo_unavailable"),
    face_mismatch: t("verification.face_mismatch"),
    rekognition_error: t("verification.rekognition_error"),
    unexpected_error: t("verification.verification_failed"),
  };

  const createSession = useCallback(async () => {
    setPhase("creating_session");
    setLivenessSessionId(null);

    const result = await verificationService.createLivenessSession();

    if (!result.success) {
      setPhase("idle");
      setIsModalOpen(false);

      if (result.code === "registration_session_missing") {
        onRequireIdentification();
      }

      toast.error(t("verification.session_creation_failed"));
      return;
    }

    setLivenessSessionId(result.sessionId);
    setPhase("liveness_active");
  }, [onRequireIdentification, t]);

  const handleStartVerification = async () => {
    if (!accountDraft.email || !accountDraft.password) {
      onRequireAccount();
      return;
    }

    setIsModalOpen(true);
    await createSession();
  };

  const handleLivenessComplete = useCallback(async () => {
    if (!livenessSessionId) return;

    setPhase("verifying");

    const result =
      await verificationService.verifyLiveness(livenessSessionId);

    if (!result.success) {
      setPhase("idle");
      setIsModalOpen(false);

      if (result.code === "registration_session_missing") {
        onRequireIdentification();
      }

      toast.error(verificationErrorMessages[result.code]);
      return;
    }

    // Verification passed — proceed to account creation
    setPhase("success");

    const accountResult = await accountService.registerAccount({
      email: accountDraft.email,
      password: accountDraft.password,
    });

    if (!accountResult.success) {
      const messageByErrorCode: Record<RegisterAccountErrorCode, string> = {
        invalid_payload: t("account.error"),
        registration_session_missing: t("account.session_missing"),
        verification_required: t("account.verification_required"),
        password_cedula_similarity: t(
          "account.validation.password_cedula_similarity",
        ),
        invalid_cedula: t("identification.id_invalid"),
        citizen_not_found: t("identification.id_not_found"),
        identity_exists: t("account.identity_exists"),
        ory_validation_error: t("account.error"),
        unexpected_error: t("account.error"),
      };

      setPhase("idle");
      setIsModalOpen(false);

      if (accountResult.code === "registration_session_missing") {
        onRequireIdentification();
        toast.error(messageByErrorCode[accountResult.code]);
        return;
      }

      onRequireAccount({
        code: accountResult.code,
        fieldErrors: accountResult.fieldErrors,
      });
      return;
    }

    if (accountResult.destination === "login") {
      toast.success(t("account.success_title"), {
        description: t("account.success_description"),
      });
    }

    setTimeout(() => {
      setIsModalOpen(false);

      const isExternal = /^https?:\/\//i.test(accountResult.redirectTo);
      if (isExternal) {
        window.location.assign(accountResult.redirectTo);
      } else {
        router.push(accountResult.redirectTo);
      }
    }, 1500);
  }, [
    livenessSessionId,
    accountDraft,
    onRequireIdentification,
    onRequireAccount,
    verificationErrorMessages,
    router,
    t,
  ]);

  const handleLivenessError = useCallback(
    async (error: unknown) => {
      console.error("[StepVerification] Liveness error:", error);

      if (isHandlingError.current) return;
      isHandlingError.current = true;

      toast.error(t("verification.verification_failed"));
      await createSession();

      isHandlingError.current = false;
    },
    [createSession, t],
  );

  const handleModalClose = (open: boolean) => {
    if (!open && phase !== "verifying" && phase !== "success") {
      setIsModalOpen(false);
      setPhase("idle");
      setLivenessSessionId(null);
    }
  };

  return (
    <div className="space-y-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
      <Image
        src="/images/icon-step-2.svg"
        alt={t("verification.illustration_alt")}
        width={150}
        height={150}
      />

      <div className="text-center">
        <h3 className="text-md font-bold text-primary dark:text-blue-300">
          {t("verification.greeting", { firstName })}
        </h3>
        <p className="text-sm text-primary dark:text-blue-100/80 font-medium max-w-md mx-auto leading-relaxed">
          {t("verification.intro")}
        </p>
      </div>

      <div className="w-full space-y-3 mt-4">
        <div className="bg-[#eff7ff] dark:bg-slate-900/80 dark:border dark:border-slate-800 p-4 rounded flex items-center gap-4 text-sm text-primary dark:text-slate-100">
          <Camera className="w-8 h-8 opacity-70 shrink-0 text-primary dark:text-blue-300" />
          <p>
            {t.rich("verification.requirements.device", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </div>

        <div className="bg-[#eff7ff] dark:bg-slate-900/80 dark:border dark:border-slate-800 p-4 rounded flex items-center gap-4 text-sm text-primary dark:text-slate-100">
          <Smile className="w-8 h-8 opacity-70 shrink-0 text-primary dark:text-blue-300" />
          <p>
            {t.rich("verification.requirements.face", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </div>

        <div className="bg-[#eff7ff] dark:bg-slate-900/80 dark:border dark:border-slate-800 p-4 rounded flex items-center gap-4 text-sm text-primary dark:text-slate-100">
          <ShieldAlert className="w-8 h-8 opacity-70 shrink-0 text-primary dark:text-blue-300" />
          <p>
            {t.rich("verification.requirements.photosensitive", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 mt-6">
        <Checkbox
          id="terms"
          className="rounded-sm border-gray-300 data-[state=checked]:bg-red-600 data-[state=checked]:text-white"
          checked={termsAccepted}
          onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
        />
        <label
          htmlFor="terms"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-primary dark:text-blue-100 underline decoration-blue-200 dark:decoration-blue-500/40 underline-offset-4 cursor-pointer"
        >
          {t("verification.terms_label")}{" "}
          <span className="text-destructive">*</span>
        </label>
      </div>

      <Button
        onClick={handleStartVerification}
        className="w-full h-12 text-base font-semibold rounded-full bg-primary hover:bg-[#002f5c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white mt-4"
        disabled={!termsAccepted}
      >
        {t("verification.start_process")}
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground dark:text-slate-400 dark:hover:text-slate-100 hover:text-foreground transition-colors font-medium mt-2"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("common.back")}
      </button>

      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-full w-screen h-[100dvh] m-0 p-0 rounded-none border-0 bg-black/95 flex flex-col items-center justify-center pt-8 pb-12">
          <DialogTitle className="sr-only">
            {t("verification.modal.screenreader_title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("verification.modal.screenreader_description")}
          </DialogDescription>

          <div className="w-full h-full flex flex-col items-center justify-center max-w-2xl mx-auto px-4">
            {(phase === "creating_session") && (
              <FaceLivenessLoader />
            )}

            {phase === "liveness_active" && livenessSessionId && (
              <div className="w-full">
                <FaceLiveness
                  sessionId={livenessSessionId}
                  onComplete={handleLivenessComplete}
                  onError={handleLivenessError}
                />
              </div>
            )}

            {phase === "verifying" && (
              <div className="text-white text-center space-y-4">
                <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-lg font-medium animate-pulse text-blue-400">
                  {t("verification.verifying_identity")}
                </p>
              </div>
            )}

            {phase === "success" && (
              <div className="text-white text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto">
                  <Check className="h-12 w-12 text-white" />
                </div>
                <span className="font-bold text-xl text-green-400">
                  {t("verification.modal.verified")}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
