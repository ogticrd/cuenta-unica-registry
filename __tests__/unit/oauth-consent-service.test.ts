import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAcceptOAuth2ConsentRequest,
  mockGetOAuth2ConsentRequest,
  mockGetServerCookies,
  mockRejectOAuth2ConsentRequest,
  mockToSession,
} = vi.hoisted(() => ({
  mockAcceptOAuth2ConsentRequest: vi.fn(),
  mockGetOAuth2ConsentRequest: vi.fn(),
  mockGetServerCookies: vi.fn(),
  mockRejectOAuth2ConsentRequest: vi.fn(),
  mockToSession: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/ory/oauth-client", () => ({
  getOAuth2AdminClient: () => ({
    acceptOAuth2ConsentRequest: mockAcceptOAuth2ConsentRequest,
    getOAuth2ConsentRequest: mockGetOAuth2ConsentRequest,
    rejectOAuth2ConsentRequest: mockRejectOAuth2ConsentRequest,
  }),
}));

vi.mock("@/lib/ory/client", () => ({
  getOryClient: () => ({
    toSession: mockToSession,
  }),
}));

vi.mock("@/lib/ory/cookies", () => ({
  getServerCookies: mockGetServerCookies,
}));

import {
  acceptOAuthConsentRequest,
  getConsentClientLabel,
  rejectOAuthConsentRequest,
} from "@/lib/ory/oauth-consent";

describe("OAuth consent service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetOAuth2ConsentRequest.mockResolvedValue({
      data: {
        challenge: "consent-123",
        client: {
          client_id: "client-123",
          client_name: "Magaro gob",
        },
        requested_access_token_audience: ["accounts-api"],
        requested_scope: ["openid", "profile", "email"],
        subject: "identity-123",
      },
    });

    mockGetServerCookies.mockResolvedValue("ory_session=session-123");
    mockToSession.mockResolvedValue({
      data: {
        identity: {
          id: "identity-123",
          traits: {
            email: "citizen@example.test",
            name: {
              first: "Ada",
              last: "Lovelace",
            },
            username: "00112345678",
          },
          verifiable_addresses: [
            {
              value: "citizen@example.test",
              verified: true,
              via: "email",
            },
          ],
        },
      },
    });

    mockAcceptOAuth2ConsentRequest.mockResolvedValue({
      data: {
        redirect_to: "https://ory.example.test/oauth2/auth?consent_verifier=ok",
      },
    });

    mockRejectOAuth2ConsentRequest.mockResolvedValue({
      data: {
        redirect_to:
          "https://ory.example.test/oauth2/auth?consent_verifier=denied",
      },
    });
  });

  it("accepts requested scope and audience when no narrower grant is supplied", async () => {
    await expect(acceptOAuthConsentRequest("consent-123")).resolves.toBe(
      "https://ory.example.test/oauth2/auth?consent_verifier=ok",
    );

    expect(mockAcceptOAuth2ConsentRequest).toHaveBeenCalledWith({
      consentChallenge: "consent-123",
      acceptOAuth2ConsentRequest: {
        grant_access_token_audience: ["accounts-api"],
        grant_scope: ["openid", "profile", "email"],
        remember: true,
        remember_for: 3600,
        session: {
          id_token: {
            email: "citizen@example.test",
            email_verified: true,
            family_name: "Lovelace",
            given_name: "Ada",
            name: "Ada Lovelace",
            preferred_username: "00112345678",
          },
        },
      },
    });
  });

  it("accepts a valid subset of requested scope", async () => {
    await acceptOAuthConsentRequest("consent-123", {
      audience: [],
      scope: ["openid", "email"],
    });

    expect(mockAcceptOAuth2ConsentRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptOAuth2ConsentRequest: expect.objectContaining({
          grant_access_token_audience: [],
          grant_scope: ["openid", "email"],
          session: {
            id_token: {
              email: "citizen@example.test",
              email_verified: true,
            },
          },
        }),
      }),
    );
  });

  it("maps profile claims from string names and preferred usernames", async () => {
    mockGetOAuth2ConsentRequest.mockResolvedValueOnce({
      data: {
        challenge: "consent-123",
        client: {
          client_id: "client-123",
        },
        requested_scope: ["openid", "profile", "email"],
      },
    });
    mockToSession.mockResolvedValueOnce({
      data: {
        identity: {
          id: "identity-123",
          traits: {
            email: "citizen@example.test",
            name: "Ada Lovelace",
            preferred_username: "ada",
            username: "00112345678",
          },
          verifiable_addresses: [
            {
              value: "citizen@example.test",
              verified: true,
              via: "sms",
            },
          ],
        },
      },
    });

    await acceptOAuthConsentRequest("consent-123");

    expect(mockAcceptOAuth2ConsentRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptOAuth2ConsentRequest: expect.objectContaining({
          session: {
            id_token: {
              email: "citizen@example.test",
              email_verified: false,
              given_name: "Ada Lovelace",
              name: "Ada Lovelace",
              preferred_username: "ada",
            },
          },
        }),
      }),
    );
  });

  it("maps alternate Ory profile trait names into standard OIDC claims", async () => {
    mockToSession.mockResolvedValueOnce({
      data: {
        identity: {
          id: "identity-123",
          traits: {
            email: "citizen@example.test",
            name: {
              family_name: "Hopper",
              given_name: "Grace",
            },
          },
          verifiable_addresses: [
            {
              value: "CITIZEN@example.test",
              verified: true,
            },
          ],
        },
      },
    });

    await acceptOAuthConsentRequest("consent-123");

    expect(mockAcceptOAuth2ConsentRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptOAuth2ConsentRequest: expect.objectContaining({
          session: {
            id_token: {
              email: "citizen@example.test",
              email_verified: true,
              family_name: "Hopper",
              given_name: "Grace",
              name: "Grace Hopper",
            },
          },
        }),
      }),
    );
  });

  it("omits optional claims when the requested scopes do not grant them", async () => {
    mockGetOAuth2ConsentRequest.mockResolvedValueOnce({
      data: {
        challenge: "consent-123",
        requested_scope: ["openid"],
        subject: "identity-123",
      },
    });

    await acceptOAuthConsentRequest("consent-123");

    expect(mockAcceptOAuth2ConsentRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptOAuth2ConsentRequest: expect.objectContaining({
          grant_scope: ["openid"],
          session: {
            id_token: {},
          },
        }),
      }),
    );
  });

  it("rejects consent when the browser session has no identity", async () => {
    mockToSession.mockResolvedValueOnce({
      data: {
        identity: undefined,
      },
    });

    await expect(acceptOAuthConsentRequest("consent-123")).rejects.toThrow(
      "Authenticated Ory session is missing an identity.",
    );

    expect(mockAcceptOAuth2ConsentRequest).not.toHaveBeenCalled();
  });

  it("rejects consent when the browser session identity does not match the consent subject", async () => {
    mockToSession.mockResolvedValueOnce({
      data: {
        identity: {
          id: "different-identity",
          traits: {
            email: "citizen@example.test",
          },
        },
      },
    });

    await expect(acceptOAuthConsentRequest("consent-123")).rejects.toThrow(
      "Authenticated Ory session does not match consent subject.",
    );

    expect(mockAcceptOAuth2ConsentRequest).not.toHaveBeenCalled();
  });

  it("rejects scope not requested by Ory", async () => {
    await expect(
      acceptOAuthConsentRequest("consent-123", {
        scope: ["openid", "admin"],
      }),
    ).rejects.toThrow("Invalid OAuth scope: admin");

    expect(mockAcceptOAuth2ConsentRequest).not.toHaveBeenCalled();
  });

  it("rejects audience not requested by Ory", async () => {
    await expect(
      acceptOAuthConsentRequest("consent-123", {
        audience: ["admin-api"],
      }),
    ).rejects.toThrow("Invalid OAuth audience: admin-api");

    expect(mockAcceptOAuth2ConsentRequest).not.toHaveBeenCalled();
  });

  it("rejects consent through Ory", async () => {
    await expect(rejectOAuthConsentRequest("consent-123")).resolves.toBe(
      "https://ory.example.test/oauth2/auth?consent_verifier=denied",
    );

    expect(mockRejectOAuth2ConsentRequest).toHaveBeenCalledWith({
      consentChallenge: "consent-123",
      rejectOAuth2Request: {
        error: "access_denied",
        error_description: "The resource owner denied the consent request.",
      },
    });
  });

  it("uses the client name as the consent label", () => {
    expect(
      getConsentClientLabel({
        challenge: "consent-123",
        client: {
          client_id: "client-123",
          client_name: "Magaro gob",
        },
      }),
    ).toBe("Magaro gob");
  });
});
