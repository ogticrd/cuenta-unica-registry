export const ANALYTICS_CONTEXT_ENTRY_PATHS = [
  "/login",
  "/register",
  "/recovery",
  "/verification",
  "/settings",
] as const;

export type AnalyticsContextEntryPath =
  (typeof ANALYTICS_CONTEXT_ENTRY_PATHS)[number];

export function getAnalyticsLaunchClientId(url: URL) {
  return url.searchParams.get("client_id")?.trim() || undefined;
}

export function getAnalyticsLaunchEntryPath(
  url: URL,
  fallback: AnalyticsContextEntryPath = "/register",
): AnalyticsContextEntryPath {
  const entryPath = url.searchParams.get("entry_path")?.trim();

  if (
    ANALYTICS_CONTEXT_ENTRY_PATHS.includes(
      entryPath as AnalyticsContextEntryPath,
    )
  ) {
    return entryPath as AnalyticsContextEntryPath;
  }

  return fallback;
}

export function buildAnalyticsContextStartPath(options: {
  clientId: string | undefined;
  entryPath: AnalyticsContextEntryPath;
  returnUrl?: string;
}) {
  if (!options.clientId || options.clientId === "__unlinked__") {
    return options.entryPath;
  }

  const params = new URLSearchParams({
    client_id: options.clientId,
    entry_path: options.entryPath,
  });

  if (options.returnUrl) {
    params.set("return_url", options.returnUrl);
  }

  return `/api/analytics/start?${params.toString()}`;
}

export function getAnalyticsLaunchReturnUrl(url: URL) {
  return (
    url.searchParams.get("return_url") ??
    url.searchParams.get("return_to") ??
    undefined
  )?.trim();
}

function normalizeUrl(value: string) {
  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

export function isAllowedAnalyticsReturnUrl(
  returnUrl: string | undefined,
  allowedReturnUrls: string[] | undefined,
) {
  if (!returnUrl || !allowedReturnUrls?.length) {
    return true;
  }

  const normalizedReturnUrl = normalizeUrl(returnUrl);
  if (!normalizedReturnUrl) {
    return false;
  }

  return allowedReturnUrls.some((allowedReturnUrl) => {
    const normalizedAllowedUrl = normalizeUrl(allowedReturnUrl);
    return normalizedAllowedUrl === normalizedReturnUrl;
  });
}
