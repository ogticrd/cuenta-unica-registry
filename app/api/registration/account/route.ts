import {
  accountRequestSchema,
  getAccountRequestFieldErrors,
} from "@/lib/schemas/registration";
import { parseOptionalJsonRequest } from "@/lib/services/api-response";
import {
  completeRegistrationAccount,
  createAccountRegistrationErrorResult,
  createAccountRegistrationResponse,
} from "@/lib/services/registration/account-registration.service";
import { getRegistrationAccountDraft } from "@/lib/services/registration/registration-account-draft.service";
import { getRegistrationSession } from "@/lib/services/registration/registration-session.service";
import type {
  RegisterAccountFieldErrors,
  RegisterAccountRequest,
} from "@/lib/types/registration/account";
import type { RegistrationSession } from "@/lib/types/registration/session";

type OptionalAccountBodyResult =
  | {
      success: true;
      data: RegisterAccountRequest | null;
    }
  | {
      success: false;
      code: "invalid_payload";
      fieldErrors?: RegisterAccountFieldErrors;
    };

function parseOptionalAccountRequest(
  request: Request,
): Promise<OptionalAccountBodyResult> {
  return parseOptionalJsonRequest(request, accountRequestSchema, {
    getFieldErrors: getAccountRequestFieldErrors,
  });
}

export async function POST(request: Request) {
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

  const parsedRequest = await parseOptionalAccountRequest(request);

  if (!parsedRequest.success) {
    return createAccountRegistrationResponse(
      createAccountRegistrationErrorResult(parsedRequest.code, 400, {
        fieldErrors: parsedRequest.fieldErrors,
      }),
    );
  }

  if (registrationSession.status !== "verified") {
    return createAccountRegistrationResponse(
      createAccountRegistrationErrorResult("verification_required", 400),
    );
  }

  if (parsedRequest.data) {
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
      await completeRegistrationAccount(parsedRequest.data, {
        draft,
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
