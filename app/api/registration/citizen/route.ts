import { NextResponse } from "next/server";
import { emitAnalyticsEvent } from "@/lib/analytics/emitter";
import {
  citizenLookupRequestSchema,
  getCitizenLookupFieldErrors,
} from "@/lib/schemas/registration";
import { parseJsonRequest } from "@/lib/services/api-response";
import { findCitizenSummaryByCedula } from "@/lib/services/registration/citizen-registry.service";
import { checkCitizenIdentity } from "@/lib/services/registration/ory-identity.service";
import { createRegistrationSessionCookie } from "@/lib/services/registration/registration-session.service";
import type {
  CitizenLookupErrorCode,
  CitizenLookupFieldErrors,
  CitizenLookupResponse,
} from "@/lib/types/registration/citizen";
import { isValidCedula, normalizeCedula } from "@/lib/utils/cedula";
import {
  getRequestOrigin,
  getSafeReturnUrl,
  parseAllowedReturnOrigins,
} from "@/lib/utils/return-url";

async function emitIdentificationOutcome(options: {
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}) {
  await emitAnalyticsEvent(
    {
      eventName: options.success
        ? "registration.identification.succeeded"
        : "registration.identification.failed",
      source: "registry-app",
      step: "identification",
      outcome: options.success ? "succeeded" : "failed",
      ...(options.errorCode ? { errorCode: options.errorCode } : {}),
      ...(options.metadata ? { metadata: options.metadata } : {}),
    },
    { entryPath: "/api/registration/citizen" },
  );
}

function createErrorResponse(
  code: CitizenLookupErrorCode,
  status: number,
  fieldErrors?: CitizenLookupFieldErrors,
) {
  const payload: CitizenLookupResponse = {
    success: false,
    code,
    ...(fieldErrors ? { fieldErrors } : {}),
  };

  return NextResponse.json(payload, { status });
}

export async function POST(request: Request) {
  const parsedRequest = await parseJsonRequest(
    request,
    citizenLookupRequestSchema,
    {
      getFieldErrors: getCitizenLookupFieldErrors,
    },
  );

  if (!parsedRequest.success) {
    await emitIdentificationOutcome({
      success: false,
      errorCode: "invalid_payload",
      metadata: { stage: "request_body" },
    });
    return createErrorResponse(
      parsedRequest.code,
      400,
      parsedRequest.fieldErrors,
    );
  }

  const cedula = normalizeCedula(parsedRequest.data.cedula);
  const returnUrl = getSafeReturnUrl(parsedRequest.data.returnUrl, {
    currentOrigin: getRequestOrigin(request.headers, request.url),
    allowedOrigins: parseAllowedReturnOrigins(
      process.env.REGISTRATION_ALLOWED_RETURN_ORIGINS,
    ),
  });

  if (!(await isValidCedula(cedula))) {
    await emitIdentificationOutcome({
      success: false,
      errorCode: "invalid_cedula",
      metadata: { stage: "cedula_validation" },
    });
    return createErrorResponse("invalid_cedula", 400, {
      cedula: "identification.id_invalid",
    });
  }

  try {
    const identityLookup = await checkCitizenIdentity(cedula);

    if (identityLookup.exists) {
      await emitIdentificationOutcome({
        success: false,
        errorCode: "identity_exists",
        metadata: { stage: "identity_lookup" },
      });
      return createErrorResponse("identity_exists", 409);
    }

    const citizen = await findCitizenSummaryByCedula(cedula);

    if (!citizen) {
      await emitIdentificationOutcome({
        success: false,
        errorCode: "citizen_not_found",
        metadata: { stage: "citizen_lookup" },
      });
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
    await emitIdentificationOutcome({
      success: true,
      metadata: {
        cedula: normalizeCedula(citizen.id),
        stage: "citizen_lookup",
        traits: {
          username: normalizeCedula(citizen.id),
          name: { first: citizen.firstName },
        },
        citizen: {
          id: normalizeCedula(citizen.id),
          firstName: citizen.firstName,
        },
      },
    });

    return response;
  } catch (error) {
    console.error("[/api/registration/citizen] Citizen lookup failed:", error);
    await emitIdentificationOutcome({
      success: false,
      errorCode: "unexpected_error",
      metadata: { stage: "exception" },
    });
    return createErrorResponse("unexpected_error", 500);
  }
}
