"use client";

import { ArrowLeft, Camera, Check, ShieldAlert, Smile } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  FaceLiveness,
  FaceLivenessLoader,
} from "@/components/auth/register/face-liveness-detector";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/hooks/use-t";
import { accountService } from "@/lib/services/registration/account.service";
import { verificationService } from "@/lib/services/registration/verification.service";
import type {
  RegisterAccountDraft,
  RegisterAccountErrorCode,
  RegisterAccountStepErrors,
} from "@/lib/types/registration/account";
import type {
  CreateLivenessSessionErrorCode,
  VerifyLivenessErrorCode,
} from "@/lib/types/registration/verification";

type VerificationPhase =
  | "idle"
  | "creating_session"
  | "liveness_active"
  | "verifying"
  | "creating_account";

interface StepVerificationProps {
  onBack: () => void;
  onRequireAccount: (accountErrors?: RegisterAccountStepErrors) => void;
  onRequireIdentification: () => void;
  accountDraft: RegisterAccountDraft;
  autoFinalizeAccount?: boolean;
  userData: { name: string };
}

export function StepVerification({
  onBack,
  onRequireAccount,
  onRequireIdentification,
  accountDraft,
  autoFinalizeAccount = false,
  userData,
}: StepVerificationProps) {
  const t = useT("register");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phase, setPhase] = useState<VerificationPhase>("idle");
  const [livenessSessionId, setLivenessSessionId] = useState<string | null>(
    null,
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const isHandlingError = useRef(false);
  const isCompletingLiveness = useRef(false);
  const isFinalizingAccount = useRef(false);

  const firstName =
    userData.name.split(" ")[0]?.toUpperCase() || userData.name.toUpperCase();

  const verificationErrorMessages: Record<VerifyLivenessErrorCode, string> =
    useMemo(
      () => ({
        invalid_payload: t("verification.verification_failed"),
        registration_session_missing: t("verification.session_error"),
        verification_already_completed: t(
          "verification.session_creation_failed",
        ),
        invalid_session_id: t("verification.verification_failed"),
        liveness_check_failed: t("verification.liveness_failed"),
        citizen_photo_unavailable: t("verification.citizen_photo_unavailable"),
        face_mismatch: t("verification.face_mismatch"),
        rekognition_error: t("verification.rekognition_error"),
        unexpected_error: t("verification.verification_failed"),
      }),
      [t],
    );

  const livenessSessionErrorMessages: Record<
    CreateLivenessSessionErrorCode,
    string
  > = useMemo(
    () => ({
      registration_session_missing: t("verification.session_error"),
      verification_already_completed: t("verification.session_creation_failed"),
      rekognition_error: t("verification.rekognition_error"),
      unexpected_error: t("verification.session_creation_failed"),
    }),
    [t],
  );

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

      toast.error(livenessSessionErrorMessages[result.code]);
      return;
    }

    setLivenessSessionId(result.sessionId);
    setPhase("liveness_active");
  }, [livenessSessionErrorMessages, onRequireIdentification]);

  const handleAccountRegistrationResult = useCallback(
    (
      accountResult: Awaited<ReturnType<typeof accountService.registerAccount>>,
    ) => {
      if (!accountResult.success) {
        const messageByErrorCode: Record<RegisterAccountErrorCode, string> = {
          invalid_payload: t("account.error"),
          registration_session_missing: t("account.session_missing"),
          verification_required: t("account.verification_required"),
          account_draft_missing: t("account.draft_missing"),
          password_cedula_similarity: t(
            "account.validation.password_cedula_similarity",
          ),
          password_email_similarity: t(
            "account.validation.password_email_similarity",
          ),
          password_weak: t("account.validation.password_weak"),
          password_compromised: t("account.validation.password_compromised"),
          invalid_cedula: t("identification.id_invalid"),
          citizen_not_found: t("identification.id_not_found"),
          identity_exists: t("account.identity_exists"),
          ory_validation_error: t("account.error"),
          unexpected_error: t("account.error"),
        };

        isFinalizingAccount.current = false;
        isCompletingLiveness.current = false;
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

      window.location.assign(accountResult.redirectTo);
    },
    [onRequireAccount, onRequireIdentification, t],
  );

  const finalizeAccountRegistration = useCallback(async () => {
    if (isFinalizingAccount.current) return;

    isFinalizingAccount.current = true;
    setPhase("creating_account");

    const accountResult = await accountService.registerAccount();
    handleAccountRegistrationResult(accountResult);
  }, [handleAccountRegistrationResult]);

  useEffect(() => {
    if (!autoFinalizeAccount) {
      return;
    }

    setIsModalOpen(true);
    void finalizeAccountRegistration();
  }, [autoFinalizeAccount, finalizeAccountRegistration]);

  const handleStartVerification = async () => {
    if (!accountDraft.email || !accountDraft.password) {
      onRequireAccount();
      return;
    }

    isHandlingError.current = false;
    isCompletingLiveness.current = false;
    isFinalizingAccount.current = false;
    setIsModalOpen(true);
    await createSession();
  };

  const handleLivenessComplete = useCallback(async () => {
    if (!livenessSessionId || isCompletingLiveness.current) return;

    isCompletingLiveness.current = true;
    setPhase("verifying");

    const result =
      await verificationService.completeLivenessRegistration(livenessSessionId);

    if (!result.success) {
      isCompletingLiveness.current = false;
      setPhase("idle");
      setIsModalOpen(false);

      if (result.stage === "account") {
        onRequireAccount({
          code: result.code,
          fieldErrors: result.fieldErrors,
        });
        return;
      }

      if (result.code === "registration_session_missing") {
        onRequireIdentification();
      }
      toast.error(verificationErrorMessages[result.code]);
      return;
    }

    if (result.destination === "login") {
      toast.success(t("account.success_title"), {
        description: t("account.success_description"),
      });
    }

    setPhase("creating_account");
    window.location.assign(result.redirectTo);
    isCompletingLiveness.current = false;
  }, [
    livenessSessionId,
    onRequireIdentification,
    onRequireAccount,
    t,
    verificationErrorMessages,
  ]);

  const handleLivenessError = useCallback(
    async (error: unknown) => {
      console.error("[StepVerification] Liveness error:", error);

      if (isHandlingError.current) return;
      isHandlingError.current = true;

      toast.error(t("verification.verification_failed"));
      setPhase("idle");
      setLivenessSessionId(null);
      setIsModalOpen(false);
      isCompletingLiveness.current = false;
      isFinalizingAccount.current = false;
    },
    [t],
  );

  const handleModalClose = (open: boolean) => {
    if (!open && phase !== "verifying" && phase !== "creating_account") {
      setIsModalOpen(false);
      setPhase("idle");
      setLivenessSessionId(null);
      isCompletingLiveness.current = false;
      isFinalizingAccount.current = false;
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
            {phase === "creating_session" && <FaceLivenessLoader />}

            {phase === "liveness_active" && livenessSessionId && (
              <div className="w-full" data-testid="rekognition-liveness">
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

            {phase === "creating_account" && (
              <div className="text-white text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto">
                  <Check className="h-12 w-12 text-white" />
                </div>
                <span className="font-bold text-xl text-green-400">
                  {t("verification.modal.verified")}
                </span>
                <p className="text-sm font-medium text-white/80">
                  {t("verification.continuing_registration")}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
