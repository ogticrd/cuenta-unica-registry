import "server-only";

import { Configuration, FlowType, FrontendApi } from "@ory/client-fetch";
import type { OryClientConfiguration } from "@ory/elements-react";
import { getFlowFactory } from "@ory/nextjs/app";
import { headers } from "next/headers";

const initOverrides = { cache: "no-cache" as RequestCache };

/**
 * Server-side Ory FrontendApi client.
 *
 * Sends requests through the app's own proxy (not directly to Ory Cloud)
 * so that CSRF cookies scoped to the app's domain are forwarded correctly.
 * The proxy middleware then forwards the request to ORY_SDK_URL.
 */
async function createServerClient() {
  const publicUrl = await getPublicUrl();

  return new FrontendApi(
    new Configuration({
      headers: { Accept: "application/json" },
      basePath: publicUrl,
    }),
  );
}

/**
 * Returns the public-facing URL of the app from request headers.
 * Cloud Run sets x-forwarded-proto and host correctly.
 */
async function getPublicUrl() {
  const h = await headers();
  const host = h.get("host");
  const protocol = h.get("x-forwarded-proto") || "https";
  return `${protocol}://${host}`;
}

async function getCookieHeader() {
  const h = await headers();
  return h.get("cookie") ?? undefined;
}

async function toFlowParams(
  params: Promise<Record<string, string | string[] | undefined>>,
) {
  const p = await params;
  return {
    id: p.flow?.toString() ?? "",
    cookie: await getCookieHeader(),
  };
}

/**
 * Ensures params include return_to pointing to the app's public URL.
 * This is critical: after login/registration, Ory redirects to return_to.
 * Without it, Ory falls back to its own domain (cuenta.digital.gob.do).
 */
async function withReturnTo(
  params: Record<string, string | string[] | undefined>,
) {
  if (!params.return_to) {
    return { ...params, return_to: `${await getPublicUrl()}/` };
  }
  return params;
}

/**
 * Replacement for @ory/nextjs getLoginFlow that works in production.
 *
 * The stock SDK function uses guessPotentiallyProxiedOrySdkUrl() which
 * in production returns ORY_SDK_URL (Ory Cloud) for browser redirects,
 * causing cookie/CSRF mismatches. This version separates concerns:
 * - Server-side API calls → through the app's own proxy
 * - Browser redirect URLs → getPublicUrl() (the app's own domain)
 * - return_to → always set to the app's URL for post-auth redirects
 */
export async function getLoginFlow(
  config: OryClientConfiguration,
  params: Promise<Record<string, string | string[] | undefined>>,
) {
  return getFlowFactory(
    await withReturnTo(await params),
    async () =>
      (await createServerClient()).getLoginFlowRaw(
        await toFlowParams(params),
        initOverrides,
      ),
    FlowType.Login,
    await getPublicUrl(),
    config.project.login_ui_url,
  );
}

export async function getRegistrationFlow(
  config: OryClientConfiguration,
  params: Promise<Record<string, string | string[] | undefined>>,
) {
  return getFlowFactory(
    await withReturnTo(await params),
    async () =>
      (await createServerClient()).getRegistrationFlowRaw(
        await toFlowParams(params),
        initOverrides,
      ),
    FlowType.Registration,
    await getPublicUrl(),
    config.project.registration_ui_url,
  );
}

export async function getRecoveryFlow(
  config: OryClientConfiguration,
  params: Promise<Record<string, string | string[] | undefined>>,
) {
  return getFlowFactory(
    await withReturnTo(await params),
    async () =>
      (await createServerClient()).getRecoveryFlowRaw(
        await toFlowParams(params),
        initOverrides,
      ),
    FlowType.Recovery,
    await getPublicUrl(),
    config.project.recovery_ui_url,
  );
}

export async function getVerificationFlow(
  config: OryClientConfiguration,
  params: Promise<Record<string, string | string[] | undefined>>,
) {
  return getFlowFactory(
    await withReturnTo(await params),
    async () =>
      (await createServerClient()).getVerificationFlowRaw(
        await toFlowParams(params),
        initOverrides,
      ),
    FlowType.Verification,
    await getPublicUrl(),
    config.project.verification_ui_url,
  );
}

export async function getSettingsFlow(
  config: OryClientConfiguration,
  params: Promise<Record<string, string | string[] | undefined>>,
) {
  return getFlowFactory(
    await withReturnTo(await params),
    async () =>
      (await createServerClient()).getSettingsFlowRaw(
        await toFlowParams(params),
        initOverrides,
      ),
    FlowType.Settings,
    await getPublicUrl(),
    config.project.settings_ui_url,
  );
}
