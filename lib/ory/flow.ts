import "server-only";

import {
  FrontendApi,
  Configuration,
  FlowType,
} from "@ory/client-fetch";
import { getFlowFactory } from "@ory/nextjs/app";
import { headers } from "next/headers";

import type { OryClientConfiguration } from "@ory/elements-react";

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
    id: p["flow"]?.toString() ?? "",
    cookie: await getCookieHeader(),
  };
}

/**
 * Replacement for @ory/nextjs getLoginFlow that works in production.
 *
 * The stock SDK function uses guessPotentiallyProxiedOrySdkUrl() which
 * in production returns ORY_SDK_URL (Ory Cloud) for browser redirects,
 * causing cookie/CSRF mismatches. This version separates concerns:
 * - Server-side API calls → ORY_SDK_URL (Ory Cloud)
 * - Browser redirect URLs → getPublicUrl() (the app's own domain)
 */
export async function getLoginFlow(
  config: OryClientConfiguration,
  params: Promise<Record<string, string | string[] | undefined>>,
) {
  return getFlowFactory(
    await params,
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
    await params,
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
    await params,
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
    await params,
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
    await params,
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
