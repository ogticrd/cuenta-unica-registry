import { emitAnalyticsEvent } from "@/lib/analytics/emitter";
import { withRegistrationSessionAnalyticsContext } from "@/lib/analytics/registration-session-context";
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
  RegisterAccountResponse,
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

async function emitRegistrationOutcome(options: {
  success: boolean;
  flowId?: string;
  errorCode?: string;
  registrationSession?: RegistrationSession | null;
  metadata?: Record<string, unknown>;
}) {
  await emitAnalyticsEvent(
    withRegistrationSessionAnalyticsContext(
      {
        eventName: options.success
          ? "identity.registration.succeeded"
          : "identity.registration.failed",
        source: "registry-app",
        step: "account",
        outcome: options.success ? "succeeded" : "failed",
        ...(options.flowId ? { flowId: options.flowId } : {}),
        ...(options.errorCode ? { errorCode: options.errorCode } : {}),
        ...(options.metadata ? { metadata: options.metadata } : {}),
      },
      options.registrationSession,
    ),
    { entryPath: "/api/registration/account" },
  );
}

function emailVerificationFlowId(payload: RegisterAccountResponse) {
  if (!payload.success || payload.destination !== "email-sent") {
    return undefined;
  }

  try {
    const url = new URL(payload.redirectTo, "https://registry.local");
    return url.searchParams.get("flow") || undefined;
  } catch {
    return undefined;
  }
}

function accountMetadata(params: {
  registrationSession?: RegistrationSession | null;
  input?: RegisterAccountRequest | null;
  stage: string;
  destination?: string;
  flowId?: string;
}) {
  const { registrationSession, input, stage, destination, flowId } = params;
  const returnUrl = registrationSession?.returnUrl;

  return {
    ...(registrationSession?.cedula
      ? {
          cedula: registrationSession.cedula,
          traits: {
            username: registrationSession.cedula,
            ...(input?.email ? { email: input.email } : {}),
          },
        }
      : {}),
    stage,
    ...(destination || returnUrl || flowId
      ? {
          links: {
            ...(destination ? { destination } : {}),
            ...(returnUrl ? { returnUrl } : {}),
            ...(flowId ? { emailVerificationFlowId: flowId } : {}),
          },
        }
      : {}),
  };
}

async function emitAccountResult(params: {
  result: Awaited<ReturnType<typeof completeRegistrationAccount>>;
  registrationSession: RegistrationSession;
  input: RegisterAccountRequest;
}) {
  const { result, registrationSession, input } = params;
  const payload = result.payload;

  if (!payload.success) {
    await emitRegistrationOutcome({
      success: false,
      errorCode: payload.code,
      registrationSession,
      metadata: accountMetadata({
        registrationSession,
        input,
        stage: payload.code,
      }),
    });
    return;
  }

  const flowId = emailVerificationFlowId(payload);
  await emitRegistrationOutcome({
    success: true,
    flowId,
    registrationSession,
    metadata: accountMetadata({
      registrationSession,
      input,
      stage: "registration_created",
      destination: payload.destination,
      flowId,
    }),
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
    await emitRegistrationOutcome({
      success: false,
      errorCode: "unexpected_error",
      metadata: { stage: "session_read" },
    });

    return createAccountRegistrationResponse(
      createAccountRegistrationErrorResult("unexpected_error", 500),
    );
  }

  if (!registrationSession) {
    await emitRegistrationOutcome({
      success: false,
      errorCode: "registration_session_missing",
      metadata: { stage: "session_check" },
    });
    return createAccountRegistrationResponse(
      createAccountRegistrationErrorResult("registration_session_missing", 400),
    );
  }

  const parsedRequest = await parseOptionalAccountRequest(request);

  if (!parsedRequest.success) {
    await emitRegistrationOutcome({
      success: false,
      errorCode: parsedRequest.code,
      registrationSession,
      metadata: accountMetadata({
        registrationSession,
        stage: "request_body",
      }),
    });
    return createAccountRegistrationResponse(
      createAccountRegistrationErrorResult(parsedRequest.code, 400, {
        fieldErrors: parsedRequest.fieldErrors,
      }),
    );
  }

  if (registrationSession.status !== "verified") {
    await emitRegistrationOutcome({
      success: false,
      errorCode: "verification_required",
      registrationSession,
      metadata: accountMetadata({
        registrationSession,
        input: parsedRequest.data ?? undefined,
        stage: "session_state",
      }),
    });
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
      await emitRegistrationOutcome({
        success: false,
        errorCode: "unexpected_error",
        registrationSession,
        metadata: accountMetadata({
          registrationSession,
          input: parsedRequest.data,
          stage: "draft_read",
        }),
      });

      return createAccountRegistrationResponse(
        createAccountRegistrationErrorResult("unexpected_error", 500),
      );
    }

    if (!draft) {
      await emitRegistrationOutcome({
        success: false,
        errorCode: "account_draft_missing",
        registrationSession,
        metadata: accountMetadata({
          registrationSession,
          input: parsedRequest.data,
          stage: "account_draft",
        }),
      });
      return createAccountRegistrationResponse(
        createAccountRegistrationErrorResult("account_draft_missing", 400, {
          clearAccountDraft: true,
        }),
      );
    }

    const result = await completeRegistrationAccount(parsedRequest.data, {
      draft,
      registrationSession,
    });
    await emitAccountResult({
      result,
      registrationSession,
      input: parsedRequest.data,
    });

    return createAccountRegistrationResponse(result);
  }

  let draft: Awaited<ReturnType<typeof getRegistrationAccountDraft>>;

  try {
    draft = await getRegistrationAccountDraft();
  } catch (error) {
    console.error(
      "[/api/registration/account] Failed to read account draft:",
      error,
    );
    await emitRegistrationOutcome({
      success: false,
      errorCode: "unexpected_error",
      registrationSession,
      metadata: accountMetadata({ registrationSession, stage: "draft_read" }),
    });

    return createAccountRegistrationResponse(
      createAccountRegistrationErrorResult("unexpected_error", 500),
    );
  }

  if (!draft) {
    await emitRegistrationOutcome({
      success: false,
      errorCode: "account_draft_missing",
      registrationSession,
      metadata: accountMetadata({
        registrationSession,
        stage: "account_draft",
      }),
    });
    return createAccountRegistrationResponse(
      createAccountRegistrationErrorResult("account_draft_missing", 400, {
        clearAccountDraft: true,
      }),
    );
  }

  const input = {
    email: draft.email,
    password: draft.password,
  };
  const result = await completeRegistrationAccount(input, {
    draft,
    registrationSession,
  });
  await emitAccountResult({ result, registrationSession, input });

  return createAccountRegistrationResponse(result);
}
