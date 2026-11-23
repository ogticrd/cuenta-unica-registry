import { logger } from "@/lib/logging/logger";
import "server-only";

import { verifyCitizenLiveness } from "@/lib/services/biometric/citizen-liveness.service";
import {
  getRegistrationAccountDraft,
  isRegistrationAccountDraftForSession,
  type RegistrationAccountDraft,
} from "@/lib/services/registration/registration-account-draft.service";
import { getRegistrationLivenessChallenge } from "@/lib/services/registration/registration-liveness-challenge.service";
import { getRegistrationSession } from "@/lib/services/registration/registration-session.service";
import type { RegistrationSession } from "@/lib/types/registration/session";
import type {
  VerifyLivenessErrorCode,
  VerifyLivenessResponse,
} from "@/lib/types/registration/verification";

export type RegistrationLivenessVerificationResult =
  | {
      success: true;
      status: 200;
      session: RegistrationSession;
      accountDraft: RegistrationAccountDraft;
      confidence: number;
      similarity: number;
    }
  | {
      success: false;
      status: number;
      code: VerifyLivenessErrorCode;
      session?: RegistrationSession;
    };

export function createVerifyLivenessPayload(
  result: RegistrationLivenessVerificationResult,
): VerifyLivenessResponse {
  if (!result.success) {
    return {
      success: false,
      code: result.code,
    };
  }

  return {
    success: true,
    confidence: result.confidence,
    similarity: result.similarity,
  };
}

export async function verifyRegistrationLiveness(
  sessionId: string,
): Promise<RegistrationLivenessVerificationResult> {
  const session = await getRegistrationSession();

  if (!session) {
    return {
      success: false,
      status: 400,
      code: "registration_session_missing",
    };
  }

  if (session.status === "verified") {
    return {
      success: false,
      status: 409,
      code: "verification_already_completed",
      session,
    };
  }

  if (!sessionId) {
    return {
      success: false,
      status: 400,
      code: "invalid_session_id",
      session,
    };
  }

  const challenge = await getRegistrationLivenessChallenge();

  if (
    !challenge ||
    challenge.registrationSessionId !== session.sessionId ||
    challenge.livenessSessionId !== sessionId
  ) {
    return {
      success: false,
      status: 400,
      code: "invalid_session_id",
      session,
    };
  }

  let accountDraft: Awaited<ReturnType<typeof getRegistrationAccountDraft>>;
  try {
    accountDraft = await getRegistrationAccountDraft();
  } catch (error) {
    logger.error(
      "[liveness-verification] Failed to read account draft:",
      { operation: "registration.liveness-verification.service" },
      error,
    );
    return {
      success: false,
      status: 500,
      code: "unexpected_error",
      session,
    };
  }

  if (!isRegistrationAccountDraftForSession(accountDraft, session)) {
    return {
      success: false,
      status: 400,
      code: "account_draft_missing",
      session,
    };
  }

  const result = await verifyCitizenLiveness(sessionId, session.cedula);
  if (!result.success) {
    return { ...result, session };
  }

  return { ...result, session, accountDraft };
}
