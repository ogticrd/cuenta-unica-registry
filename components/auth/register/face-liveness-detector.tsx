"use client";

import { createTheme, Loader, ThemeProvider } from "@aws-amplify/ui-react";
import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";
import "@aws-amplify/ui-react/styles.css";

import { useT } from "@/hooks/use-t";

const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1";

interface FaceLivenessProps {
  sessionId: string;
  onComplete: () => Promise<void>;
  onError: (error: unknown) => Promise<void>;
}

export function FaceLiveness({
  sessionId,
  onComplete,
  onError,
}: FaceLivenessProps) {
  const t = useT("register");

  const displayText = {
    instructionsHeader: t("verification.liveness.instructions_header"),
    playButtonText: t("verification.liveness.play_button"),
    hintMoveFaceFrontOfCameraText: t("verification.liveness.hint_move_face"),
    hintTooManyFacesText: t("verification.liveness.hint_too_many_faces"),
    hintFaceDetectedText: t("verification.liveness.hint_face_detected"),
    hintCanNotIdentifyText: t("verification.liveness.hint_cannot_identify"),
    hintTooFarText: t("verification.liveness.hint_too_far"),
    hintTooCloseText: t("verification.liveness.hint_too_close"),
    hintConnectingText: t("verification.liveness.hint_connecting"),
    hintVerifyingText: t("verification.liveness.hint_verifying"),
    hintIlluminationTooBrightText: t("verification.liveness.hint_too_bright"),
    hintIlluminationTooDarkText: t("verification.liveness.hint_too_dark"),
    hintIlluminationNormalText: t("verification.liveness.hint_normal_light"),
    hintHoldFaceForFreshnessText: t("verification.liveness.hint_hold_face"),
    hintCenterFaceText: t("verification.liveness.hint_center_face"),
    hintFaceOffCenterText: t("verification.liveness.hint_face_off_center"),
    cameraMinVideoConstraintsText: t(
      "verification.liveness.camera_min_resolution",
    ),
    cameraNotFoundText: t("verification.liveness.camera_not_found"),
    cameraNotAllowedText: t("verification.liveness.camera_not_allowed"),
    retryButtonText: t("verification.liveness.retry_button"),
    waitingCameraText: t("verification.liveness.waiting_camera"),
    cancelButtonText: t("verification.liveness.cancel_button"),
    closeButtonText: t("verification.liveness.close_button"),
    recordingIndicatorText: "",
    goodIlluminationText: t("verification.liveness.good_illumination"),
    lowIlluminationText: t("verification.liveness.low_illumination"),
    highIlluminationText: t("verification.liveness.high_illumination"),
    centerFaceInstructionText: t(
      "verification.liveness.center_face_instruction",
    ),
  };

  return (
    <ThemeProvider>
      <FaceLivenessDetector
        sessionId={sessionId}
        region={AWS_REGION}
        onAnalysisComplete={onComplete}
        onError={onError}
        disableStartScreen={true}
        displayText={displayText}
      />
    </ThemeProvider>
  );
}

export function FaceLivenessLoader() {
  const t = useT("register");

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-full border-[3px] border-blue-500/30 border-t-blue-400 animate-spin" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-white/90 text-base font-medium">
          {t("verification.creating_session")}
        </p>
        <p className="text-white/40 text-xs">
          {t("verification.modal.description")}
        </p>
      </div>
    </div>
  );
}
