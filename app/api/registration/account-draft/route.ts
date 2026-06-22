import { NextResponse } from "next/server";
import { accountRequestSchema } from "@/lib/schemas/registration";
import { validateRegistrationAccountCredentials } from "@/lib/services/registration/account-credential-validation.service";
import { createRegistrationAccountDraftCookie } from "@/lib/services/registration/registration-account-draft.service";
import { getRegistrationSession } from "@/lib/services/registration/registration-session.service";
import type {
  SaveRegisterAccountDraftErrorCode,
  SaveRegisterAccountDraftResponse,
} from "@/lib/types/registration/account";

function createErrorResponse(
  code: SaveRegisterAccountDraftErrorCode,
  status: number,
) {
  return NextResponse.json(
    {
      success: false,
      code,
    } satisfies SaveRegisterAccountDraftResponse,
    { status },
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    console.error("[/api/registration/account-draft] Invalid body:", error);
    return createErrorResponse("invalid_payload", 400);
  }

  try {
    const registrationSession = await getRegistrationSession();

    if (!registrationSession) {
      return createErrorResponse("registration_session_missing", 400);
    }

    const parsedRequest = accountRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return createErrorResponse("invalid_payload", 400);
    }

    const credentialError = await validateRegistrationAccountCredentials(
      parsedRequest.data,
      {
        cedula: registrationSession.cedula,
      },
    );

    if (credentialError) {
      return createErrorResponse(credentialError.code, 400);
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
