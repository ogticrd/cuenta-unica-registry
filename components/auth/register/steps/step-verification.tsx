"use client";

import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Check,
  ShieldAlert,
  Smile,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  FaceLiveness,
  FaceLivenessLoader,
} from "@/components/auth/register/face-liveness-detector";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { accountService } from "@/lib/services/registration/account.service";
import { verificationService } from "@/lib/services/registration/verification.service";
import type {
  RegisterAccountDraft,
  RegisterAccountErrorCode,
  RegisterAccountStepErrors,
} from "@/lib/types/registration/account";
import type { VerifyLivenessErrorCode } from "@/lib/types/registration/verification";

type VerificationPhase =
  | "idle"
  | "creating_session"
  | "liveness_active"
  | "verifying"
  | "success"
  | "error";

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
  const tError = useT("error");
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phase, setPhase] = useState<VerificationPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [livenessSessionId, setLivenessSessionId] = useState<string | null>(
    null,
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const isHandlingError = useRef(false);

  const firstName =
    userData.name.split(" ")[0]?.toUpperCase() || userData.name.toUpperCase();

  const verificationErrorMessages: Record<VerifyLivenessErrorCode, string> =
    useMemo(
      () => ({
        registration_session_missing: t("verification.session_error"),
        invalid_session_id: t("verification.verification_failed"),
        liveness_check_failed: t("verification.liveness_failed"),
        citizen_photo_unavailable: t("verification.citizen_photo_unavailable"),
        face_mismatch: t("verification.face_mismatch"),
        rekognition_error: t("verification.rekognition_error"),
        unexpected_error: t("verification.verification_failed"),
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

      setPhase("error");
      setErrorMessage(t("verification.session_creation_failed"));
      return;
    }

    setLivenessSessionId(result.sessionId);
    setPhase("liveness_active");
  }, [onRequireIdentification, t]);

  const handleStartVerification = async () => {
    if (!termsAccepted) {
      setShowTermsError(true);
      return;
    }

    setShowTermsError(false);

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

    const result = await verificationService.verifyLiveness(livenessSessionId);

    if (!result.success) {
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

      setPhase("error");
      setErrorMessage(t("verification.verification_failed"));

      isHandlingError.current = false;
    },
    [t],
  );

  const handleModalClose = (open: boolean) => {
    if (!open && phase !== "verifying" && phase !== "success") {
      setIsModalOpen(false);
      setPhase("idle");
      setLivenessSessionId(null);
      setErrorMessage(null);
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

      <div className="flex items-start gap-3 mt-6">
        <Checkbox
          id="terms"
          className="h-5 w-5 rounded border-gray-300 data-[state=checked]:bg-secondary data-[state=checked]:text-white mt-0.5 shrink-0"
          checked={termsAccepted}
          onCheckedChange={(checked) => {
            setTermsAccepted(checked as boolean);
            if (checked) setShowTermsError(false);
          }}
        />
        <label
          htmlFor="terms"
          className="text-sm font-medium leading-relaxed text-secondary dark:text-blue-100 cursor-pointer"
        >
          <Link
            href={ROUTES.terms}
            target="_blank"
            className="underline decoration-blue-400 dark:decoration-blue-500 underline-offset-4 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {t("verification.terms_label_link")}
          </Link>{" "}
          <span className="text-destructive">*</span>
        </label>
      </div>

      {showTermsError && (
        <Alert
          variant="destructive"
          className="mt-4 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            {t("verification.terms_required")}
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleStartVerification}
        className="w-full h-12 text-base font-semibold rounded-full bg-primary hover:bg-[#002f5c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white mt-4"
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
              <div className="w-full liveness-detector-wrapper animate-in fade-in zoom-in-95 duration-500">
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
                  <p className="text-sm text-white/40">
                    {t("verification.modal.description")}
                  </p>
                </div>
              </div>
            )}

            {phase === "success" && (
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
                  <p className="text-sm text-white/40">
                    {t("account.success_description")}
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
