import { type NextRequest, NextResponse } from "next/server";
import {
  getAnalyticsLaunchClientId,
  getAnalyticsLaunchReturnUrl,
  isAllowedAnalyticsReturnUrl,
} from "@/lib/analytics/client-launch-core";
import { createAnalyticsContextCookie } from "@/lib/analytics/context";
import {
  ANALYTICS_CONTEXT_LAUNCH_COOKIE,
  buildAnalyticsContextFromUrl,
} from "@/lib/analytics/context-core";
import { getOAuth2Client } from "@/lib/ory/oauth-client";

const REGISTRATION_ENTRY_PATH = "/register";

type OryOAuth2Client = NonNullable<Awaited<ReturnType<typeof getOAuth2Client>>>;

function getRequestOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getMetadataString(
  metadata: OryOAuth2Client["metadata"],
  keys: string[],
) {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  const metadataRecord = metadata as Record<string, unknown>;

  for (const key of keys) {
    const value = getString(metadataRecord[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function getClientAnalyticsLabels(client: OryOAuth2Client) {
  const clientName = getString(client.client_name);
  const owner = getString(client.owner);
  const institutionName =
    getMetadataString(client.metadata, [
      "institutionName",
      "institution_name",
      "institution",
    ]) ??
    owner ??
    clientName;

  return {
    ...(clientName ? { clientName } : {}),
    ...(institutionName ? { institutionName } : {}),
  };
}

export async function GET(request: NextRequest) {
  const clientId = getAnalyticsLaunchClientId(request.nextUrl);

  if (!clientId) {
    return NextResponse.json({ error: "Missing client_id" }, { status: 400 });
  }

  let client: Awaited<ReturnType<typeof getOAuth2Client>>;
  try {
    client = await getOAuth2Client(clientId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[analytics/start] Failed to validate Ory client:", {
      message,
    });
    const status = message.startsWith("Missing ORY_") ? 500 : 502;
    return NextResponse.json(
      { error: "Unable to validate analytics client" },
      { status },
    );
  }

  const returnUrl = getAnalyticsLaunchReturnUrl(request.nextUrl);

  if (
    !client ||
    !isAllowedAnalyticsReturnUrl(returnUrl, client.redirect_uris)
  ) {
    return NextResponse.json(
      { error: "Unknown or unauthorized analytics client launch" },
      { status: 404 },
    );
  }

  const redirectUrl = new URL(
    REGISTRATION_ENTRY_PATH,
    getRequestOrigin(request),
  );
  const response = NextResponse.redirect(redirectUrl);
  const contextUrl = new URL(request.nextUrl);
  contextUrl.pathname = redirectUrl.pathname;
  const context = buildAnalyticsContextFromUrl(contextUrl, {
    client: {
      clientId,
      ...getClientAnalyticsLabels(client),
    },
  });
  const cookie = await createAnalyticsContextCookie(context);

  response.cookies.set({ ...cookie, sameSite: "lax" });
  response.cookies.set({
    name: ANALYTICS_CONTEXT_LAUNCH_COOKIE,
    value: REGISTRATION_ENTRY_PATH,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30,
  });

  return response;
}
