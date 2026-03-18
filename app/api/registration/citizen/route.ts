import { NextResponse } from "next/server"
import { findCitizenByCedula } from "@/lib/services/registration/citizen-registry.service"
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
    const citizen = await findCitizenByCedula(cedula)

    if (!citizen) {
      return createErrorResponse("citizen_not_found", 404)
    }

    const payload: CitizenLookupResponse = {
      success: true,
      citizen,
    }

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    console.error("[/api/registration/citizen] Citizen lookup failed:", error)
    return createErrorResponse("unexpected_error", 500)
  }
}
