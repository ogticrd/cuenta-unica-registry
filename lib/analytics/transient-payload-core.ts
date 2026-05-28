import type { AnalyticsContext } from "./context-core";

export interface AnalyticsTransientPayload {
  analytics: {
    clientId: string;
    clientName?: string;
    institutionName?: string;
    linkageStatus: AnalyticsContext["linkageStatus"];
    journeyId: string;
    entryPath: string;
    returnUrl?: string;
    projectId?: string;
    environment?: string;
  };
}

export type OryFlowLike = {
  id?: unknown;
  request_url?: unknown;
  return_to?: unknown;
  oauth2_login_request?: {
    challenge?: unknown;
    client?: {
      client_id?: unknown;
      client_name?: unknown;
      metadata?: unknown;
    };
    request_url?: unknown;
  };
  ui?: {
    nodes?: unknown[];
  } & Record<string, unknown>;
} & Record<string, unknown>;

export function buildAnalyticsTransientPayload(
  context: AnalyticsContext,
  options?: {
    projectId?: string;
    environment?: string;
  },
): AnalyticsTransientPayload {
  return {
    analytics: {
      clientId: context.clientId,
      linkageStatus: context.linkageStatus,
      journeyId: context.journeyId,
      entryPath: context.entryPath,
      ...(context.returnUrl ? { returnUrl: context.returnUrl } : {}),
      ...(options?.projectId ? { projectId: options.projectId } : {}),
      ...(options?.environment ? { environment: options.environment } : {}),
    },
  };
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getMetadataString(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  return getString((metadata as Record<string, unknown>)[key]);
}

export function resolveAnalyticsTransientPayloadForFlow(
  flow: OryFlowLike,
  payload: AnalyticsTransientPayload | null | undefined,
): AnalyticsTransientPayload | undefined {
  const oauthClient = flow.oauth2_login_request?.client;
  const clientId = getString(oauthClient?.client_id);
  const clientName = getString(oauthClient?.client_name);
  const institutionName =
    getMetadataString(oauthClient?.metadata, "institutionName") ??
    getMetadataString(oauthClient?.metadata, "institution_name");

  if (!clientId && !payload) {
    return undefined;
  }

  const base = payload?.analytics ?? {
    clientId: "__unlinked__",
    linkageStatus: "unlinked" as const,
    journeyId:
      getString(flow.id) ??
      getString(flow.oauth2_login_request?.challenge) ??
      globalThis.crypto.randomUUID(),
    entryPath: getString(flow.request_url) ?? "ory-flow",
    ...(getString(flow.return_to)
      ? { returnUrl: getString(flow.return_to) }
      : {}),
  };

  return {
    analytics: {
      ...base,
      ...(clientId && base.clientId === "__unlinked__"
        ? {
            clientId,
            linkageStatus: "linked" as const,
          }
        : {}),
      ...(clientName ? { clientName } : {}),
      ...(institutionName ? { institutionName } : {}),
    },
  };
}

export function addAnalyticsTransientPayloadNode<T extends OryFlowLike>(
  flow: T,
  payload: AnalyticsTransientPayload | null | undefined,
): T {
  if (!payload || !flow?.ui) {
    return flow;
  }

  const nodes = Array.isArray(flow.ui.nodes) ? flow.ui.nodes : [];
  const hasTransientPayloadNode = nodes.some((node) => {
    const attributes = (node as { attributes?: { name?: unknown } })
      ?.attributes;
    return attributes?.name === "transient_payload";
  });

  if (hasTransientPayloadNode) {
    return flow;
  }

  return {
    ...flow,
    ui: {
      ...flow.ui,
      nodes: [
        ...nodes,
        {
          type: "input",
          group: "default",
          attributes: {
            name: "transient_payload",
            type: "hidden",
            value: JSON.stringify(payload),
            required: false,
            disabled: false,
            node_type: "input",
          },
          messages: [],
          meta: {},
        },
      ],
    },
  };
}
