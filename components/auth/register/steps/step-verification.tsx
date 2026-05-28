"use client";

import {
  ArrowLeft,
  Camera,
  Check,
  ExternalLink,
  ShieldAlert,
  Smile,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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
import { ROUTES } from "@/lib/constants/routes";
import { trackJourneyEvent } from "@/lib/services/analytics/journey.service";
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
  | "creating_account"
  | "error";

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
  const tError = useT("error");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phase, setPhase] = useState<VerificationPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
        account_draft_missing: t("account.draft_missing"),
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
      account_draft_missing: t("account.draft_missing"),
      verification_already_completed: t("verification.session_creation_failed"),
      rekognition_error: t("verification.rekognition_error"),
      unexpected_error: t("verification.session_creation_failed"),
    }),
    [t],
  );

  const createSession = useCallback(async () => {
    setPhase("creating_session");
    setLivenessSessionId(null);
    setErrorMessage(null);

    const result = await verificationService.createLivenessSession();

    if (!result.success) {
      if (result.code === "registration_session_missing") {
        setPhase("idle");
        setIsModalOpen(false);
        onRequireIdentification();
        toast.error(t("verification.session_creation_failed"));
        return;
      }

      if (result.code === "account_draft_missing") {
        onRequireAccount({ code: result.code });
        return;
      }

      setPhase("error");
      setErrorMessage(livenessSessionErrorMessages[result.code]);
      return;
    }

    setLivenessSessionId(result.sessionId);
    setPhase("liveness_active");
  }, [
    livenessSessionErrorMessages,
    onRequireAccount,
    onRequireIdentification,
    t,
  ]);

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

    void trackJourneyEvent({
      eventName: "journey.registration.liveness.started",
      step: "liveness",
    });

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

      if (result.stage === "account") {
        setPhase("idle");
        setIsModalOpen(false);
        onRequireAccount({
          code: result.code,
          fieldErrors: result.fieldErrors,
        });
        return;
      }

      if (result.code === "registration_session_missing") {
        setPhase("idle");
        setIsModalOpen(false);
        onRequireIdentification();
        toast.error(verificationErrorMessages[result.code]);
        return;
      }

      setPhase("error");
      setErrorMessage(verificationErrorMessages[result.code]);
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

      setPhase("error");
      const message = t("verification.verification_failed");
      setErrorMessage(message);
      toast.error(message);
      isHandlingError.current = false;
    },
    [t],
  );

  const handleModalClose = (open: boolean) => {
    if (!open && phase !== "verifying" && phase !== "creating_account") {
      setIsModalOpen(false);
      setPhase("idle");
      setLivenessSessionId(null);
      setErrorMessage(null);
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-2 border-slate-200 dark:border-slate-800 rounded-xl mt-6 w-full">
        <div className="flex items-center gap-3">
          <Checkbox
            id="terms"
            className="h-6 w-6 rounded-md border-2 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-white data-[state=checked]:border-primary shrink-0"
            checked={termsAccepted}
            onCheckedChange={(checked) => {
              setTermsAccepted(checked as boolean);
            }}
          />
          <label
            htmlFor="terms"
            className="text-base font-semibold leading-relaxed text-primary dark:text-blue-100 cursor-pointer select-none"
          >
            {t("verification.terms_accept_checkbox")}{" "}
            <span className="text-destructive">*</span>
          </label>
        </div>

        <Link
          href={ROUTES.terms}
          rel="noopener noreferrer"
          target="_blank"
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1 shrink-0 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 rounded-full transition-colors"
        >
          {t("verification.terms_read_document")}{" "}
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <Button
        onClick={handleStartVerification}
        disabled={!termsAccepted}
        className="w-full h-12 text-base font-semibold rounded-full bg-primary hover:bg-[#002f5c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white mt-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
        <DialogContent className="biometric-modal max-w-full w-screen h-[100dvh] m-0 p-0 rounded-none border-0 bg-[#0f1629] flex flex-col items-center justify-center overflow-hidden">
          <DialogTitle className="sr-only">
            {t("verification.modal.screenreader_title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("verification.modal.screenreader_description")}
          </DialogDescription>

          <div className="relative w-full h-full flex flex-col items-center justify-center max-w-2xl mx-auto px-4">
            {phase === "creating_session" && <FaceLivenessLoader />}

            {phase === "liveness_active" && livenessSessionId && (
              <div
                className="w-full liveness-detector-wrapper animate-in fade-in zoom-in-95 duration-500"
                data-testid="rekognition-liveness"
              >
                <FaceLiveness
                  sessionId={livenessSessionId}
                  onComplete={handleLivenessComplete}
                  onError={handleLivenessError}
                />
              </div>
            )}

            {phase === "verifying" && (
              <div className="text-center space-y-6 animate-in fade-in duration-500">
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-white">
                    {t("verification.verifying_identity")}
                  </p>
                </div>
              </div>
            )}

            {phase === "creating_account" && (
              <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="relative mx-auto">
                  <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                    <Check className="h-14 w-14 text-white drop-shadow-md" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-2xl text-green-400">
                    {t("verification.modal.verified")}
                  </p>
                  <p className="text-sm font-medium text-white/80">
                    {t("verification.continuing_registration")}
                  </p>
                </div>
              </div>
            )}

            {phase === "error" && (
              <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500 w-full max-w-md mx-auto p-8">
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                  <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                    <ShieldAlert className="w-10 h-10 drop-shadow-md" />
                  </div>
                </div>
                <div className="space-y-3 px-2">
                  <p className="text-2xl font-bold text-red-400">
                    {tError("title")}
                  </p>
                  <p className="text-base text-slate-200 leading-relaxed font-medium">
                    {errorMessage}
                  </p>
                </div>
                <div className="pt-6 flex flex-col gap-3">
                  <Button
                    onClick={createSession}
                    className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-900/20"
                  >
                    {t("verification.retry")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleModalClose(false)}
                    className="w-full h-12 text-base font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl"
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
