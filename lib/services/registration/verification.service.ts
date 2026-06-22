import { API } from "@/lib/constants/api";
import {
  getCodedApiErrorPayload,
  parseJsonResponse,
} from "@/lib/services/api-response";
import type {
  CompleteLivenessRegistrationResponse,
  CreateLivenessSessionResponse,
  VerifyLivenessResponse,
} from "@/lib/types/registration/verification";

function getCreateLivenessFailure(
  error: unknown,
): CreateLivenessSessionResponse {
  const payload =
    getCodedApiErrorPayload<
      Extract<CreateLivenessSessionResponse, { success: false }>
    >(error);

  if (payload) {
    return payload;
  }

  return {
    success: false,
    code: "unexpected_error",
  };
}

function getVerifyLivenessFailure(error: unknown): VerifyLivenessResponse {
  const payload =
    getCodedApiErrorPayload<
      Extract<VerifyLivenessResponse, { success: false }>
    >(error);

  if (payload) {
    return payload;
  }

  return {
    success: false,
    code: "unexpected_error",
  };
}

function getCompleteLivenessFailure(
  error: unknown,
): CompleteLivenessRegistrationResponse {
  const payload =
    getCodedApiErrorPayload<
      Extract<CompleteLivenessRegistrationResponse, { success: false }>
    >(error);

  if (payload) {
    return payload;
  }

  return {
    success: false,
    stage: "verification",
    code: "unexpected_error",
  };
}

export const verificationService = {
  async createLivenessSession(): Promise<CreateLivenessSessionResponse> {
    try {
      const response = await fetch(API.registrationLivenessSession, {
        method: "POST",
        credentials: "include",
      });

      return await parseJsonResponse<CreateLivenessSessionResponse>(response);
    } catch (error) {
      console.error(
        "[verificationService.createLivenessSession] Request failed:",
        error,
      );

      return getCreateLivenessFailure(error);
    }
  },

  async verifyLiveness(sessionId: string): Promise<VerifyLivenessResponse> {
    try {
      const response = await fetch(API.registrationLivenessResult, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId }),
      });

      return await parseJsonResponse<VerifyLivenessResponse>(response);
    } catch (error) {
      console.error(
        "[verificationService.verifyLiveness] Request failed:",
        error,
      );

      return getVerifyLivenessFailure(error);
    }
  },

  async completeLivenessRegistration(
    sessionId: string,
  ): Promise<CompleteLivenessRegistrationResponse> {
    try {
      const response = await fetch(API.registrationLivenessComplete, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId }),
      });
      return await parseJsonResponse<CompleteLivenessRegistrationResponse>(
        response,
      );
    } catch (error) {
      console.error(
        "[verificationService.completeLivenessRegistration] Request failed:",
        error,
      );

      return getCompleteLivenessFailure(error);
    }
  },
};
