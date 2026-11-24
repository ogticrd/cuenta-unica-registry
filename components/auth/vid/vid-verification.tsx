"use client";

import {
  AlertCircle,
  Camera,
  ExternalLink,
  Info,
  ScanFace,
  ShieldAlert,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  FaceLiveness,
  FaceLivenessLoader,
} from "@/components/auth/register/face-liveness-detector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/hooks/use-t";
import { ROUTES } from "@/lib/constants/routes";
import { reportClientError } from "@/lib/logging/client";
import type {
  VidLaunchErrorCode,
  VidLivenessErrorCode,
  VidLivenessResponse,
} from "@/lib/types/vid";

type Props =
  | { flowId: string; firstName: string; error?: never }
  | {
      flowId?: never;
      firstName?: never;
      error: VidLaunchErrorCode | "flow_expired";
    };

type VerificationError = VidLivenessErrorCode | "camera_error";

const sharedErrors = {
  camera_error: "verification.verification_failed",
  citizen_photo_unavailable: "verification.citizen_photo_unavailable",
  face_mismatch: "verification.face_mismatch",
  liveness_check_failed: "verification.liveness_failed",
  rekognition_error: "verification.rekognition_error",
} as const;

const requirements = [
  { key: "device", Icon: Camera },
  { key: "face", Icon: ScanFace },
  { key: "photosensitive", Icon: ShieldAlert },
] as const;

async function requestLiveness(
  body:
    | { stage: "start"; flowId: string; retry: boolean }
    | { stage: "complete"; flowId: string; sessionId: string },
): Promise<VidLivenessResponse> {
  const response = await fetch("/api/vid/liveness", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}

export function VidVerification({
  flowId,
  firstName,
  error: launchError,
}: Props) {
  const t = useT("vid");
  const register = useT("register");
  const tError = useT("error");
  const [accepted, setAccepted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"start" | "complete" | null>(null);
  const [error, setError] = useState<VerificationError | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const inFlight = useRef(false);
  const capture = useRef<{ sessionId: string; active: boolean } | null>(null);

  const terminalError =
    launchError ??
    (error === "flow_expired" || error === "attempt_limit" ? error : null);

  function verificationErrorMessage(code: VerificationError) {
    const key = sharedErrors[code as keyof typeof sharedErrors];
    return key ? register(key) : t("errors.service_unavailable");
  }

  async function start() {
    if (!flowId || !accepted || inFlight.current) return;

    inFlight.current = true;
    setIsModalOpen(true);
    setBusy("start");
    setError(null);
    try {
      const result = await requestLiveness({
        stage: "start",
        flowId,
        retry: capture.current !== null,
      });
      if (result.success && "sessionId" in result) {
        capture.current = { sessionId: result.sessionId, active: true };
        setSessionId(result.sessionId);
      } else {
        reportClientError("form_error", {
          form: "vid",
          source: "vid",
          code: result.success ? "unexpected_error" : result.code,
        });
        setError(result.success ? "unexpected_error" : result.code);
      }
    } catch (error) {
      reportClientError(
        "form_error",
        { form: "vid", source: "vid", code: "network_error" },
        error,
      );
      setError("unexpected_error");
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  function closeCapture() {
    if (capture.current) capture.current.active = false;
    setSessionId(null);
  }

  function handleModalChange(open: boolean) {
    if (!open && inFlight.current) return;
    if (!open) closeCapture();
    setIsModalOpen(open);
  }

  async function complete() {
    if (
      !flowId ||
      !sessionId ||
      !capture.current?.active ||
      capture.current.sessionId !== sessionId ||
      inFlight.current
    ) {
      return;
    }

    inFlight.current = true;
    setBusy("complete");
    closeCapture();
    try {
      const result = await requestLiveness({
        stage: "complete",
        flowId,
        sessionId,
      });
      if (result.success && "redirectTo" in result) {
        window.location.assign(result.redirectTo);
        return;
      }
      setError(result.success ? "unexpected_error" : result.code);
      reportClientError("form_error", {
        form: "vid",
        source: "vid",
        code: result.success ? "unexpected_error" : result.code,
      });
    } catch (error) {
      reportClientError(
        "form_error",
        { form: "vid", source: "vid", code: "network_error" },
        error,
      );
      setError("unexpected_error");
    }
    inFlight.current = false;
    setBusy(null);
  }

  async function handleCameraError() {
    if (
      capture.current?.active &&
      capture.current.sessionId === sessionId &&
      !inFlight.current
    ) {
      closeCapture();
      setError("camera_error");
    }
  }

  return (
    <>
      <Card className="w-full max-w-[448px] mx-auto border border-slate-200 dark:border-slate-800 rounded-[10px] bg-white dark:bg-card">
        <CardHeader className="space-y-4 pb-2 pt-8 flex flex-col items-center text-center border-b border-form-border-default dark:border-slate-800 mx-6">
          <Image
            src="/images/cuenta-unica-icon.svg"
            alt={register("logo_alt")}
            width={48}
            height={48}
            className="w-auto rounded-lg"
          />
          <CardTitle className="text-xl font-bold text-primary dark:text-blue-400">
            <h1>{t("title")}</h1>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {terminalError ? (
            <Alert className="border-secondary/30 bg-secondary/5 dark:border-secondary/50 dark:bg-secondary/10 [&>svg]:text-secondary">
              <Info aria-hidden="true" className="size-4" />
              <AlertDescription>
                <p className="font-semibold text-primary dark:text-blue-200">
                  {t(`errors.${terminalError}`)}
                </p>
                <p className="mt-1 text-muted-foreground">{t("restart")}</p>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
              <Image
                src="/images/vid-face-verification.svg"
                alt={register("verification.illustration_alt")}
                width={200}
                height={150}
              />
              <div className="text-center">
                {firstName && (
                  <h3 className="text-md font-bold text-primary dark:text-blue-300">
                    {register("verification.greeting", {
                      firstName: firstName.split(" ")[0]?.toUpperCase(),
                    })}
                  </h3>
                )}
                <p className="text-sm text-primary dark:text-blue-100/80 font-medium max-w-md mx-auto leading-relaxed">
                  {t("intro")}
                </p>
              </div>
              <ul className="w-full space-y-3 mt-4">
                {requirements.map(({ key, Icon }) => (
                  <li
                    key={key}
                    className="bg-[#eff7ff] dark:bg-slate-900/80 dark:border dark:border-slate-800 p-4 rounded flex items-center gap-4 text-sm text-primary dark:text-slate-100"
                  >
                    <Icon
                      aria-hidden="true"
                      className="w-8 h-8 opacity-70 shrink-0 text-primary dark:text-blue-300"
                    />
                    <p>
                      {register.rich(`verification.requirements.${key}`, {
                        strong: (chunks) => <strong>{chunks}</strong>,
                      })}
                    </p>
                  </li>
                ))}
              </ul>
              {error && !isModalOpen && (
                <Alert variant="destructive" className="w-full">
                  <AlertCircle aria-hidden="true" className="size-4" />
                  <AlertDescription>
                    {verificationErrorMessage(error)}
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-2 border-slate-200 dark:border-slate-800 rounded-xl mt-6 w-full">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="vid-terms"
                    className="h-6 w-6 rounded-md border-2 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-white data-[state=checked]:border-primary shrink-0"
                    checked={accepted}
                    onCheckedChange={(checked) => setAccepted(checked === true)}
                  />
                  <label
                    htmlFor="vid-terms"
                    className="text-base font-semibold leading-relaxed text-primary dark:text-blue-100 cursor-pointer select-none"
                  >
                    {register("verification.terms_accept_checkbox")}{" "}
                    <span className="text-destructive">*</span>
                  </label>
                </div>
                <Link
                  href={ROUTES.terms}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1 shrink-0 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 rounded-full transition-colors"
                >
                  {register("verification.terms_read_document")}{" "}
                  <ExternalLink aria-hidden="true" className="w-3.5 h-3.5" />
                </Link>
              </div>
              <Button
                type="button"
                onClick={start}
                disabled={!accepted || busy !== null}
                className="w-full h-12 text-base font-semibold rounded-full bg-primary hover:bg-[#002f5c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white mt-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {error ? register("verification.retry") : t("start")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={isModalOpen && !terminalError}
        onOpenChange={handleModalChange}
      >
        <DialogContent className="biometric-modal max-w-full w-screen h-[100dvh] m-0 p-0 rounded-none sm:rounded-none border-0 bg-[#0f1629] flex flex-col items-center justify-center overflow-hidden">
          <DialogTitle className="sr-only">
            {register("verification.modal.screenreader_title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {register("verification.modal.screenreader_description")}
          </DialogDescription>
          <div className="relative w-full h-full flex flex-col items-center justify-center max-w-2xl mx-auto px-4">
            {busy === "start" ? (
              <div role="status">
                <FaceLivenessLoader />
              </div>
            ) : busy === "complete" ? (
              <div
                role="status"
                className="text-center space-y-6 animate-in fade-in duration-500"
              >
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-white">
                    {register("verification.verifying_identity")}
                  </p>
                </div>
              </div>
            ) : sessionId ? (
              <div
                className="w-full liveness-detector-wrapper animate-in fade-in zoom-in-95 duration-500"
                data-testid="rekognition-liveness"
              >
                <FaceLiveness
                  source="vid"
                  sessionId={sessionId}
                  onComplete={complete}
                  onError={handleCameraError}
                />
              </div>
            ) : error ? (
              <div
                role="alert"
                className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500 w-full max-w-md mx-auto p-8"
              >
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                  <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                    <ShieldAlert
                      aria-hidden="true"
                      className="w-10 h-10 drop-shadow-md"
                    />
                  </div>
                </div>
                <div className="space-y-3 px-2">
                  <p className="text-2xl font-bold text-red-400">
                    {tError("title")}
                  </p>
                  <p className="text-base text-slate-200 leading-relaxed font-medium">
                    {verificationErrorMessage(error)}
                  </p>
                </div>
                <div className="pt-6 flex flex-col gap-3">
                  <Button
                    type="button"
                    onClick={start}
                    className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-900/20"
                  >
                    {register("verification.retry")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleModalChange(false)}
                    className="w-full h-12 text-base font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl"
                  >
                    {register("common.cancel")}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
