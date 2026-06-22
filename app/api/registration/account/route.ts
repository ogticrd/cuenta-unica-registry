import { accountRequestSchema } from "@/lib/schemas/registration";
import {
  completeRegistrationAccount,
  createAccountRegistrationErrorResult,
  createAccountRegistrationResponse,
} from "@/lib/services/registration/account-registration.service";
import { getRegistrationAccountDraft } from "@/lib/services/registration/registration-account-draft.service";
import { getRegistrationSession } from "@/lib/services/registration/registration-session.service";
import type { RegisterAccountRequest } from "@/lib/types/registration/account";
import type { RegistrationSession } from "@/lib/types/registration/session";

type OptionalAccountBodyResult =
  | {
      success: true;
      rawBody: string;
    }
  | {
      success: false;
      code: "invalid_payload";
    };

async function readOptionalAccountBody(
  request: Request,
): Promise<OptionalAccountBodyResult> {
  const rawBody = await request.text().catch(() => null);

  if (rawBody === null) {
    return {
      success: false,
      code: "invalid_payload" as const,
    };
  }

  return {
    success: true,
    rawBody,
  };
}

function parseOptionalAccountRequest(rawBody: string):
  | {
      success: true;
      data: RegisterAccountRequest | null;
    }
  | {
      success: false;
      code: "invalid_payload";
    } {
  if (!rawBody.trim()) {
    return {
      success: true,
      data: null,
    };
  }

  let body: unknown;

  try {
    body = JSON.parse(rawBody) as RegisterAccountRequest;
  } catch (error) {
    console.error("[/api/registration/account] Invalid request body:", error);
    return {
      success: false,
      code: "invalid_payload" as const,
    };
  }

  const parsedRequest = accountRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return {
      success: false,
      code: "invalid_payload" as const,
    };
  }

  return {
    success: true,
    data: parsedRequest.data,
  };
}

export async function POST(request: Request) {
  const bodyResult = await readOptionalAccountBody(request);

  if (!bodyResult.success) {
    return createAccountRegistrationResponse(
      createAccountRegistrationErrorResult(bodyResult.code, 400),
    );
  }

  let registrationSession: RegistrationSession | null;

  try {
    registrationSession = await getRegistrationSession();
  } catch (error) {
    console.error(
      "[/api/registration/account] Failed to read registration session:",
      error,
    );

    return createAccountRegistrationResponse(
      createAccountRegistrationErrorResult("unexpected_error", 500),
    );
  }

  if (!registrationSession) {
    return createAccountRegistrationResponse(
      createAccountRegistrationErrorResult("registration_session_missing", 400),
    );
  }

  const parsedRequest = parseOptionalAccountRequest(bodyResult.rawBody);

  if (!parsedRequest.success) {
    return createAccountRegistrationResponse(
      createAccountRegistrationErrorResult(parsedRequest.code, 400),
    );
  }

  if (parsedRequest.data) {
    return createAccountRegistrationResponse(
      await completeRegistrationAccount(parsedRequest.data, {
        registrationSession,
      }),
    );
  }

  let draft: Awaited<ReturnType<typeof getRegistrationAccountDraft>>;

  try {
    draft = await getRegistrationAccountDraft();
  } catch (error) {
    console.error(
      "[/api/registration/account] Failed to read account draft:",
      error,
    );

    return createAccountRegistrationResponse(
      createAccountRegistrationErrorResult("unexpected_error", 500),
    );
  }

  if (!draft) {
    return createAccountRegistrationResponse(
      createAccountRegistrationErrorResult("account_draft_missing", 400, {
        clearAccountDraft: true,
      }),
    );
  }

  return createAccountRegistrationResponse(
    await completeRegistrationAccount(
      {
        email: draft.email,
        password: draft.password,
      },
      { draft, registrationSession },
    ),
  );
}
