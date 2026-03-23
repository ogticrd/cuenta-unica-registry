import { NextResponse } from "next/server"
import { findCitizenSummaryByCedula } from "@/lib/services/registration/citizen-registry.service"
import { checkCitizenIdentity } from "@/lib/services/registration/ory-identity.service"
import { createRegistrationSessionCookie } from "@/lib/services/registration/registration-session.service"
import type {
  CitizenLookupRequest,
  CitizenLookupResponse,
  CitizenLookupErrorCode,
} from "@/lib/types/registration/citizen"
import { isValidCedula, normalizeCedula } from "@/lib/utils/cedula"

function createErrorResponse(
  code: CitizenLookupErrorCode,
  status: number,
) {
  const payload: CitizenLookupResponse = {
    success: false,
    code,
  }

  return NextResponse.json(payload, { status })
}

export async function POST(request: Request) {
  let body: CitizenLookupRequest | null = null

  try {
    body = (await request.json()) as CitizenLookupRequest
  } catch (error) {
    console.error("[/api/registration/citizen] Invalid request body:", error)
    return createErrorResponse("invalid_cedula", 400)
  }

  const cedula = normalizeCedula(body?.cedula ?? "")

  if (!(await isValidCedula(cedula))) {
    return createErrorResponse("invalid_cedula", 400)
  }

  try {
    const identityLookup = await checkCitizenIdentity(cedula)

    if (identityLookup.exists) {
      return createErrorResponse("identity_exists", 409)
    }

    const citizen = await findCitizenSummaryByCedula(cedula)

    if (!citizen) {
      return createErrorResponse("citizen_not_found", 404)
    }

    const payload: CitizenLookupResponse = {
      success: true,
      citizen,
    }

    const response = NextResponse.json(payload, { status: 200 })
    response.cookies.set(
      createRegistrationSessionCookie(normalizeCedula(citizen.id), "identified"),
    )

    return response
  } catch (error) {
    console.error("[/api/registration/citizen] Citizen lookup failed:", error)
    return createErrorResponse("unexpected_error", 500)
  }
}
