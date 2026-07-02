import "server-only";

import type { OAuth2ConsentRequest } from "@ory/client";
import { getOryClient } from "@/lib/ory/client";
import { getServerCookies } from "@/lib/ory/cookies";
import { getOAuth2AdminClient } from "@/lib/ory/oauth-client";

type IdentityForClaims = {
  id?: string;
  traits?: Record<string, unknown>;
  verifiable_addresses?: Array<{
    value?: string;
    verified?: boolean;
    via?: string;
  }>;
};

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

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNameParts(name: unknown) {
  if (typeof name === "string") {
    return {
      name: stringValue(name),
      givenName: stringValue(name),
    };
  }

  if (!name || typeof name !== "object") {
    return {};
  }

  const nameRecord = name as Record<string, unknown>;
  const givenName =
    stringValue(nameRecord.first) ??
    stringValue(nameRecord.given) ??
    stringValue(nameRecord.given_name);
  const familyName =
    stringValue(nameRecord.last) ??
    stringValue(nameRecord.family) ??
    stringValue(nameRecord.family_name);
  const fullName = [givenName, familyName].filter(Boolean).join(" ");

  return {
    name: stringValue(fullName),
    givenName,
    familyName,
  };
}

function hasVerifiedEmail(identity: IdentityForClaims, email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  return (
    identity.verifiable_addresses?.some(
      (address) =>
        address.verified === true &&
        stringValue(address.value)?.toLowerCase() === normalizedEmail &&
        (!address.via || address.via === "email"),
    ) ?? false
  );
}

function buildOidcSessionClaims(
  identity: IdentityForClaims,
  grantScope: string[],
) {
  const grantedScopes = new Set(grantScope);
  const traits = identity.traits ?? {};
  const claims: Record<string, unknown> = {};

  if (grantedScopes.has("email")) {
    const email = stringValue(traits.email);

    if (email) {
      claims.email = email;
      claims.email_verified = hasVerifiedEmail(identity, email);
    }
  }

  if (grantedScopes.has("profile")) {
    const { familyName, givenName, name } = readNameParts(traits.name);
    const preferredUsername =
      stringValue(traits.preferred_username) ?? stringValue(traits.username);

    if (name) claims.name = name;
    if (givenName) claims.given_name = givenName;
    if (familyName) claims.family_name = familyName;
    if (preferredUsername) claims.preferred_username = preferredUsername;
  }

  return claims;
}

async function resolveConsentIdentity(consent: OAuth2ConsentRequest) {
  const cookie = await getServerCookies();
  const { data: session } = await getOryClient().toSession({ cookie });
  const identity = session.identity as IdentityForClaims | undefined;

  if (!identity?.id) {
    throw new Error("Authenticated Ory session is missing an identity.");
  }

  if (consent.subject && identity.id !== consent.subject) {
    throw new Error(
      "Authenticated Ory session does not match consent subject.",
    );
  }

  return identity;
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

  const identity = await resolveConsentIdentity(consent);
  const idTokenClaims = buildOidcSessionClaims(identity, grantScope);

  const response = await getOAuth2AdminClient().acceptOAuth2ConsentRequest({
    consentChallenge,
    acceptOAuth2ConsentRequest: {
      grant_access_token_audience: grantAudience,
      grant_scope: grantScope,
      remember: true,
      remember_for: 60 * 60,
      session: {
        id_token: idTokenClaims,
      },
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
