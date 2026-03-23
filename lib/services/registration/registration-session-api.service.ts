import { API } from "@/lib/constants/api"
import type { RegistrationSessionResetResponse } from "@/lib/types/registration/session"

async function parseResetResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | RegistrationSessionResetResponse
    | null

  if (!payload) {
    return {
      success: false,
      code: "unexpected_error",
    } satisfies RegistrationSessionResetResponse
  }

  return payload
}

export const registrationSessionApiService = {
  async reset(): Promise<RegistrationSessionResetResponse> {
    try {
      const response = await fetch(API.registrationSessionReset, {
        method: "POST",
        credentials: "include",
      })

      return parseResetResponse(response)
    } catch (error) {
      console.error("[registrationSessionApiService.reset] Request failed:", error)

      return {
        success: false,
        code: "unexpected_error",
      }
    }
  },
}
