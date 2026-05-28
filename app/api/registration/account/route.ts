import { NextResponse } from "next/server";
import { emitAnalyticsEvent } from "@/lib/analytics/emitter";
import { ROUTES } from "@/lib/constants/routes";
import { getServerCookies } from "@/lib/ory/cookies";
import { accountRequestSchema } from "@/lib/schemas/registration";
import { findCitizenByCedula } from "@/lib/services/registration/citizen-registry.service";
import { mapOryAccountErrors } from "@/lib/services/registration/ory-account-error-mapper";
import { registerOryAccount } from "@/lib/services/registration/ory-registration.service";
import {
  clearRegistrationSessionCookie,
  getRegistrationSession,
} from "@/lib/services/registration/registration-session.service";
import type {
  RegisterAccountErrorCode,
  RegisterAccountFieldErrors,
  RegisterAccountRequest,
  RegisterAccountResponse,
} from "@/lib/types/registration/account";
import { isValidCedula, normalizeCedula } from "@/lib/utils/cedula";

async function emitRegistrationOutcome(options: {
  success: boolean;
  errorCode?: string;
  identityId?: string;
  flowId?: string;
  metadata?: Record<string, unknown>;
}) {
  await emitAnalyticsEvent(
    {
      eventName: options.success
        ? "identity.registration.succeeded"
        : "identity.registration.failed",
      source: "registry-app",
      step: "account",
      outcome: options.success ? "succeeded" : "failed",
      ...(options.errorCode ? { errorCode: options.errorCode } : {}),
      ...(options.identityId ? { identityId: options.identityId } : {}),
      ...(options.flowId ? { flowId: options.flowId } : {}),
      ...(options.metadata ? { metadata: options.metadata } : {}),
    },
    { entryPath: "/api/registration/account" },
  );
}

function setOryCookies(response: NextResponse, setCookies: string[]) {
  for (const raw of setCookies) {
    // Strip Domain so the browser stores the cookie on our app's domain
    const [nameValue, ...attrParts] = raw
      .replace(/;?\s*Domain=[^;]*/gi, "")
      .split(";");
    const eqIdx = nameValue?.indexOf("=") ?? -1;
    if (!nameValue || eqIdx === -1) continue;

    // Collect attributes into a map for easy lookup
    const attrs: Record<string, string> = {};
    for (const part of attrParts) {
      const t = part.trim();
      if (!t) continue;
      const i = t.indexOf("=");
      attrs[(i === -1 ? t : t.slice(0, i)).toLowerCase().trim()] =
        i === -1 ? "" : t.slice(i + 1).trim();
    }

    const maxAge = parseInt(attrs["max-age"], 10);

    // Use response.cookies.set() to avoid Next.js comma-merging bug
    // with multiple Set-Cookie headers
    response.cookies.set({
      name: nameValue.slice(0, eqIdx).trim(),
      value: nameValue.slice(eqIdx + 1).trim(),
      path: attrs.path || "/",
      httpOnly: "httponly" in attrs,
      secure: "secure" in attrs,
      sameSite: (attrs.samesite as "lax" | "strict" | "none") || "lax",
      ...(!Number.isNaN(maxAge) ? { maxAge } : {}),
    });
  }
}

function createJsonResponse(
  payload: RegisterAccountResponse,
  status: number,
  setCookies: string[] = [],
) {
  const response = NextResponse.json(payload, { status });
  setOryCookies(response, setCookies);
  return response;
}

function createErrorResponse(
  code: RegisterAccountErrorCode,
  status: number,
  options?: {
    fieldErrors?: RegisterAccountFieldErrors;
    setCookies?: string[];
  },
) {
  const payload: RegisterAccountResponse = {
    success: false,
    code,
    fieldErrors: options?.fieldErrors,
  };

  return createJsonResponse(payload, status, options?.setCookies);
}

function hasPasswordCedulaSimilarity(password: string, cedula: string) {
  return password.includes(cedula);
}

export async function POST(request: Request) {
  let body: RegisterAccountRequest | null = null;

  try {
    body = (await request.json()) as RegisterAccountRequest;
  } catch (error) {
    console.error("[/api/registration/account] Invalid request body:", error);
    await emitRegistrationOutcome({
      success: false,
      errorCode: "invalid_payload",
      metadata: { stage: "request_body" },
    });
    return createErrorResponse("invalid_payload", 400);
  }

  const parsedRequest = accountRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    await emitRegistrationOutcome({
      success: false,
      errorCode: "invalid_payload",
      metadata: { stage: "schema_validation" },
    });
    return createErrorResponse("invalid_payload", 400);
  }

  const registrationSession = await getRegistrationSession();

  if (!registrationSession) {
    await emitRegistrationOutcome({
      success: false,
      errorCode: "registration_session_missing",
      metadata: { stage: "session_check" },
    });
    return createErrorResponse("registration_session_missing", 400);
  }

  if (registrationSession.status !== "verified") {
    await emitRegistrationOutcome({
      success: false,
      errorCode: "verification_required",
      metadata: { stage: "session_state" },
    });
    return createErrorResponse("verification_required", 400);
  }

  const cedula = normalizeCedula(registrationSession.cedula);

  if (!(await isValidCedula(cedula))) {
    await emitRegistrationOutcome({
      success: false,
      errorCode: "invalid_cedula",
      metadata: { stage: "cedula_validation" },
    });
    return createErrorResponse("invalid_cedula", 400);
  }

  if (hasPasswordCedulaSimilarity(parsedRequest.data.password, cedula)) {
    await emitRegistrationOutcome({
      success: false,
      errorCode: "password_cedula_similarity",
      metadata: { stage: "password_validation" },
    });
    return createErrorResponse("password_cedula_similarity", 400);
  }

  const citizen = await findCitizenByCedula(cedula);

  if (!citizen) {
    await emitRegistrationOutcome({
      success: false,
      errorCode: "citizen_not_found",
      metadata: { stage: "citizen_lookup" },
    });
    return createErrorResponse("citizen_not_found", 404);
  }

  try {
    const incomingCookies = await getServerCookies();
    const { payload, setCookies } = await registerOryAccount({
      cookie: incomingCookies,
      email: parsedRequest.data.email,
      password: parsedRequest.data.password,
      cedula,
      firstName: citizen.names,
      lastName: citizen.lastName,
      birthDate: citizen.birthDate,
      gender: citizen.gender,
    });

    if (payload.ui) {
      const errorDetails = mapOryAccountErrors(payload);
      await emitRegistrationOutcome({
        success: false,
        errorCode: errorDetails.code,
        metadata: { stage: "ory_validation", hasUi: true },
      });

      return createErrorResponse(errorDetails.code, 400, {
        fieldErrors: errorDetails.fieldErrors,
        setCookies,
      });
    }

    if (payload.error) {
      const errorDetails = mapOryAccountErrors(payload);
      const status = payload.error.id === "security_csrf_violation" ? 400 : 502;

      console.error(
        "[/api/registration/account] Ory returned an error payload:",
        payload.error,
      );
      await emitRegistrationOutcome({
        success: false,
        errorCode: errorDetails.code,
        metadata: { stage: "ory_error", status },
      });

      return createErrorResponse(errorDetails.code, status, {
        fieldErrors: errorDetails.fieldErrors,
        setCookies,
      });
    }

    const { returnUrl } = registrationSession;

    for (const block of payload.continue_with ?? []) {
      if (block.action === "show_verification_ui" && block.flow?.id) {
        // Ory already sent the verification email via its after-registration hook.
        // Redirect to our custom OTP verification page with the flow ID.
        await emitRegistrationOutcome({
          success: true,
          flowId: block.flow.id,
          metadata: {
            stage: "registration_created",
            destination: "email-sent",
          },
        });

        const emailSentParams = new URLSearchParams({
          flow: block.flow.id,
          ...(returnUrl ? { return_url: returnUrl } : {}),
        });

        const responsePayload: RegisterAccountResponse = {
          success: true,
          destination: "email-sent",
          redirectTo: `${ROUTES.emailSent}?${emailSentParams.toString()}`,
        };

        const response = createJsonResponse(responsePayload, 200, setCookies);
        response.cookies.set(clearRegistrationSessionCookie());

        return response;
      }
    }

    if (payload.identity?.id) {
      await emitRegistrationOutcome({
        success: true,
        identityId: payload.identity.id,
        metadata: {
          stage: "registration_created",
          destination: "login",
        },
      });

      const responsePayload: RegisterAccountResponse = {
        success: true,
        destination: "login",
        redirectTo: returnUrl ?? `${ROUTES.login}?registered=true`,
      };

      const response = createJsonResponse(responsePayload, 200, setCookies);
      response.cookies.set(clearRegistrationSessionCookie());

      return response;
    }

    await emitRegistrationOutcome({
      success: false,
      errorCode: "unexpected_error",
      metadata: { stage: "unexpected_branch" },
    });
    return createErrorResponse("unexpected_error", 500, { setCookies });
  } catch (error) {
    console.error("[/api/registration/account] Registration failed:", error);
    await emitRegistrationOutcome({
      success: false,
      errorCode: "unexpected_error",
      metadata: { stage: "exception" },
    });
    return createErrorResponse("unexpected_error", 500);
  }
}
