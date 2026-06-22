import { API } from "@/lib/constants/api";
import type {
  RegisterAccountRequest,
  RegisterAccountResponse,
  SaveRegisterAccountDraftResponse,
} from "@/lib/types/registration/account";

async function parseRegisterAccountResponse(response: Response) {
  const payload = (await response
    .json()
    .catch(() => null)) as RegisterAccountResponse | null;

  if (!payload) {
    return {
      success: false,
      code: "unexpected_error",
    } satisfies RegisterAccountResponse;
  }

  return payload;
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

      return parseRegisterAccountResponse(response);
    } catch (error) {
      console.error("[accountService.registerAccount] Request failed:", error);

      return {
        success: false,
        code: "unexpected_error",
      };
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
      const payload = (await response
        .json()
        .catch(() => null)) as SaveRegisterAccountDraftResponse | null;

      if (!payload) {
        return {
          success: false,
          code: "unexpected_error",
        };
      }

      return payload;
    } catch (error) {
      console.error("[accountService.saveAccountDraft] Request failed:", error);

      return {
        success: false,
        code: "unexpected_error",
      };
    }
  },
};
