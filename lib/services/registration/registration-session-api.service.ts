import { API } from "@/lib/constants/api";
import {
  getCodedApiErrorPayload,
  parseJsonResponse,
} from "@/lib/services/api-response";
import type { RegistrationSessionResetResponse } from "@/lib/types/registration/session";

function getResetFailure(error: unknown): RegistrationSessionResetResponse {
  const payload =
    getCodedApiErrorPayload<
      Extract<RegistrationSessionResetResponse, { success: false }>
    >(error);

  if (payload?.code === "unexpected_error") {
    return payload;
  }

  return {
    success: false,
    code: "unexpected_error",
  };
}

export const registrationSessionApiService = {
  async reset(): Promise<RegistrationSessionResetResponse> {
    try {
      const response = await fetch(API.registrationSessionReset, {
        method: "POST",
        credentials: "include",
      });

      return await parseJsonResponse<RegistrationSessionResetResponse>(
        response,
      );
    } catch (error) {
      console.error(
        "[registrationSessionApiService.reset] Request failed:",
        error,
      );

      return getResetFailure(error);
    }
  },
};
