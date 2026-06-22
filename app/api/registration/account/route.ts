import { accountRequestSchema } from "@/lib/schemas/registration";
import {
  completeRegistrationAccount,
  createAccountRegistrationErrorResult,
  createAccountRegistrationResponse,
} from "@/lib/services/registration/account-registration.service";
import { getRegistrationAccountDraft } from "@/lib/services/registration/registration-account-draft.service";
import type { RegisterAccountRequest } from "@/lib/types/registration/account";

type OptionalAccountRequestResult =
  | {
      success: true;
      data: RegisterAccountRequest | null;
    }
  | {
      success: false;
      code: "invalid_payload";
    };

async function readOptionalAccountRequest(
  request: Request,
): Promise<OptionalAccountRequestResult> {
  const rawBody = await request.text().catch(() => null);

  if (rawBody === null) {
    return {
      success: false,
      code: "invalid_payload" as const,
    };
  }

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
  const parsedRequest = await readOptionalAccountRequest(request);

  if (!parsedRequest.success) {
    return createAccountRegistrationResponse(
      createAccountRegistrationErrorResult(parsedRequest.code, 400),
    );
  }

  if (parsedRequest.data) {
    return createAccountRegistrationResponse(
      await completeRegistrationAccount(parsedRequest.data),
    );
  }

  const draft = await getRegistrationAccountDraft();

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
      { draft },
    ),
  );
}
