import { API } from "@/lib/constants/api";
import type {
  CreateLivenessSessionResponse,
  VerifyLivenessResponse,
} from "@/lib/types/registration/verification";

async function parseLivenessSessionResponse(response: Response) {
  const payload = (await response
    .json()
    .catch(() => null)) as CreateLivenessSessionResponse | null;

  if (!payload) {
    return {
      success: false,
      code: "unexpected_error",
    } satisfies CreateLivenessSessionResponse;
  }

  return payload;
}

async function parseVerifyLivenessResponse(response: Response) {
  const payload = (await response
    .json()
    .catch(() => null)) as VerifyLivenessResponse | null;

  if (!payload) {
    return {
      success: false,
      code: "unexpected_error",
    } satisfies VerifyLivenessResponse;
  }

  return payload;
}

export const verificationService = {
  async createLivenessSession(): Promise<CreateLivenessSessionResponse> {
    try {
      const response = await fetch(API.registrationLivenessSession, {
        method: "POST",
        credentials: "include",
      });

      return parseLivenessSessionResponse(response);
    } catch (error) {
      console.error(
        "[verificationService.createLivenessSession] Request failed:",
        error,
      );

      return {
        success: false,
        code: "unexpected_error",
      };
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

      return parseVerifyLivenessResponse(response);
    } catch (error) {
      console.error(
        "[verificationService.verifyLiveness] Request failed:",
        error,
      );

      return {
        success: false,
        code: "unexpected_error",
      };
    }
  },
};
