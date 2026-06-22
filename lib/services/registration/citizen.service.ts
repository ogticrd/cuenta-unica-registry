import { API } from "@/lib/constants/api";
import {
  getCodedApiErrorPayload,
  parseJsonResponse,
} from "@/lib/services/api-response";
import type {
  CitizenLookupRequest,
  CitizenLookupResponse,
} from "@/lib/types/registration/citizen";

function getCitizenLookupFailure(error: unknown): CitizenLookupResponse {
  const payload =
    getCodedApiErrorPayload<Extract<CitizenLookupResponse, { success: false }>>(
      error,
    );

  if (payload) {
    return payload;
  }

  return {
    success: false,
    code: "unexpected_error",
  };
}

export const citizenService = {
  async identifyCitizen(
    cedula: string,
    returnUrl?: string,
  ): Promise<CitizenLookupResponse> {
    try {
      const requestBody: CitizenLookupRequest = { cedula, returnUrl };

      const response = await fetch(API.registrationCitizen, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      return await parseJsonResponse<CitizenLookupResponse>(response);
    } catch (error) {
      console.error("[citizenService.identifyCitizen] Request failed:", error);

      return getCitizenLookupFailure(error);
    }
  },
};
