import { API } from "@/lib/constants/api"
import type {
  CitizenLookupRequest,
  CitizenLookupResponse,
} from "@/lib/types/registration/citizen"

async function parseCitizenLookupResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | CitizenLookupResponse
    | null

  if (!payload) {
    return {
      success: false,
      code: "unexpected_error",
    } satisfies CitizenLookupResponse
  }

  return payload
}

export const citizenService = {
  async identifyCitizen(cedula: string): Promise<CitizenLookupResponse> {
    try {
      const requestBody: CitizenLookupRequest = { cedula }

      const response = await fetch(API.registrationCitizen, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      })

      return parseCitizenLookupResponse(response)
    } catch (error) {
      console.error("[citizenService.identifyCitizen] Request failed:", error)

      return {
        success: false,
        code: "unexpected_error",
      }
    }
  },
}
