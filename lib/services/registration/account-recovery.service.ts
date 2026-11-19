import "server-only";

import type { Identity, IdentityApi } from "@ory/client";
import { z } from "zod";
import { mapOryAccountErrors } from "@/lib/services/registration/ory-account-error-mapper";
import { createOryIdentityClient } from "@/lib/services/registration/ory-identity.service";
import type {
  RegisterAccountFieldErrors,
  RegisterAccountRequest,
} from "@/lib/types/registration/account";
import type { RegistrationSession } from "@/lib/types/registration/session";
import { normalizeCedula } from "@/lib/utils/cedula";

const identityTraitsSchema = z
  .object({
    username: z.string().regex(/^\d{11}$/),
  })
  .passthrough();

type AccountRecoveryResult =
  | { success: true; identity: Identity }
  | {
      success: false;
      code:
        | "verification_required"
        | "recovery_not_found"
        | "recovery_failed"
        | "recovery_sessions_revocation_failed"
        | "identity_exists"
        | "ory_validation_error";
      status: number;
      fieldErrors?: RegisterAccountFieldErrors;
    };

async function revokeIdentitySessions(client: IdentityApi, identityId: string) {
  const sessionIds = new Set<string>();
  const visitedPages = new Set<string>();
  let pagination: {
    pageSize?: number;
    pageToken?: string;
    page?: number;
    perPage?: number;
  } = { pageSize: 250 };
  while (true) {
    const response = await client.listIdentitySessions({
      id: identityId,
      active: true,
      ...pagination,
    });
    const sessions = z
      .array(z.object({ id: z.string().min(1) }))
      .safeParse(response.data ?? []);
    if (!sessions.success) {
      throw new Error("Ory returned an invalid session list");
    }
    for (const session of sessions.data) sessionIds.add(session.id);
    if (sessions.data.length === 0) break;

    const nextLink = String(response.headers.link ?? "")
      .split(",")
      .find((link) => /\brel="?next"?/.test(link));
    const nextHref = nextLink?.match(/<([^>]+)>/)?.[1];
    if (!nextHref) break;
    const nextUrl = new URL(nextHref, process.env.ORY_SDK_URL);
    const pageToken = nextUrl.searchParams.get("page_token");
    const nextPagination = pageToken
      ? { pageSize: 250, pageToken }
      : {
          page: Number(nextUrl.searchParams.get("page")),
          perPage: Number(nextUrl.searchParams.get("per_page") ?? 250),
        };
    if (
      !pageToken &&
      (!Number.isSafeInteger(nextPagination.page) ||
        (nextPagination.page ?? 0) < 1 ||
        !Number.isSafeInteger(nextPagination.perPage) ||
        (nextPagination.perPage ?? 0) < 1)
    ) {
      throw new Error("Ory returned invalid session pagination");
    }
    const pageKey = nextUrl.search;
    if (visitedPages.has(pageKey)) {
      throw new Error("Ory session pagination did not advance");
    }
    visitedPages.add(pageKey);
    pagination = nextPagination;
  }
  for (const id of sessionIds) {
    try {
      await client.disableSession({ id });
    } catch (error) {
      if (
        (error as { response?: { status?: number } })?.response?.status !== 404
      )
        throw error;
    }
  }
}

export async function recoverOryAccount(
  input: RegisterAccountRequest,
  session: RegistrationSession,
): Promise<AccountRecoveryResult> {
  if (
    !session.recovery ||
    session.status !== "verified" ||
    session.expiresAt <= Date.now()
  ) {
    return { success: false, code: "verification_required", status: 400 };
  }

  let stage = "identity_lookup";
  try {
    const client = createOryIdentityClient();
    const { data: identity } = await client.getIdentity({
      id: session.recovery.identityId,
    });
    const traits = identityTraitsSchema.safeParse(identity.traits);

    if (
      identity.id !== session.recovery.identityId ||
      identity.state !== "active" ||
      !traits.success ||
      traits.data.username !== normalizeCedula(session.cedula)
    ) {
      return { success: false, code: "recovery_not_found", status: 409 };
    }

    stage = "credentials_update";
    const { data: updatedIdentity } = await client.updateIdentity({
      id: identity.id,
      updateIdentityBody: {
        schema_id: identity.schema_id,
        state: identity.state,
        traits: { ...traits.data, email: input.email },
        credentials: { password: { config: { password: input.password } } },
        metadata_admin: identity.metadata_admin,
        metadata_public: identity.metadata_public,
        external_id: identity.external_id,
        region: identity.region,
      },
    });
    stage = "sessions_revocation";
    await revokeIdentitySessions(client, identity.id);

    return { success: true, identity: updatedIdentity };
  } catch (error) {
    const response = (
      error as { response?: { status?: number; data?: unknown } }
    )?.response;
    const status = response?.status;
    const payload = z
      .object({
        error: z
          .object({
            id: z.string().optional(),
            reason: z.string().optional(),
            message: z.string().optional(),
          })
          .optional(),
      })
      .safeParse(response?.data);
    const details = payload.success ? payload.data : undefined;
    let reason =
      details?.error?.reason ??
      details?.error?.message ??
      (error instanceof Error ? error.message : "");
    for (const value of [
      input.password,
      input.email,
      session.cedula,
      session.recovery.identityId,
    ]) {
      if (value) reason = reason.split(value).join("[redacted]");
    }
    reason = reason
      .replace(/[\w.+-]+@[\w.-]+/g, "[email]")
      .replace(/\b\d{3}-?\d{7}-?\d\b/g, "[cedula]")
      .replace(/\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b/gi, "[id]")
      .slice(0, 500);
    console.error(
      "[account-recovery] Ory request failed",
      JSON.stringify({
        stage,
        status,
        errorId: details?.error?.id,
        reason,
        name: error instanceof Error ? error.name : "UnknownError",
      }),
    );
    if (status === 404 && stage === "identity_lookup") {
      return { success: false, code: "recovery_not_found", status: 409 };
    }
    if (status === 409 && stage === "credentials_update") {
      return {
        success: false,
        code: "identity_exists",
        status: 409,
        fieldErrors: { email: "identities.messages.4000007" },
      };
    }
    if (status === 400 && stage === "credentials_update") {
      const mapped = mapOryAccountErrors(details ?? {});
      return {
        success: false,
        code:
          mapped.code === "identity_exists"
            ? "identity_exists"
            : "ory_validation_error",
        fieldErrors: mapped.fieldErrors,
        status: 400,
      };
    }
    return {
      success: false,
      code:
        stage === "sessions_revocation"
          ? "recovery_sessions_revocation_failed"
          : "recovery_failed",
      status: 502,
    };
  }
}
