import "server-only";

import {
  type ApiResponse,
  Configuration,
  FlowType,
  FrontendApi,
  type LoginFlow,
  type RecoveryFlow,
  type RegistrationFlow,
  type SettingsFlow,
  type VerificationFlow,
} from "@ory/client-fetch";
import type { OryClientConfiguration } from "@ory/elements-react";
import { getFlowFactory } from "@ory/nextjs/app";
import { headers } from "next/headers";
import { getAnalyticsTransientPayload } from "@/lib/analytics/transient-payload";
import type { AnalyticsTransientPayload } from "@/lib/analytics/transient-payload-core";
import {
  addAnalyticsTransientPayloadNode,
  type OryFlowLike,
  resolveAnalyticsTransientPayloadForFlow,
} from "@/lib/analytics/transient-payload-core";
import { getRequestOrigin } from "@/lib/ory/request-origin";

const initOverrides = { cache: "no-cache" as RequestCache };

async function createServerClient() {
  const publicUrl = await getRequestOrigin();

  return new FrontendApi(
    new Configuration({
      headers: { Accept: "application/json" },
      basePath: publicUrl,
    }),
  );
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

async function withReturnTo(
  params: Record<string, string | string[] | undefined>,
) {
  if (!params.return_to) {
    return { ...params, return_to: `${await getRequestOrigin()}/` };
  }
  return params;
}

function withAnalyticsTransientPayloadResponse<T extends object>(
  response: ApiResponse<T>,
  payload: AnalyticsTransientPayload | undefined,
): ApiResponse<T> {
  return {
    raw: response.raw,
    value: async () => {
      const flow = await response.value();
      const flowLike = flow as unknown as OryFlowLike;

      return addAnalyticsTransientPayloadNode(
        flowLike,
        resolveAnalyticsTransientPayloadForFlow(flowLike, payload),
      ) as T;
    },
  };
}

export async function getLoginFlow(
  config: OryClientConfiguration,
  params: Promise<Record<string, string | string[] | undefined>>,
): Promise<LoginFlow | null | void> {
  const transientPayload = await getAnalyticsTransientPayload();

  return getFlowFactory<LoginFlow>(
    await withReturnTo(await params),
    async () =>
      withAnalyticsTransientPayloadResponse(
        await (await createServerClient()).getLoginFlowRaw(
          await toFlowParams(params),
          initOverrides,
        ),
        transientPayload,
      ),
    FlowType.Login,
    await getRequestOrigin(),
    config.project.login_ui_url,
  );
}

export async function getRegistrationFlow(
  config: OryClientConfiguration,
  params: Promise<Record<string, string | string[] | undefined>>,
): Promise<RegistrationFlow | null | void> {
  const transientPayload = await getAnalyticsTransientPayload();

  return getFlowFactory<RegistrationFlow>(
    await withReturnTo(await params),
    async () =>
      withAnalyticsTransientPayloadResponse(
        await (await createServerClient()).getRegistrationFlowRaw(
          await toFlowParams(params),
          initOverrides,
        ),
        transientPayload,
      ),
    FlowType.Registration,
    await getRequestOrigin(),
    config.project.registration_ui_url,
  );
}

export async function getRecoveryFlow(
  config: OryClientConfiguration,
  params: Promise<Record<string, string | string[] | undefined>>,
): Promise<RecoveryFlow | null | void> {
  const transientPayload = await getAnalyticsTransientPayload();

  return getFlowFactory<RecoveryFlow>(
    await withReturnTo(await params),
    async () =>
      withAnalyticsTransientPayloadResponse(
        await (await createServerClient()).getRecoveryFlowRaw(
          await toFlowParams(params),
          initOverrides,
        ),
        transientPayload,
      ),
    FlowType.Recovery,
    await getRequestOrigin(),
    config.project.recovery_ui_url,
  );
}

export async function getVerificationFlow(
  config: OryClientConfiguration,
  params: Promise<Record<string, string | string[] | undefined>>,
): Promise<VerificationFlow | null | void> {
  const transientPayload = await getAnalyticsTransientPayload();

  return getFlowFactory<VerificationFlow>(
    await withReturnTo(await params),
    async () =>
      withAnalyticsTransientPayloadResponse(
        await (await createServerClient()).getVerificationFlowRaw(
          await toFlowParams(params),
          initOverrides,
        ),
        transientPayload,
      ),
    FlowType.Verification,
    await getRequestOrigin(),
    config.project.verification_ui_url,
  );
}

export async function getSettingsFlow(
  config: OryClientConfiguration,
  params: Promise<Record<string, string | string[] | undefined>>,
): Promise<SettingsFlow | null | void> {
  const transientPayload = await getAnalyticsTransientPayload();

  return getFlowFactory<SettingsFlow>(
    await withReturnTo(await params),
    async () =>
      withAnalyticsTransientPayloadResponse(
        await (await createServerClient()).getSettingsFlowRaw(
          await toFlowParams(params),
          initOverrides,
        ),
        transientPayload,
      ),
    FlowType.Settings,
    await getRequestOrigin(),
    config.project.settings_ui_url,
  );
}
