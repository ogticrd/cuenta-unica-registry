export function getAnalyticsLaunchClientId(url: URL) {
  return url.searchParams.get("client_id")?.trim() || undefined;
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
