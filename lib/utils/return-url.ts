/**
 * Validates that a return URL is a well-formed absolute HTTP(S) URL.
 * Rejects javascript:, data:, relative paths, and malformed URLs.
 */
export function isValidReturnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

interface SafeReturnUrlOptions {
  currentOrigin?: string;
  allowedOrigins?: string[];
}

function normalizeOrigin(origin: string) {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function getFirstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || undefined;
}

export function getRequestOrigin(headers: Headers, requestUrl?: string) {
  const parsedRequestUrl = requestUrl ? new URL(requestUrl) : undefined;
  const forwardedProto = getFirstHeaderValue(headers.get("x-forwarded-proto"));
  const forwardedHost = getFirstHeaderValue(headers.get("x-forwarded-host"));
  const host =
    forwardedHost ??
    getFirstHeaderValue(headers.get("host")) ??
    parsedRequestUrl?.host;
  const protocol =
    forwardedProto ?? parsedRequestUrl?.protocol.replace(":", "") ?? "http";

  return host ? `${protocol}://${host}` : undefined;
}

export function getSafeReturnUrl(
  url: string | undefined,
  { currentOrigin, allowedOrigins = [] }: SafeReturnUrlOptions,
) {
  if (!url) {
    return undefined;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return undefined;
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return undefined;
  }

  const normalizedAllowedOrigins = [
    ...(currentOrigin ? [currentOrigin] : []),
    ...allowedOrigins,
  ]
    .map(normalizeOrigin)
    .filter((origin): origin is string => Boolean(origin));

  if (!normalizedAllowedOrigins.includes(parsedUrl.origin)) {
    return undefined;
  }

  return parsedUrl.toString();
}

export function parseAllowedReturnOrigins(value: string | undefined) {
  return (
    value
      ?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []
  );
}
