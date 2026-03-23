import { API } from "@/lib/constants/api"
import type { RegistrationVerificationResponse } from "@/lib/types/registration/session"

async function parseVerificationResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | RegistrationVerificationResponse
    | null

  if (!payload) {
    return {
      success: false,
      code: "unexpected_error",
    } satisfies RegistrationVerificationResponse
  }

  return payload
}

export const verificationService = {
  async completeRegistrationVerification(): Promise<RegistrationVerificationResponse> {
    try {
      const response = await fetch(API.registrationVerification, {
        method: "POST",
        credentials: "include",
      })

      return parseVerificationResponse(response)
    } catch (error) {
      console.error("[verificationService.completeRegistrationVerification] Request failed:", error)

      return {
        success: false,
        code: "unexpected_error",
      }
    }
  },
}
