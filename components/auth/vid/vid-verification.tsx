"use client";

import {
  AlertCircle,
  Camera,
  Info,
  Loader2,
  ScanFace,
  ShieldAlert,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { FaceLiveness } from "@/components/auth/register/face-liveness-detector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useT } from "@/hooks/use-t";
import { ROUTES } from "@/lib/constants/routes";
import { reportClientError } from "@/lib/logging/client";
import type {
  VidLaunchErrorCode,
  VidLivenessErrorCode,
  VidLivenessResponse,
} from "@/lib/types/vid";
import { cn } from "@/lib/utils";

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
  const [accepted, setAccepted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"start" | "complete" | null>(null);
  const [error, setError] = useState<VerificationError | null>(null);
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
    <Card
      className={cn(
        "w-full rounded-[10px] border-slate-200 bg-white dark:border-slate-800 dark:bg-card",
        sessionId ? "max-w-xl" : "max-w-[448px]",
      )}
    >
      <CardHeader className="mx-5 items-center gap-3 space-y-0 border-b border-form-border-default px-0 pb-5 pt-7 text-center dark:border-slate-800 sm:mx-6">
        <Image
          src="/images/cuenta-unica-icon.svg"
          alt=""
          width={48}
          height={48}
          className="rounded-lg"
        />
        <h1 className="text-xl font-bold text-primary dark:text-blue-400">
          {t("title")}
        </h1>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
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
        ) : busy ? (
          <p
            role="status"
            className="flex items-center justify-center gap-2 py-8 text-center text-sm font-medium text-primary dark:text-blue-300"
          >
            <Loader2
              aria-hidden="true"
              className="size-5 shrink-0 motion-safe:animate-spin"
            />
            {register(
              busy === "start"
                ? "verification.creating_session"
                : "verification.verifying_identity",
            )}
          </p>
        ) : sessionId ? (
          <div className="space-y-4">
            <div className="liveness-detector-wrapper overflow-hidden rounded-lg">
              <FaceLiveness
                source="vid"
                sessionId={sessionId}
                onComplete={complete}
                onError={handleCameraError}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full border-2 border-secondary font-semibold text-primary hover:bg-secondary/5 hover:text-primary dark:text-blue-200 dark:hover:text-blue-200"
              onClick={closeCapture}
            >
              {register("verification.liveness.cancel_button")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2 text-center">
              {firstName && (
                <p className="font-semibold text-primary dark:text-blue-300">
                  {register("verification.greeting", { firstName })}
                </p>
              )}
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("intro")}
              </p>
            </div>
            <ul className="space-y-2 text-sm leading-relaxed">
              {requirements.map(({ key, Icon }) => (
                <li
                  key={key}
                  className="flex items-center gap-3 rounded-md bg-[#eff7ff] p-3 text-primary dark:bg-slate-900/80 dark:text-slate-100"
                >
                  <Icon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-primary dark:text-blue-300"
                  />
                  <p>
                    {register.rich(`verification.requirements.${key}`, {
                      strong: (chunks) => <strong>{chunks}</strong>,
                    })}
                  </p>
                </li>
              ))}
            </ul>
            {error && (
              <Alert
                variant="destructive"
                className="border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 [&>svg]:text-current"
              >
                <AlertCircle aria-hidden="true" className="size-4" />
                <AlertDescription>
                  {verificationErrorMessage(error)}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex items-start gap-3 rounded-lg border p-3 text-sm">
              <Checkbox
                id="vid-terms"
                className="mt-0.5"
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked === true)}
              />
              <div className="space-y-1">
                <label
                  htmlFor="vid-terms"
                  className="block cursor-pointer font-medium"
                >
                  {register("verification.terms_accept_checkbox")}
                </label>
                <Link
                  href={ROUTES.terms}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-medium text-primary underline underline-offset-4 dark:text-blue-300"
                >
                  {register("verification.terms_read_document")}
                </Link>
              </div>
            </div>
            <Button
              type="button"
              onClick={start}
              disabled={!accepted}
              className="h-12 w-full bg-primary text-base font-semibold text-white hover:bg-[#002f5c] dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {error ? register("verification.retry") : t("start")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
