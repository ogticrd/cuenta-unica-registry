import { API } from "@/lib/constants/api";
import {
  getCodedApiErrorPayload,
  parseJsonResponse,
} from "@/lib/services/api-response";
import type {
  RegisterAccountRequest,
  RegisterAccountResponse,
  SaveRegisterAccountDraftResponse,
} from "@/lib/types/registration/account";

function getRegisterAccountFailure(error: unknown): RegisterAccountResponse {
  const payload =
    getCodedApiErrorPayload<
      Extract<RegisterAccountResponse, { success: false }>
    >(error);

  if (payload) {
    return payload;
  }

  return {
    success: false,
    code: "unexpected_error",
  };
}

function getAccountDraftFailure(
  error: unknown,
): SaveRegisterAccountDraftResponse {
  const payload =
    getCodedApiErrorPayload<
      Extract<SaveRegisterAccountDraftResponse, { success: false }>
    >(error);

  if (payload) {
    return payload;
  }

  return {
    success: false,
    code: "unexpected_error",
  };
}

export const accountService = {
  async registerAccount(
    input?: RegisterAccountRequest,
  ): Promise<RegisterAccountResponse> {
    try {
      const response = await fetch(API.registrationAccount, {
        method: "POST",
        credentials: "include",
        ...(input
          ? {
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(input),
            }
          : {}),
      });

      return await parseJsonResponse<RegisterAccountResponse>(response);
    } catch (error) {
      console.error("[accountService.registerAccount] Request failed:", error);

      return getRegisterAccountFailure(error);
    }
  },

  async saveAccountDraft(
    input: RegisterAccountRequest,
  ): Promise<SaveRegisterAccountDraftResponse> {
    try {
      const response = await fetch(API.registrationAccountDraft, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(input),
      });
      return await parseJsonResponse<SaveRegisterAccountDraftResponse>(
        response,
      );
    } catch (error) {
      console.error("[accountService.saveAccountDraft] Request failed:", error);

      return getAccountDraftFailure(error);
    }
  },
};
