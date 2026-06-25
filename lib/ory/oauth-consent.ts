import "server-only";

import type { OAuth2ConsentRequest } from "@ory/client";
import { getOAuth2AdminClient } from "@/lib/ory/oauth-client";

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function assertSubset(values: string[], allowed: string[], label: string) {
  const allowedSet = new Set(allowed);
  const invalid = values.filter((value) => !allowedSet.has(value));

  if (invalid.length > 0) {
    throw new Error(`Invalid ${label}: ${invalid.join(", ")}`);
  }
}

export async function getOAuthConsentRequest(consentChallenge: string) {
  const response = await getOAuth2AdminClient().getOAuth2ConsentRequest({
    consentChallenge,
  });

  return response.data;
}

export async function acceptOAuthConsentRequest(
  consentChallenge: string,
  grant: {
    audience?: string[];
    scope?: string[];
  } = {},
) {
  const consent = await getOAuthConsentRequest(consentChallenge);
  const requestedScope = consent.requested_scope ?? [];
  const requestedAudience = consent.requested_access_token_audience ?? [];
  const grantScope = uniqueStrings(grant.scope ?? requestedScope);
  const grantAudience = uniqueStrings(grant.audience ?? requestedAudience);

  assertSubset(grantScope, requestedScope, "OAuth scope");
  assertSubset(grantAudience, requestedAudience, "OAuth audience");

  const response = await getOAuth2AdminClient().acceptOAuth2ConsentRequest({
    consentChallenge,
    acceptOAuth2ConsentRequest: {
      grant_access_token_audience: grantAudience,
      grant_scope: grantScope,
      remember: true,
      remember_for: 60 * 60,
    },
  });

  return response.data.redirect_to;
}

export async function rejectOAuthConsentRequest(consentChallenge: string) {
  const response = await getOAuth2AdminClient().rejectOAuth2ConsentRequest({
    consentChallenge,
    rejectOAuth2Request: {
      error: "access_denied",
      error_description: "The resource owner denied the consent request.",
    },
  });

  return response.data.redirect_to;
}

export function getConsentClientLabel(consent: OAuth2ConsentRequest) {
  return (
    consent.client?.client_name ||
    consent.client?.client_id ||
    "Aplicacion solicitante"
  );
}
