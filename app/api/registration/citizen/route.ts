import { NextResponse } from "next/server";
import { getAnalyticsContext } from "@/lib/analytics/context";
import { emitAnalyticsEvent } from "@/lib/analytics/emitter";
import { logger } from "@/lib/logging/logger";
import { withRequestLogging } from "@/lib/logging/with-request-logging";
import {
  citizenLookupRequestSchema,
  getCitizenLookupFieldErrors,
} from "@/lib/schemas/registration";
import { parseJsonRequest } from "@/lib/services/api-response";
import { validateRecaptchaToken } from "@/lib/services/recaptcha/recaptcha.service";
import { validateCedula } from "@/lib/services/registration/cedula-validation.service";
import { findCitizenSummaryByCedula } from "@/lib/services/registration/citizen-registry.service";
import { checkCitizenIdentity } from "@/lib/services/registration/ory-identity.service";
import { createRegistrationSessionCookie } from "@/lib/services/registration/registration-session.service";
import type {
  CitizenLookupErrorCode,
  CitizenLookupFieldErrors,
  CitizenLookupResponse,
} from "@/lib/types/registration/citizen";
import { hasValidCedulaFormat, normalizeCedula } from "@/lib/utils/cedula";
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
  const log = options.success ? logger.info : logger.warn;
  log("Resultado de la identificación", {
    operation: "registration.identification",
    source: "registration",
    form:
      options.metadata?.operation === "account_recovery"
        ? "account_recovery"
        : "identification",
    code: options.errorCode,
    stage:
      typeof options.metadata?.stage === "string"
        ? options.metadata.stage
        : undefined,
  });
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

async function handlePOST(request: Request) {
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
  const analyticsContext = await getAnalyticsContext();
  const returnUrl =
    analyticsContext?.returnUrl ??
    getSafeReturnUrl(parsedRequest.data.returnUrl, {
      currentOrigin: getRequestOrigin(request.headers, request.url),
      allowedOrigins: parseAllowedReturnOrigins(
        process.env.REGISTRATION_ALLOWED_RETURN_ORIGINS,
      ),
    });

  if (!hasValidCedulaFormat(parsedRequest.data.cedula)) {
    await emitIdentificationOutcome({
      success: false,
      errorCode: "invalid_cedula",
      metadata: { stage: "cedula_validation" },
    });
    return createErrorResponse("invalid_cedula", 400, {
      cedula: "identification.id_invalid",
    });
  }

  const recaptchaIsValid = await validateRecaptchaToken(
    parsedRequest.data.recaptchaToken,
  );

  if (!recaptchaIsValid) {
    await emitIdentificationOutcome({
      success: false,
      errorCode: "recaptcha_failed",
      metadata: { stage: "recaptcha_validation" },
    });
    return createErrorResponse("recaptcha_failed", 403);
  }

  try {
    const validation = await validateCedula(cedula);
    if (!validation.success) {
      await emitIdentificationOutcome({
        success: false,
        errorCode: validation.code,
        metadata: { stage: "cedula_validation" },
      });
      return createErrorResponse(
        validation.code,
        validation.status,
        validation.code === "invalid_cedula"
          ? { cedula: "identification.id_invalid" }
          : undefined,
      );
    }

    const identityLookup = await checkCitizenIdentity(cedula);
    const recoverAccess = parsedRequest.data.recoverAccess === true;

    if (identityLookup.exists && !recoverAccess) {
      await emitIdentificationOutcome({
        success: false,
        errorCode: "identity_exists",
        metadata: { stage: "identity_lookup" },
      });
      return createErrorResponse("identity_exists", 409);
    }

    if (recoverAccess && !identityLookup.identityId) {
      await emitIdentificationOutcome({
        success: false,
        errorCode: "recovery_not_found",
        metadata: { stage: "identity_lookup" },
      });
      return createErrorResponse("recovery_not_found", 409);
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
      ...(recoverAccess ? { recovery: true as const } : {}),
    };

    const response = NextResponse.json(payload, { status: 200 });
    const recovery =
      recoverAccess && identityLookup.identityId
        ? { identityId: identityLookup.identityId }
        : undefined;
    response.cookies.set(
      createRegistrationSessionCookie(
        normalizeCedula(citizen.id),
        "identified",
        returnUrl,
        undefined,
        analyticsContext ?? undefined,
        recovery,
      ),
    );
    await emitIdentificationOutcome({
      success: true,
      metadata: {
        cedula: normalizeCedula(citizen.id),
        stage: "citizen_lookup",
        ...(recoverAccess ? { operation: "account_recovery" } : {}),
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
    logger.error(
      "[/api/registration/citizen] Citizen lookup failed:",
      { operation: "app.api.registration.citizen.route" },
      error,
    );
    await emitIdentificationOutcome({
      success: false,
      errorCode: "unexpected_error",
      metadata: { stage: "exception" },
    });
    return createErrorResponse("unexpected_error", 500);
  }
}

export const POST = withRequestLogging("/api/registration/citizen", handlePOST);
