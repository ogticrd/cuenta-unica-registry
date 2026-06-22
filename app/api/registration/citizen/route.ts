import { NextResponse } from "next/server";
import { z } from "zod";
import { findCitizenSummaryByCedula } from "@/lib/services/registration/citizen-registry.service";
import { checkCitizenIdentity } from "@/lib/services/registration/ory-identity.service";
import { createRegistrationSessionCookie } from "@/lib/services/registration/registration-session.service";
import type {
  CitizenLookupErrorCode,
  CitizenLookupResponse,
} from "@/lib/types/registration/citizen";
import { isValidCedula, normalizeCedula } from "@/lib/utils/cedula";
import {
  getRequestOrigin,
  getSafeReturnUrl,
  parseAllowedReturnOrigins,
} from "@/lib/utils/return-url";

const citizenLookupRequestSchema = z.object({
  cedula: z.string(),
  returnUrl: z.string().optional(),
});

function createErrorResponse(code: CitizenLookupErrorCode, status: number) {
  const payload: CitizenLookupResponse = {
    success: false,
    code,
  };

  return NextResponse.json(payload, { status });
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch (error) {
    console.error("[/api/registration/citizen] Invalid request body:", error);
    return createErrorResponse("invalid_payload", 400);
  }

  const parsedRequest = citizenLookupRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return createErrorResponse("invalid_payload", 400);
  }

  const cedula = normalizeCedula(parsedRequest.data.cedula);
  const returnUrl = getSafeReturnUrl(parsedRequest.data.returnUrl, {
    currentOrigin: getRequestOrigin(request.headers, request.url),
    allowedOrigins: parseAllowedReturnOrigins(
      process.env.REGISTRATION_ALLOWED_RETURN_ORIGINS,
    ),
  });

  if (!(await isValidCedula(cedula))) {
    return createErrorResponse("invalid_cedula", 400);
  }

  try {
    const identityLookup = await checkCitizenIdentity(cedula);

    if (identityLookup.exists) {
      return createErrorResponse("identity_exists", 409);
    }

    const citizen = await findCitizenSummaryByCedula(cedula);

    if (!citizen) {
      return createErrorResponse("citizen_not_found", 404);
    }

    const payload: CitizenLookupResponse = {
      success: true,
      citizen,
    };

    const response = NextResponse.json(payload, { status: 200 });
    response.cookies.set(
      createRegistrationSessionCookie(
        normalizeCedula(citizen.id),
        "identified",
        returnUrl,
      ),
    );

    return response;
  } catch (error) {
    console.error("[/api/registration/citizen] Citizen lookup failed:", error);
    return createErrorResponse("unexpected_error", 500);
  }
}
