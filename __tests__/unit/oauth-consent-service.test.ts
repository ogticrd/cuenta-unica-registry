import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAcceptOAuth2ConsentRequest,
  mockGetOAuth2ConsentRequest,
  mockRejectOAuth2ConsentRequest,
} = vi.hoisted(() => ({
  mockAcceptOAuth2ConsentRequest: vi.fn(),
  mockGetOAuth2ConsentRequest: vi.fn(),
  mockRejectOAuth2ConsentRequest: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/ory/oauth-client", () => ({
  getOAuth2AdminClient: () => ({
    acceptOAuth2ConsentRequest: mockAcceptOAuth2ConsentRequest,
    getOAuth2ConsentRequest: mockGetOAuth2ConsentRequest,
    rejectOAuth2ConsentRequest: mockRejectOAuth2ConsentRequest,
  }),
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
        }),
      }),
    );
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
