import "server-only";

function getConfiguredIngressUrl() {
  return process.env.ANALYTICS_INGRESS_URL?.trim().replace(/\/+$/, "") ?? "";
}

export function getAnalyticsApiBaseUrl() {
  const ingressUrl = getConfiguredIngressUrl();

  if (!ingressUrl) {
    return "";
  }

  return ingressUrl.endsWith("/events")
    ? ingressUrl.slice(0, -"/events".length)
    : ingressUrl;
}

export function getAnalyticsIngressEventsUrl() {
  const baseUrl = getAnalyticsApiBaseUrl();

  if (!baseUrl) {
    return "";
  }

  return `${baseUrl}/events`;
}

export function getAnalyticsIngressHeaderName() {
  return process.env.ANALYTICS_INGRESS_API_KEY_HEADER || "Authorization";
}

export function getAnalyticsIngressHeaderValue() {
  return process.env.ANALYTICS_INGRESS_API_KEY || "";
}
