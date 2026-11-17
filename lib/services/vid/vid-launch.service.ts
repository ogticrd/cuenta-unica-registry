import "server-only";

import { z } from "zod";
import { getOAuth2AdminClient, getOAuth2Client } from "@/lib/ory/oauth-client";
import { findCitizenSummaryByCedula } from "@/lib/services/registration/citizen-registry.service";
import { findOryIdentityById } from "@/lib/services/registration/ory-identity.service";
import type { VidLaunchErrorCode } from "@/lib/types/vid";
import { normalizeCedula } from "@/lib/utils/cedula";
import { isValidReturnUrl } from "@/lib/utils/return-url";

const cedulaPattern = /^\d{11}$|^\d{3}-\d{7}-\d$/;
const traitsSchema = z.object({
  cedula: z.string().optional(),
  username: z.string().optional(),
  preferred_username: z.string().optional(),
});
const tokenExtraSchema = z.object({
  session: z
    .object({
      identity: z.object({ id: z.string(), traits: z.unknown() }).optional(),
    })
    .optional(),
  id_token_claims: z.unknown(),
});
const userInfoSchema = traitsSchema.extend({
  sub: z.string().min(1),
  aud: z.union([z.string(), z.array(z.string())]).optional(),
});

const launchSchema = z.object({
  access_token: z.string().min(1),
  client_id: z.uuid(),
  redirect_uri: z
    .string()
    .refine(
      (value) =>
        Buffer.byteLength(JSON.stringify(value)) <= 1536 &&
        isValidReturnUrl(value),
    ),
  state: z
    .string()
    .refine((value) => Buffer.byteLength(JSON.stringify(value)) <= 512)
    .optional(),
});

type VidLaunchResult =
  | {
      success: true;
      cedula: string;
      firstName: string;
      redirectUri: string;
      state?: string;
    }
  | { success: false; code: VidLaunchErrorCode };

async function introspectAccessToken(token: string) {
  try {
    const { data } = await getOAuth2AdminClient().introspectOAuth2Token({
      token,
    });
    return data;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    if (status === 400 || status === 401 || status === 403 || status === 404) {
      return null;
    }
    throw error;
  }
}

async function readUserInfo(token: string) {
  const baseUrl = process.env.ORY_SDK_URL;
  if (!baseUrl) {
    throw new Error("Missing ORY_SDK_URL environment variable");
  }
  const response = await fetch(new URL("/userinfo", baseUrl), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    redirect: "error",
  });
  if (!response.ok) {
    return null;
  }
  const result = userInfoSchema.safeParse(await response.json());
  return result.success ? result.data : null;
}

function readCedula(...sources: unknown[]) {
  for (const source of sources) {
    const { data } = traitsSchema.safeParse(source);
    const value = [data?.cedula, data?.username, data?.preferred_username].find(
      (candidate) => candidate && cedulaPattern.test(candidate),
    );
    if (value) {
      return normalizeCedula(value);
    }
  }
  return null;
}

export async function authorizeVidLaunch(
  params: URLSearchParams,
): Promise<VidLaunchResult> {
  const parsed = launchSchema.safeParse({
    access_token: params.get("access_token"),
    client_id: params.get("client_id"),
    redirect_uri: params.get("redirect_uri"),
    state: params.get("state") ?? undefined,
  });
  if (!parsed.success) {
    return { success: false, code: "invalid_parameters" };
  }

  const {
    access_token: accessToken,
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  } = parsed.data;
  const introspection = await introspectAccessToken(accessToken);
  if (introspection?.token_use === "refresh_token") {
    return { success: false, code: "invalid_token" };
  }
  const token = introspection?.active ? introspection : null;
  const userInfo = token ? null : await readUserInfo(accessToken);
  if (!token && !userInfo) {
    return { success: false, code: "invalid_token" };
  }

  const audience = token?.aud ?? userInfo?.aud;
  const audiences =
    typeof audience === "string" ? [audience] : (audience ?? []);
  const clientMatches = audiences.length
    ? audiences.includes(clientId)
    : token?.client_id === clientId;
  if (!clientMatches) {
    return { success: false, code: "invalid_client" };
  }

  const client = await getOAuth2Client(clientId);
  if (!client) {
    return { success: false, code: "invalid_client" };
  }
  if (!client.redirect_uris?.includes(redirectUri)) {
    return { success: false, code: "invalid_redirect_uri" };
  }

  const { data: extra } = tokenExtraSchema.safeParse(token?.ext);
  const subject = extra?.session?.identity?.id ?? token?.sub ?? userInfo?.sub;
  if (!subject) {
    return { success: false, code: "invalid_token" };
  }
  const identityId = z.uuid().safeParse(subject);
  const identity = identityId.success
    ? await findOryIdentityById(identityId.data)
    : null;
  const cedula = readCedula(
    identity?.traits,
    extra?.session?.identity?.traits,
    extra?.id_token_claims,
    userInfo,
    { username: subject },
  );
  const citizen = cedula && (await findCitizenSummaryByCedula(cedula));
  if (!cedula || !citizen || normalizeCedula(citizen.id) !== cedula) {
    return { success: false, code: "citizen_not_found" };
  }

  return {
    success: true,
    cedula,
    firstName: citizen.firstName.slice(0, 64),
    redirectUri,
    state,
  };
}
