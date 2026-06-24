import { type AnalyticsLinkageStatus, resolveLinkageStatus } from "./catalog";
import { getAnalyticsLaunchReturnUrl } from "./client-launch-core";

export const ANALYTICS_CONTEXT_COOKIE = "analytics_context";
export const ANALYTICS_CONTEXT_LAUNCH_COOKIE = "analytics_context_launch";
export const ANALYTICS_CONTEXT_DURATION_MS = 60 * 60 * 1000;

export interface AnalyticsContextClient {
  clientId: string;
}

export interface AnalyticsContextInput {
  entryPath: string;
  returnUrl?: string;
  client?: AnalyticsContextClient;
}

export interface AnalyticsContext {
  journeyId: string;
  clientId: string;
  linkageStatus: AnalyticsLinkageStatus;
  entryPath: string;
  issuedAt: number;
  expiresAt: number;
  returnUrl?: string;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signPayload(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(payload),
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

async function timingSafeEquals(left: string, right: string) {
  const leftBytes = textEncoder.encode(left);
  const rightBytes = textEncoder.encode(right);

  if (leftBytes.length !== rightBytes.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    mismatch |= leftBytes[index] ^ rightBytes[index];
  }

  return mismatch === 0;
}

export async function serializeAnalyticsContext(
  context: AnalyticsContext,
  secret: string,
) {
  const payload = bytesToBase64Url(textEncoder.encode(JSON.stringify(context)));
  const signature = await signPayload(payload, secret);
  return `${payload}.${signature}`;
}

export async function parseAnalyticsContext(
  value: string,
  secret: string,
): Promise<AnalyticsContext | null> {
  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = await signPayload(payload, secret);

  if (!(await timingSafeEquals(signature, expectedSignature))) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      textDecoder.decode(base64UrlToBytes(payload)),
    ) as AnalyticsContext;

    if (
      typeof parsed?.journeyId !== "string" ||
      typeof parsed?.clientId !== "string" ||
      typeof parsed?.entryPath !== "string" ||
      typeof parsed?.issuedAt !== "number" ||
      typeof parsed?.expiresAt !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function buildAnalyticsContext(input: AnalyticsContextInput) {
  const now = Date.now();
  const clientId = input.client?.clientId ?? "__unlinked__";

  return {
    journeyId: globalThis.crypto.randomUUID(),
    clientId,
    linkageStatus: resolveLinkageStatus(clientId),
    entryPath: input.entryPath,
    issuedAt: now,
    expiresAt: now + ANALYTICS_CONTEXT_DURATION_MS,
    ...(input.returnUrl ? { returnUrl: input.returnUrl } : {}),
  } satisfies AnalyticsContext;
}

export function buildAnalyticsContextFromUrl(
  url: URL,
  options: {
    client?: AnalyticsContextClient;
  } = {},
) {
  return buildAnalyticsContext({
    entryPath: url.pathname,
    returnUrl: getAnalyticsLaunchReturnUrl(url),
    ...(options.client ? { client: options.client } : {}),
  });
}

export function shouldRefreshAnalyticsContext(
  current: AnalyticsContext | null,
  nextContext: AnalyticsContext,
) {
  if (!current) {
    return true;
  }

  if (current.expiresAt < Date.now()) {
    return true;
  }

  if (current.entryPath !== nextContext.entryPath) {
    return true;
  }

  if (current.clientId !== nextContext.clientId) {
    return true;
  }

  if ((current.returnUrl ?? "") !== (nextContext.returnUrl ?? "")) {
    return true;
  }

  return false;
}
