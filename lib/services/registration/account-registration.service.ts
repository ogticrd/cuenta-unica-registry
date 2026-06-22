import "server-only";

import { NextResponse } from "next/server";
import { ROUTES } from "@/lib/constants/routes";
import { getServerCookies, mergeCookieHeaders } from "@/lib/ory/cookies";
import { validateRegistrationAccountCredentials } from "@/lib/services/registration/account-credential-validation.service";
import { findCitizenByCedula } from "@/lib/services/registration/citizen-registry.service";
import { mapOryAccountErrors } from "@/lib/services/registration/ory-account-error-mapper";
import {
  createOryEmailVerificationCodeFlow,
  type OryRegistrationPayload,
  type OryVerificationFlowPayload,
  registerOryAccount,
} from "@/lib/services/registration/ory-registration.service";
import {
  clearRegistrationAccountDraftCookie,
  type RegistrationAccountDraft,
} from "@/lib/services/registration/registration-account-draft.service";
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
import type { RegistrationSession } from "@/lib/types/registration/session";
import { isValidCedula, normalizeCedula } from "@/lib/utils/cedula";

export interface AccountRegistrationResult {
  payload: RegisterAccountResponse;
  status: number;
  setCookies: string[];
  clearRegistrationSession: boolean;
  clearAccountDraft: boolean;
}

interface CompleteRegistrationAccountOptions {
  registrationSession?: RegistrationSession;
  draft?: RegistrationAccountDraft;
}

function setOryCookies(response: NextResponse, setCookies: string[]) {
  for (const raw of setCookies) {
    const [nameValue, ...attrParts] = raw
      .replace(/;?\s*Domain=[^;]*/gi, "")
      .split(";");
    const eqIdx = nameValue?.indexOf("=") ?? -1;
    if (!nameValue || eqIdx === -1) continue;

    const attrs: Record<string, string> = {};
    for (const part of attrParts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;

      const attrSeparatorIndex = trimmedPart.indexOf("=");
      attrs[
        (attrSeparatorIndex === -1
          ? trimmedPart
          : trimmedPart.slice(0, attrSeparatorIndex)
        )
          .toLowerCase()
          .trim()
      ] =
        attrSeparatorIndex === -1
          ? ""
          : trimmedPart.slice(attrSeparatorIndex + 1).trim();
    }

    const maxAge = parseInt(attrs["max-age"], 10);

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

function createResult(
  payload: RegisterAccountResponse,
  status: number,
  options?: {
    setCookies?: string[];
    clearRegistrationSession?: boolean;
    clearAccountDraft?: boolean;
  },
): AccountRegistrationResult {
  return {
    payload,
    status,
    setCookies: options?.setCookies ?? [],
    clearRegistrationSession: options?.clearRegistrationSession ?? false,
    clearAccountDraft: options?.clearAccountDraft ?? false,
  };
}

export function createAccountRegistrationErrorResult(
  code: RegisterAccountErrorCode,
  status: number,
  options?: {
    fieldErrors?: RegisterAccountFieldErrors;
    setCookies?: string[];
    clearAccountDraft?: boolean;
  },
) {
  return createResult(
    {
      success: false,
      code,
      fieldErrors: options?.fieldErrors,
    },
    status,
    {
      setCookies: options?.setCookies,
      clearAccountDraft: options?.clearAccountDraft,
    },
  );
}

function buildEmailSentRedirect(flowId: string, returnUrl?: string) {
  const emailSentParams = new URLSearchParams({
    flow: flowId,
    ...(returnUrl ? { return_url: returnUrl } : {}),
  });

  return `${ROUTES.emailSent}?${emailSentParams.toString()}`;
}

function createEmailSentResult(
  flowId: string,
  returnUrl: string | undefined,
  setCookies: string[],
) {
  return createResult(
    {
      success: true,
      destination: "email-sent",
      redirectTo: buildEmailSentRedirect(flowId, returnUrl),
    },
    200,
    {
      setCookies,
      clearRegistrationSession: true,
      clearAccountDraft: true,
    },
  );
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hasVerifiedEmail(
  identity: OryRegistrationPayload["identity"],
  email: string,
) {
  const expectedEmail = normalizeEmail(email);

  return (
    identity?.verifiable_addresses?.some(
      (address) =>
        address.verified === true &&
        typeof address.value === "string" &&
        normalizeEmail(address.value) === expectedEmail &&
        (!address.via || address.via === "email"),
    ) ?? false
  );
}

function mapVerificationFlowErrors(payload: OryVerificationFlowPayload) {
  return mapOryAccountErrors({
    ui: payload.ui as OryRegistrationPayload["ui"],
    error: payload.error,
  });
}

export async function completeRegistrationAccount(
  input: RegisterAccountRequest,
  options: CompleteRegistrationAccountOptions = {},
): Promise<AccountRegistrationResult> {
  const registrationSession =
    options.registrationSession ?? (await getRegistrationSession());

  if (!registrationSession) {
    return createAccountRegistrationErrorResult(
      "registration_session_missing",
      400,
    );
  }

  if (registrationSession.status !== "verified") {
    return createAccountRegistrationErrorResult("verification_required", 400);
  }

  const cedula = normalizeCedula(registrationSession.cedula);

  if (
    options.draft &&
    (normalizeCedula(options.draft.cedula) !== cedula ||
      options.draft.sessionId !== registrationSession.sessionId)
  ) {
    return createAccountRegistrationErrorResult("account_draft_missing", 400, {
      clearAccountDraft: true,
    });
  }

  if (!(await isValidCedula(cedula))) {
    return createAccountRegistrationErrorResult("invalid_cedula", 400);
  }

  const credentialError = await validateRegistrationAccountCredentials(input, {
    cedula,
  });

  if (credentialError) {
    return createAccountRegistrationErrorResult(credentialError.code, 400, {
      fieldErrors: credentialError.fieldErrors,
    });
  }

  const citizen = await findCitizenByCedula(cedula);

  if (!citizen) {
    return createAccountRegistrationErrorResult("citizen_not_found", 404);
  }

  try {
    const incomingCookies = await getServerCookies();
    const { payload, setCookies } = await registerOryAccount({
      cookie: incomingCookies,
      email: input.email,
      password: input.password,
      cedula,
      firstName: citizen.names,
      lastName: citizen.lastName,
      birthDate: citizen.birthDate,
      gender: citizen.gender,
    });

    if (payload.ui) {
      const errorDetails = mapOryAccountErrors(payload);

      return createAccountRegistrationErrorResult(errorDetails.code, 400, {
        fieldErrors: errorDetails.fieldErrors,
        setCookies,
      });
    }

    if (payload.error) {
      const errorDetails = mapOryAccountErrors(payload);
      const status = payload.error.id === "security_csrf_violation" ? 400 : 502;

      console.error(
        "[account-registration] Ory returned an error payload:",
        payload.error,
      );

      return createAccountRegistrationErrorResult(errorDetails.code, status, {
        fieldErrors: errorDetails.fieldErrors,
        setCookies,
      });
    }

    const { returnUrl } = registrationSession;

    for (const block of payload.continue_with ?? []) {
      if (block.action === "show_verification_ui" && block.flow?.id) {
        return createEmailSentResult(block.flow.id, returnUrl, setCookies);
      }
    }

    if (payload.identity?.id) {
      if (!hasVerifiedEmail(payload.identity, input.email)) {
        const verificationFlow = await createOryEmailVerificationCodeFlow({
          cookie: mergeCookieHeaders(incomingCookies, setCookies),
          email: input.email,
          returnTo: returnUrl,
        });
        const combinedSetCookies = [
          ...setCookies,
          ...verificationFlow.setCookies,
        ];

        if (verificationFlow.payload.ui || verificationFlow.payload.error) {
          const errorDetails = mapVerificationFlowErrors(
            verificationFlow.payload,
          );

          if (verificationFlow.payload.error) {
            console.error(
              "[account-registration] Ory verification flow returned an error payload:",
              verificationFlow.payload.error,
            );
          }

          return createAccountRegistrationErrorResult(
            errorDetails.code,
            verificationFlow.payload.error ? 502 : 400,
            {
              fieldErrors: errorDetails.fieldErrors,
              setCookies: combinedSetCookies,
            },
          );
        }

        if (verificationFlow.payload.id) {
          return createEmailSentResult(
            verificationFlow.payload.id,
            returnUrl,
            combinedSetCookies,
          );
        }

        console.error(
          "[account-registration] Ory created an unverified identity without a verification flow:",
          payload.identity.id,
        );

        return createAccountRegistrationErrorResult("unexpected_error", 502, {
          setCookies: combinedSetCookies,
        });
      }

      return createResult(
        {
          success: true,
          destination: "login",
          redirectTo: returnUrl ?? `${ROUTES.login}?registered=true`,
        },
        200,
        {
          setCookies,
          clearRegistrationSession: true,
          clearAccountDraft: true,
        },
      );
    }

    return createAccountRegistrationErrorResult("unexpected_error", 500, {
      setCookies,
    });
  } catch (error) {
    console.error("[account-registration] Registration failed:", error);
    return createAccountRegistrationErrorResult("unexpected_error", 500);
  }
}

export function applyAccountRegistrationCookies(
  response: NextResponse,
  result: AccountRegistrationResult,
) {
  setOryCookies(response, result.setCookies);

  if (result.clearRegistrationSession) {
    response.cookies.set(clearRegistrationSessionCookie());
  }

  if (result.clearAccountDraft) {
    response.cookies.set(clearRegistrationAccountDraftCookie());
  }
}

export function createAccountRegistrationResponse(
  result: AccountRegistrationResult,
) {
  const response = NextResponse.json(result.payload, { status: result.status });
  applyAccountRegistrationCookies(response, result);

  return response;
}
