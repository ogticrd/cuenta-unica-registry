import { NextResponse } from "next/server";
import {
  accountRequestSchema,
  getAccountRequestFieldErrors,
} from "@/lib/schemas/registration";
import { parseJsonRequest } from "@/lib/services/api-response";
import { validateRegistrationAccountCredentials } from "@/lib/services/registration/account-credential-validation.service";
import { createRegistrationAccountDraftCookie } from "@/lib/services/registration/registration-account-draft.service";
import { getRegistrationSession } from "@/lib/services/registration/registration-session.service";
import type {
  RegisterAccountFieldErrors,
  SaveRegisterAccountDraftErrorCode,
  SaveRegisterAccountDraftResponse,
} from "@/lib/types/registration/account";

function createErrorResponse(
  code: SaveRegisterAccountDraftErrorCode,
  status: number,
  fieldErrors?: RegisterAccountFieldErrors,
) {
  return NextResponse.json(
    {
      success: false,
      code,
      ...(fieldErrors ? { fieldErrors } : {}),
    } satisfies SaveRegisterAccountDraftResponse,
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const registrationSession = await getRegistrationSession();

    if (!registrationSession) {
      return createErrorResponse("registration_session_missing", 400);
    }

    const parsedRequest = await parseJsonRequest(
      request,
      accountRequestSchema,
      {
        getFieldErrors: getAccountRequestFieldErrors,
      },
    );

    if (!parsedRequest.success) {
      return createErrorResponse(
        parsedRequest.code,
        400,
        parsedRequest.fieldErrors,
      );
    }

    const credentialError = await validateRegistrationAccountCredentials(
      parsedRequest.data,
      {
        cedula: registrationSession.cedula,
      },
    );

    if (credentialError) {
      return createErrorResponse(
        credentialError.code,
        400,
        credentialError.fieldErrors,
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        sessionStatus: registrationSession.status,
      } satisfies SaveRegisterAccountDraftResponse,
      { status: 200 },
    );
    response.cookies.set(
      createRegistrationAccountDraftCookie({
        sessionId: registrationSession.sessionId,
        sessionExpiresAt: registrationSession.expiresAt,
        cedula: registrationSession.cedula,
        email: parsedRequest.data.email,
        password: parsedRequest.data.password,
      }),
    );

    return response;
  } catch (error) {
    console.error("[/api/registration/account-draft] Failed:", error);
    return createErrorResponse("unexpected_error", 500);
  }
}
