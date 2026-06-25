import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetRegistrationSession,
  mockClearRegistrationSessionCookie,
  mockCreateRegistrationSessionCookie,
  mockCreateRegistrationSessionCookieFromSession,
  mockCreateRegistrationLivenessChallengeCookie,
  mockClearRegistrationLivenessChallengeCookie,
  mockGetRegistrationLivenessChallenge,
  mockGetRegistrationAccountDraft,
  mockCreateRegistrationAccountDraftCookie,
  mockClearRegistrationAccountDraftCookie,
  mockFindCitizenSummaryByCedula,
  mockCheckCitizenIdentity,
  mockFindCitizenByCedula,
  mockRegisterOryAccount,
  mockMapOryAccountErrors,
  mockGetServerCookies,
  mockIsValidCedula,
  mockNormalizeCedula,
  mockIsPasswordStrongEnough,
  mockIsBreachedPassword,
  mockGetRequestOrigin,
  mockGetSafeReturnUrl,
  mockParseAllowedReturnOrigins,
  mockGetAnalyticsContext,
  mockCreateLivenessSession,
  mockGetLivenessResults,
  mockCompareFaces,
  mockFetchCitizenPhoto,
  mockCreateOryEmailVerificationCodeFlow,
  mockMergeCookieHeaders,
} = vi.hoisted(() => ({
  mockGetRegistrationSession: vi.fn(),
  mockClearRegistrationSessionCookie: vi.fn(),
  mockCreateRegistrationSessionCookie: vi.fn(),
  mockCreateRegistrationSessionCookieFromSession: vi.fn(),
  mockCreateRegistrationLivenessChallengeCookie: vi.fn(),
  mockClearRegistrationLivenessChallengeCookie: vi.fn(),
  mockGetRegistrationLivenessChallenge: vi.fn(),
  mockGetRegistrationAccountDraft: vi.fn(),
  mockCreateRegistrationAccountDraftCookie: vi.fn(),
  mockClearRegistrationAccountDraftCookie: vi.fn(),
  mockFindCitizenSummaryByCedula: vi.fn(),
  mockCheckCitizenIdentity: vi.fn(),
  mockFindCitizenByCedula: vi.fn(),
  mockRegisterOryAccount: vi.fn(),
  mockMapOryAccountErrors: vi.fn(),
  mockGetServerCookies: vi.fn(),
  mockIsValidCedula: vi.fn(),
  mockNormalizeCedula: vi.fn((value: string) => value),
  mockIsPasswordStrongEnough: vi.fn(),
  mockIsBreachedPassword: vi.fn(),
  mockGetRequestOrigin: vi.fn(),
  mockGetSafeReturnUrl: vi.fn(),
  mockParseAllowedReturnOrigins: vi.fn(),
  mockGetAnalyticsContext: vi.fn(),
  mockCreateLivenessSession: vi.fn(),
  mockGetLivenessResults: vi.fn(),
  mockCompareFaces: vi.fn(),
  mockFetchCitizenPhoto: vi.fn(),
  mockCreateOryEmailVerificationCodeFlow: vi.fn(),
  mockMergeCookieHeaders: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/services/registration/registration-session.service", () => ({
  getRegistrationSession: mockGetRegistrationSession,
  clearRegistrationSessionCookie: mockClearRegistrationSessionCookie,
  createRegistrationSessionCookie: mockCreateRegistrationSessionCookie,
  createRegistrationSessionCookieFromSession:
    mockCreateRegistrationSessionCookieFromSession,
}));

vi.mock(
  "@/lib/services/registration/registration-liveness-challenge.service",
  () => ({
    createRegistrationLivenessChallengeCookie:
      mockCreateRegistrationLivenessChallengeCookie,
    clearRegistrationLivenessChallengeCookie:
      mockClearRegistrationLivenessChallengeCookie,
    getRegistrationLivenessChallenge: mockGetRegistrationLivenessChallenge,
  }),
);

vi.mock(
  "@/lib/services/registration/registration-account-draft.service",
  () => ({
    getRegistrationAccountDraft: mockGetRegistrationAccountDraft,
    isRegistrationAccountDraftForSession: (
      draft: { cedula: string; sessionId: string } | null,
      session: { cedula: string; sessionId: string },
    ) =>
      !!draft &&
      draft.sessionId === session.sessionId &&
      mockNormalizeCedula(draft.cedula) === mockNormalizeCedula(session.cedula),
    createRegistrationAccountDraftCookie:
      mockCreateRegistrationAccountDraftCookie,
    clearRegistrationAccountDraftCookie:
      mockClearRegistrationAccountDraftCookie,
  }),
);

vi.mock("@/lib/services/registration/citizen-registry.service", () => ({
  findCitizenByCedula: mockFindCitizenByCedula,
  findCitizenSummaryByCedula: mockFindCitizenSummaryByCedula,
}));

vi.mock("@/lib/services/registration/ory-identity.service", () => ({
  checkCitizenIdentity: mockCheckCitizenIdentity,
}));

vi.mock("@/lib/services/registration/ory-registration.service", () => ({
  registerOryAccount: mockRegisterOryAccount,
  createOryEmailVerificationCodeFlow: mockCreateOryEmailVerificationCodeFlow,
}));

vi.mock("@/lib/services/registration/ory-account-error-mapper", () => ({
  mapOryAccountErrors: mockMapOryAccountErrors,
}));

vi.mock("@/lib/ory/cookies", () => ({
  getServerCookies: mockGetServerCookies,
  mergeCookieHeaders: mockMergeCookieHeaders,
}));

vi.mock("@/lib/utils/cedula", () => ({
  isValidCedula: mockIsValidCedula,
  normalizeCedula: mockNormalizeCedula,
}));

vi.mock("@/lib/utils/password", () => ({
  PASSWORD_MIN_LENGTH: 10,
  isPasswordStrongEnough: mockIsPasswordStrongEnough,
  isBreachedPassword: mockIsBreachedPassword,
}));

vi.mock("@/lib/utils/return-url", () => ({
  getRequestOrigin: mockGetRequestOrigin,
  getSafeReturnUrl: mockGetSafeReturnUrl,
  parseAllowedReturnOrigins: mockParseAllowedReturnOrigins,
}));

vi.mock("@/lib/analytics/context", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/analytics/context")>();

  return {
    ...actual,
    getAnalyticsContext: mockGetAnalyticsContext,
  };
});

vi.mock("@/lib/services/registration/rekognition.service", () => ({
  createLivenessSession: mockCreateLivenessSession,
  getLivenessResults: mockGetLivenessResults,
  compareFaces: mockCompareFaces,
}));

vi.mock("@/lib/services/registration/citizen-photo.service", () => ({
  fetchCitizenPhoto: mockFetchCitizenPhoto,
}));

import { POST as postAccount } from "@/app/api/registration/account/route";
import { POST as postAccountDraft } from "@/app/api/registration/account-draft/route";
import { POST as postCitizen } from "@/app/api/registration/citizen/route";
import { POST as postSessionReset } from "@/app/api/registration/session/reset/route";
import { POST as postLivenessComplete } from "@/app/api/registration/verification/liveness-complete/route";
import { POST as postLivenessResult } from "@/app/api/registration/verification/liveness-result/route";
import { POST as postLivenessSession } from "@/app/api/registration/verification/liveness-session/route";

const REGISTRATION_SESSION_ID = "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d";

function createValidAccountDraft(
  overrides: Partial<
    NonNullable<Awaited<ReturnType<typeof mockGetRegistrationAccountDraft>>>
  > = {},
) {
  return {
    sessionId: REGISTRATION_SESSION_ID,
    cedula: "00100063362",
    email: "user@example.com",
    password: "Password123!",
    issuedAt: Date.now(),
    expiresAt: Date.now() + 30_000,
    ...overrides,
  };
}

beforeEach(() => {
  mockIsPasswordStrongEnough.mockReturnValue(true);
  mockIsBreachedPassword.mockResolvedValue(false);
});

describe("registration route orchestration - account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNormalizeCedula.mockImplementation((value: string) => value);
    mockIsPasswordStrongEnough.mockReturnValue(true);
    mockIsBreachedPassword.mockResolvedValue(false);
    mockClearRegistrationSessionCookie.mockReturnValue({
      name: "registration_session",
      value: "",
      path: "/",
      maxAge: 0,
    });
    mockClearRegistrationAccountDraftCookie.mockReturnValue({
      name: "registration_account_draft",
      value: "",
      path: "/",
      maxAge: 0,
    });
    mockGetRegistrationAccountDraft.mockResolvedValue(null);
    mockGetServerCookies.mockResolvedValue("ory_cookie=value");
    mockMergeCookieHeaders.mockReturnValue("merged_ory_cookie=value");
  });

  it("rejects invalid JSON payloads", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "verified",
    });

    const request = new Request("http://localhost/api/registration/account", {
      method: "POST",
      body: "{invalid",
      headers: { "Content-Type": "application/json" },
    });

    const response = await postAccount(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "invalid_payload",
    });
  });

  it("requires a registration session before validating account payloads", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce(null);

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
        body: "{invalid",
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "registration_session_missing",
    });
  });

  it("requires an existing registration session", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce(null);

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "Password123!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "registration_session_missing",
    });
  });

  it("rejects account registration before verification is completed", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "identified",
    });

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "Password123!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "verification_required",
    });
  });

  it("returns field errors for invalid account payloads after session validation", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "verified",
    });

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
        body: JSON.stringify({
          email: "not-an-email",
          password: "",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockFindCitizenByCedula).not.toHaveBeenCalled();
    expect(mockRegisterOryAccount).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "invalid_payload",
      fieldErrors: {
        email: "account.validation.email_invalid",
        password: "account.validation.password_min",
      },
    });
  });

  it("rejects passwords that contain the verified cedula", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: REGISTRATION_SESSION_ID,
      cedula: "00100063362",
      status: "verified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce(
      createValidAccountDraft({
        password: "AA00100063362!!",
      }),
    );
    mockIsValidCedula.mockResolvedValueOnce(true);

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "AA00100063362!!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "password_cedula_similarity",
      fieldErrors: {
        password: "account.validation.password_cedula_similarity",
      },
    });
  });

  it("rejects passwords that contain the email local part before Ory registration", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: REGISTRATION_SESSION_ID,
      cedula: "00100063362",
      status: "verified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce(
      createValidAccountDraft({
        password: "UserStrong123!",
      }),
    );
    mockIsValidCedula.mockResolvedValueOnce(true);

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "UserStrong123!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockFindCitizenByCedula).not.toHaveBeenCalled();
    expect(mockRegisterOryAccount).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "password_email_similarity",
      fieldErrors: {
        password: "account.validation.password_email_similarity",
      },
    });
  });

  it("rejects weak passwords before Ory registration", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: REGISTRATION_SESSION_ID,
      cedula: "00100063362",
      status: "verified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce(
      createValidAccountDraft({
        password: "abcdefghij",
      }),
    );
    mockIsValidCedula.mockResolvedValueOnce(true);
    mockIsPasswordStrongEnough.mockReturnValueOnce(false);

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "abcdefghij",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockFindCitizenByCedula).not.toHaveBeenCalled();
    expect(mockRegisterOryAccount).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "password_weak",
      fieldErrors: {
        password: "account.validation.password_weak",
      },
    });
  });

  it("rejects compromised passwords before Ory registration", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: REGISTRATION_SESSION_ID,
      cedula: "00100063362",
      status: "verified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce(
      createValidAccountDraft(),
    );
    mockIsValidCedula.mockResolvedValueOnce(true);
    mockIsBreachedPassword.mockResolvedValueOnce(true);

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "Password123!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockFindCitizenByCedula).not.toHaveBeenCalled();
    expect(mockRegisterOryAccount).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "password_compromised",
      fieldErrors: {
        password: "account.validation.password_compromised",
      },
    });
  });

  it("returns citizen_not_found when the verified cedula cannot be hydrated", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: REGISTRATION_SESSION_ID,
      cedula: "00100063362",
      status: "verified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce(
      createValidAccountDraft(),
    );
    mockIsValidCedula.mockResolvedValueOnce(true);
    mockFindCitizenByCedula.mockResolvedValueOnce(null);

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "Password123!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "citizen_not_found",
    });
  });

  it("returns the email-sent destination and clears the registration session after Ory verification flow creation", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: REGISTRATION_SESSION_ID,
      cedula: "00100063362",
      status: "verified",
      returnUrl: "https://example.com/dashboard",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce(
      createValidAccountDraft(),
    );
    mockIsValidCedula.mockResolvedValueOnce(true);
    mockFindCitizenByCedula.mockResolvedValueOnce({
      names: "Juan",
      lastName: "Perez",
      birthDate: "1990-01-01",
      gender: "male",
    });
    mockRegisterOryAccount.mockResolvedValueOnce({
      payload: {
        continue_with: [
          {
            action: "show_verification_ui",
            flow: { id: "flow-123" },
          },
        ],
      },
      setCookies: ["ory_session=abc; Path=/; HttpOnly; SameSite=Lax"],
    });

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "Password123!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockRegisterOryAccount).toHaveBeenCalledWith({
      cookie: "ory_cookie=value",
      email: "user@example.com",
      password: "Password123!",
      cedula: "00100063362",
      firstName: "Juan",
      lastName: "Perez",
      birthDate: "1990-01-01",
      gender: "male",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      destination: "email-sent",
      redirectTo:
        "/register/email-sent?flow=flow-123&return_url=https%3A%2F%2Fexample.com%2Fdashboard",
    });
    expect(mockClearRegistrationSessionCookie).toHaveBeenCalled();
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalled();
  });

  it("rejects direct account credentials that replace an existing same-session draft", async () => {
    const sessionId = "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d";
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId,
      cedula: "00100063362",
      status: "verified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce({
      sessionId,
      cedula: "00100063362",
      email: "draft@example.com",
      password: "Password123!",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30_000,
    });

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
        body: JSON.stringify({
          email: "attacker@example.com",
          password: "Password123!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "account_draft_missing",
    });
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalledTimes(1);
    expect(mockIsValidCedula).not.toHaveBeenCalled();
    expect(mockFindCitizenByCedula).not.toHaveBeenCalled();
    expect(mockRegisterOryAccount).not.toHaveBeenCalled();
  });

  it("finalizes account registration without a body by using the encrypted draft cookie", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: REGISTRATION_SESSION_ID,
      cedula: "00100063362",
      status: "verified",
      returnUrl: "https://example.com/dashboard",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce(
      createValidAccountDraft(),
    );
    mockIsValidCedula.mockResolvedValueOnce(true);
    mockFindCitizenByCedula.mockResolvedValueOnce({
      names: "Juan",
      lastName: "Perez",
      birthDate: "1990-01-01",
      gender: "male",
    });
    mockRegisterOryAccount.mockResolvedValueOnce({
      payload: {
        continue_with: [
          {
            action: "show_verification_ui",
            flow: { id: "flow-123" },
          },
        ],
      },
      setCookies: [],
    });

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
      }),
    );

    expect(mockRegisterOryAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
        password: "Password123!",
        cedula: "00100063362",
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      destination: "email-sent",
      redirectTo:
        "/register/email-sent?flow=flow-123&return_url=https%3A%2F%2Fexample.com%2Fdashboard",
    });
    expect(mockClearRegistrationSessionCookie).toHaveBeenCalled();
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalled();
  });

  it("creates an email verification flow when Ory creates an unverified identity without continue_with", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: REGISTRATION_SESSION_ID,
      cedula: "00100063362",
      status: "verified",
      returnUrl: "https://example.com/dashboard",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce(
      createValidAccountDraft(),
    );
    mockIsValidCedula.mockResolvedValueOnce(true);
    mockFindCitizenByCedula.mockResolvedValueOnce({
      names: "Juan",
      lastName: "Perez",
      birthDate: "1990-01-01",
      gender: "male",
    });
    mockRegisterOryAccount.mockResolvedValueOnce({
      payload: {
        identity: {
          id: "identity-123",
          verifiable_addresses: [
            {
              value: "user@example.com",
              verified: false,
              via: "email",
            },
          ],
        },
      },
      setCookies: ["ory_session=abc; Path=/; HttpOnly; SameSite=Lax"],
    });
    mockCreateOryEmailVerificationCodeFlow.mockResolvedValueOnce({
      payload: {
        id: "verification-flow-456",
        state: "sent_email",
      },
      setCookies: ["ory_verification=def; Path=/; HttpOnly; SameSite=Lax"],
    });

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "Password123!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockMergeCookieHeaders).toHaveBeenCalledWith("ory_cookie=value", [
      "ory_session=abc; Path=/; HttpOnly; SameSite=Lax",
    ]);
    expect(mockCreateOryEmailVerificationCodeFlow).toHaveBeenCalledWith({
      cookie: "merged_ory_cookie=value",
      email: "user@example.com",
      returnTo: "https://example.com/dashboard",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      destination: "email-sent",
      redirectTo:
        "/register/email-sent?flow=verification-flow-456&return_url=https%3A%2F%2Fexample.com%2Fdashboard",
    });
    expect(response.cookies.get("ory_session")?.value).toBe("abc");
    expect(response.cookies.get("ory_verification")?.value).toBe("def");
    expect(mockClearRegistrationSessionCookie).toHaveBeenCalled();
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalled();
  });

  it("redirects to login only when Ory reports the account email as verified", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: REGISTRATION_SESSION_ID,
      cedula: "00100063362",
      status: "verified",
      returnUrl: "https://example.com/dashboard",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce(
      createValidAccountDraft(),
    );
    mockIsValidCedula.mockResolvedValueOnce(true);
    mockFindCitizenByCedula.mockResolvedValueOnce({
      names: "Juan",
      lastName: "Perez",
      birthDate: "1990-01-01",
      gender: "male",
    });
    mockRegisterOryAccount.mockResolvedValueOnce({
      payload: {
        identity: {
          id: "identity-123",
          verifiable_addresses: [
            {
              value: "user@example.com",
              verified: true,
              via: "email",
            },
          ],
        },
      },
      setCookies: ["ory_session=abc; Path=/; HttpOnly; SameSite=Lax"],
    });

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "Password123!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockCreateOryEmailVerificationCodeFlow).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      destination: "login",
      redirectTo: "https://example.com/dashboard",
    });
    expect(mockClearRegistrationSessionCookie).toHaveBeenCalled();
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalled();
  });

  it("requires an account draft when account registration is finalized without a body", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "verified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce(null);

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "account_draft_missing",
    });
    expect(mockGetRegistrationSession).toHaveBeenCalledTimes(1);
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalledTimes(1);
  });

  it("requires a registration session before finalizing from an account draft", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce(null);

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
      }),
    );

    expect(mockGetRegistrationAccountDraft).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "registration_session_missing",
    });
  });

  it("returns unexpected_error when the account draft cannot be read", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "verified",
    });
    mockGetRegistrationAccountDraft.mockRejectedValueOnce(
      new Error("cookie store unavailable"),
    );

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "unexpected_error",
    });
    expect(mockGetRegistrationSession).toHaveBeenCalledTimes(1);
    expect(mockRegisterOryAccount).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("rejects account drafts tied to a different cedula", async () => {
    mockGetRegistrationAccountDraft.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "40200612345",
      email: "user@example.com",
      password: "Password123!",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30_000,
    });
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "verified",
    });

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "account_draft_missing",
    });
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalledTimes(1);
    expect(mockIsValidCedula).not.toHaveBeenCalled();
    expect(mockFindCitizenByCedula).not.toHaveBeenCalled();
    expect(mockRegisterOryAccount).not.toHaveBeenCalled();
  });

  it("rejects account drafts tied to a different registration session", async () => {
    mockGetRegistrationAccountDraft.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      email: "user@example.com",
      password: "Password123!",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30_000,
    });
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "71e8e018-9b9f-4acf-af6e-3a7d781a771b",
      cedula: "00100063362",
      status: "verified",
    });

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "account_draft_missing",
    });
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalledTimes(1);
    expect(mockIsValidCedula).not.toHaveBeenCalled();
    expect(mockFindCitizenByCedula).not.toHaveBeenCalled();
    expect(mockRegisterOryAccount).not.toHaveBeenCalled();
  });

  it("returns mapped Ory field errors from the real route", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: REGISTRATION_SESSION_ID,
      cedula: "00100063362",
      status: "verified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce(
      createValidAccountDraft(),
    );
    mockIsValidCedula.mockResolvedValueOnce(true);
    mockFindCitizenByCedula.mockResolvedValueOnce({
      names: "Juan",
      lastName: "Perez",
      birthDate: "1990-01-01",
      gender: "male",
    });
    mockRegisterOryAccount.mockResolvedValueOnce({
      payload: {
        ui: {
          nodes: [],
        },
      },
      setCookies: [],
    });
    mockMapOryAccountErrors.mockReturnValueOnce({
      code: "identity_exists",
      fieldErrors: {
        email: "identities.messages.4000007",
      },
    });

    const response = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "Password123!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "identity_exists",
      fieldErrors: {
        email: "identities.messages.4000007",
      },
    });
  });
});

describe("registration route orchestration - account-draft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNormalizeCedula.mockImplementation((value: string) => value);
    mockIsPasswordStrongEnough.mockReturnValue(true);
    mockIsBreachedPassword.mockResolvedValue(false);
    mockCreateRegistrationAccountDraftCookie.mockReturnValue({
      name: "registration_account_draft",
      value: "encrypted-draft",
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    });
  });

  it("requires an active registration session before storing account credentials", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce(null);

    const response = await postAccountDraft(
      new Request("http://localhost/api/registration/account-draft", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "Password123!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "registration_session_missing",
    });
  });

  it("does not validate account credentials before the registration session exists", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce(null);

    const response = await postAccountDraft(
      new Request("http://localhost/api/registration/account-draft", {
        method: "POST",
        body: JSON.stringify({
          email: "not-an-email",
          password: "",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockCreateRegistrationAccountDraftCookie).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "registration_session_missing",
    });
  });

  it("rejects invalid account draft payloads after the registration session is present", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "identified",
    });

    const response = await postAccountDraft(
      new Request("http://localhost/api/registration/account-draft", {
        method: "POST",
        body: JSON.stringify({
          email: "not-an-email",
          password: "",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockCreateRegistrationAccountDraftCookie).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "invalid_payload",
      fieldErrors: {
        email: "account.validation.email_invalid",
        password: "account.validation.password_min",
      },
    });
  });

  it("rejects account drafts with weak passwords before storing credentials", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "identified",
    });
    mockIsPasswordStrongEnough.mockReturnValueOnce(false);

    const response = await postAccountDraft(
      new Request("http://localhost/api/registration/account-draft", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "abcdefghij",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockCreateRegistrationAccountDraftCookie).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "password_weak",
      fieldErrors: {
        password: "account.validation.password_weak",
      },
    });
  });

  it("rejects account drafts with compromised passwords before storing credentials", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "identified",
    });
    mockIsBreachedPassword.mockResolvedValueOnce(true);

    const response = await postAccountDraft(
      new Request("http://localhost/api/registration/account-draft", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "Password123!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockCreateRegistrationAccountDraftCookie).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "password_compromised",
      fieldErrors: {
        password: "account.validation.password_compromised",
      },
    });
  });

  it("rejects account drafts with passwords that contain the email local part", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "identified",
    });

    const response = await postAccountDraft(
      new Request("http://localhost/api/registration/account-draft", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "UserStrong123!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockCreateRegistrationAccountDraftCookie).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "password_email_similarity",
      fieldErrors: {
        password: "account.validation.password_email_similarity",
      },
    });
  });

  it("stores the encrypted account draft and returns the current session status", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "identified",
      expiresAt: 1_782_000_000_000,
    });

    const response = await postAccountDraft(
      new Request("http://localhost/api/registration/account-draft", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "Password123!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockCreateRegistrationAccountDraftCookie).toHaveBeenCalledWith({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      sessionExpiresAt: 1_782_000_000_000,
      cedula: "00100063362",
      email: "user@example.com",
      password: "Password123!",
    });
    expect(response.cookies.get("registration_account_draft")?.value).toBe(
      "encrypted-draft",
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      sessionStatus: "identified",
    });
  });
});

describe("registration route orchestration - citizen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNormalizeCedula.mockImplementation((value: string) =>
      value.replace(/\D/g, ""),
    );
    mockGetRequestOrigin.mockReturnValue("http://localhost");
    mockGetSafeReturnUrl.mockImplementation((url?: string) => url);
    mockParseAllowedReturnOrigins.mockReturnValue([]);
    mockGetAnalyticsContext.mockResolvedValue(null);
    mockCreateRegistrationSessionCookie.mockReturnValue({
      name: "registration_session",
      value: "signed-session",
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    });
  });

  it("rejects malformed JSON payloads before identity lookup", async () => {
    const response = await postCitizen(
      new Request("http://localhost/api/registration/citizen", {
        method: "POST",
        body: "{invalid",
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "invalid_payload",
    });
    expect(mockIsValidCedula).not.toHaveBeenCalled();
    expect(mockCheckCitizenIdentity).not.toHaveBeenCalled();
    expect(mockFindCitizenSummaryByCedula).not.toHaveBeenCalled();
  });

  it("rejects invalid payload shapes before identity lookup", async () => {
    const response = await postCitizen(
      new Request("http://localhost/api/registration/citizen", {
        method: "POST",
        body: JSON.stringify({
          cedula: 40200612345,
          returnUrl: { href: "https://example.com/dashboard" },
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "invalid_payload",
      fieldErrors: {
        cedula: "identification.id_invalid",
      },
    });
    expect(mockIsValidCedula).not.toHaveBeenCalled();
    expect(mockCheckCitizenIdentity).not.toHaveBeenCalled();
    expect(mockFindCitizenSummaryByCedula).not.toHaveBeenCalled();
  });

  it("rejects invalid cedulas before identity lookup", async () => {
    mockIsValidCedula.mockResolvedValueOnce(false);

    const response = await postCitizen(
      new Request("http://localhost/api/registration/citizen", {
        method: "POST",
        body: JSON.stringify({ cedula: "123" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "invalid_cedula",
      fieldErrors: {
        cedula: "identification.id_invalid",
      },
    });
    expect(mockCheckCitizenIdentity).not.toHaveBeenCalled();
  });

  it("returns identity_exists when Ory already has an identity for the cedula", async () => {
    mockIsValidCedula.mockResolvedValueOnce(true);
    mockCheckCitizenIdentity.mockResolvedValueOnce({ exists: true });

    const response = await postCitizen(
      new Request("http://localhost/api/registration/citizen", {
        method: "POST",
        body: JSON.stringify({ cedula: "40200612345" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "identity_exists",
    });
  });

  it("returns citizen_not_found when the registry has no matching citizen", async () => {
    mockIsValidCedula.mockResolvedValueOnce(true);
    mockCheckCitizenIdentity.mockResolvedValueOnce({ exists: false });
    mockFindCitizenSummaryByCedula.mockResolvedValueOnce(null);

    const response = await postCitizen(
      new Request("http://localhost/api/registration/citizen", {
        method: "POST",
        body: JSON.stringify({ cedula: "40200612345" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "citizen_not_found",
    });
  });

  it("creates the identified registration session and drops invalid return urls", async () => {
    mockIsValidCedula.mockResolvedValueOnce(true);
    mockCheckCitizenIdentity.mockResolvedValueOnce({ exists: false });
    mockGetSafeReturnUrl.mockReturnValueOnce(undefined);
    mockFindCitizenSummaryByCedula.mockResolvedValueOnce({
      id: "402-0061234-5",
      firstName: "Juan",
    });

    const response = await postCitizen(
      new Request("http://localhost/api/registration/citizen", {
        method: "POST",
        body: JSON.stringify({
          cedula: "40200612345",
          returnUrl: "javascript:alert(1)",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockCreateRegistrationSessionCookie).toHaveBeenCalledWith(
      "40200612345",
      "identified",
      undefined,
    );
    expect(mockGetSafeReturnUrl).toHaveBeenCalledWith("javascript:alert(1)", {
      currentOrigin: "http://localhost",
      allowedOrigins: [],
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      citizen: {
        id: "402-0061234-5",
        firstName: "Juan",
      },
    });
  });

  it("keeps the signed analytics return url for linked client launches", async () => {
    mockIsValidCedula.mockResolvedValueOnce(true);
    mockCheckCitizenIdentity.mockResolvedValueOnce({ exists: false });
    mockGetSafeReturnUrl.mockReturnValueOnce(undefined);
    mockGetAnalyticsContext.mockResolvedValueOnce({
      journeyId: "journey-123",
      clientId: "4c2d8cc9-1740-47a5-8a32-e94c7049edff",
      linkageStatus: "linked",
      entryPath: "/register",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      returnUrl: "http://localhost:5173/callback",
    });
    mockFindCitizenSummaryByCedula.mockResolvedValueOnce({
      id: "402-0061234-5",
      firstName: "Juan",
    });

    const response = await postCitizen(
      new Request("http://localhost/api/registration/citizen", {
        method: "POST",
        body: JSON.stringify({
          cedula: "40200612345",
          returnUrl: "http://localhost:5173/callback",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockCreateRegistrationSessionCookie).toHaveBeenCalledWith(
      "40200612345",
      "identified",
      "http://localhost:5173/callback",
    );
    expect(mockGetSafeReturnUrl).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });
});

describe("registration route orchestration - liveness-session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClearRegistrationAccountDraftCookie.mockReturnValue({
      name: "registration_account_draft",
      value: "",
      path: "/",
      maxAge: 0,
    });
    mockCreateRegistrationLivenessChallengeCookie.mockReturnValue({
      name: "registration_liveness_challenge",
      value: "signed-liveness-challenge",
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    });
  });

  it("requires an existing registration session", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce(null);

    const response = await postLivenessSession();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "registration_session_missing",
    });
  });

  it("maps registration session read failures to unexpected_error", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockGetRegistrationSession.mockRejectedValueOnce(
      new Error("cookie store unavailable"),
    );

    const response = await postLivenessSession();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "unexpected_error",
    });
    expect(mockCreateLivenessSession).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("requires a same-session account draft before creating a liveness session", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "identified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce(null);

    const response = await postLivenessSession();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "account_draft_missing",
    });
    expect(response.cookies.get("registration_account_draft")?.value).toBe("");
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalledTimes(1);
    expect(mockCreateLivenessSession).not.toHaveBeenCalled();
    expect(
      mockCreateRegistrationLivenessChallengeCookie,
    ).not.toHaveBeenCalled();
  });

  it("rejects account drafts from a different registration session before liveness starts", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "71e8e018-9b9f-4acf-af6e-3a7d781a771b",
      cedula: "00100063362",
      status: "identified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      email: "user@example.com",
      password: "Password123!",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30_000,
    });

    const response = await postLivenessSession();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "account_draft_missing",
    });
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalledTimes(1);
    expect(mockCreateLivenessSession).not.toHaveBeenCalled();
    expect(
      mockCreateRegistrationLivenessChallengeCookie,
    ).not.toHaveBeenCalled();
  });

  it("does not create a new liveness session after registration is verified", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "verified",
    });

    const response = await postLivenessSession();

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "verification_already_completed",
    });
    expect(mockCreateLivenessSession).not.toHaveBeenCalled();
  });

  it("returns the created liveness session id", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "identified",
      expiresAt: 1_782_000_000_000,
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      email: "user@example.com",
      password: "Password123!",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30_000,
    });
    mockCreateLivenessSession.mockResolvedValueOnce("session-123");

    const response = await postLivenessSession();

    expect(mockCreateLivenessSession).toHaveBeenCalledTimes(1);
    expect(mockCreateRegistrationLivenessChallengeCookie).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
        cedula: "00100063362",
      }),
      "session-123",
    );
    expect(response.cookies.get("registration_liveness_challenge")?.value).toBe(
      "signed-liveness-challenge",
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      sessionId: "session-123",
    });
  });

  it("maps rekognition failures to a 502 response", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "identified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      email: "user@example.com",
      password: "Password123!",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30_000,
    });
    mockCreateLivenessSession.mockRejectedValueOnce(new Error("boom"));

    const response = await postLivenessSession();

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "rekognition_error",
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

describe("registration route orchestration - session reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClearRegistrationSessionCookie.mockReturnValue({
      name: "registration_session",
      value: "",
      path: "/",
      maxAge: 0,
    });
    mockClearRegistrationAccountDraftCookie.mockReturnValue({
      name: "registration_account_draft",
      value: "",
      path: "/",
      maxAge: 0,
    });
    mockClearRegistrationLivenessChallengeCookie.mockReturnValue({
      name: "registration_liveness_challenge",
      value: "",
      path: "/",
      maxAge: 0,
    });
  });

  it("returns success and clears temporary registration cookies", async () => {
    mockGetServerCookies.mockResolvedValueOnce(
      "ory_session_focused=value; csrf_token_123=value; analytics_context=value",
    );

    const response = await postSessionReset();

    expect(mockClearRegistrationSessionCookie).toHaveBeenCalledTimes(1);
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalledTimes(1);
    expect(mockClearRegistrationLivenessChallengeCookie).toHaveBeenCalledTimes(
      1,
    );
    const setCookieHeaders = response.headers.getSetCookie?.() ?? [];
    expect(setCookieHeaders).toEqual(
      expect.arrayContaining([
        expect.stringContaining("registration_session="),
        expect.stringContaining("registration_account_draft="),
        expect.stringContaining("registration_liveness_challenge="),
        expect.stringContaining("ory_session_focused="),
        expect.stringContaining("csrf_token_123="),
        expect.stringContaining("analytics_context="),
        expect.stringContaining("analytics_context_launch="),
      ]),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("returns unexpected_error when clearing the registration session throws", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockClearRegistrationSessionCookie.mockImplementationOnce(() => {
      throw new Error("cookie store unavailable");
    });

    const response = await postSessionReset();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "unexpected_error",
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

describe("registration route orchestration - liveness-complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateRegistrationSessionCookieFromSession.mockReturnValue({
      name: "registration_session",
      value: "signed-verified-session",
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    });
    mockClearRegistrationSessionCookie.mockReturnValue({
      name: "registration_session",
      value: "",
      path: "/",
      maxAge: 0,
    });
    mockClearRegistrationAccountDraftCookie.mockReturnValue({
      name: "registration_account_draft",
      value: "",
      path: "/",
      maxAge: 0,
    });
    mockClearRegistrationLivenessChallengeCookie.mockReturnValue({
      name: "registration_liveness_challenge",
      value: "",
      path: "/",
      maxAge: 0,
    });
    mockGetRegistrationLivenessChallenge.mockResolvedValue({
      registrationSessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      livenessSessionId: "session-123",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    mockGetRegistrationAccountDraft.mockResolvedValue(
      createValidAccountDraft(),
    );
    mockGetServerCookies.mockResolvedValue("ory_cookie=value");
  });

  it("rejects malformed payloads before liveness verification", async () => {
    const response = await postLivenessComplete(
      new Request(
        "http://localhost/api/registration/verification/liveness-complete",
        {
          method: "POST",
          body: "not-json",
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(mockGetRegistrationSession).not.toHaveBeenCalled();
    expect(mockGetLivenessResults).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      stage: "verification",
      code: "invalid_payload",
    });
  });

  it("rejects requests without a liveness session id before liveness verification", async () => {
    const response = await postLivenessComplete(
      new Request(
        "http://localhost/api/registration/verification/liveness-complete",
        {
          method: "POST",
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(mockGetRegistrationSession).not.toHaveBeenCalled();
    expect(mockGetLivenessResults).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      stage: "verification",
      code: "invalid_payload",
    });
  });

  it("rejects completed verification sessions before liveness verification", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "verified",
    });

    const response = await postLivenessComplete(
      new Request(
        "http://localhost/api/registration/verification/liveness-complete",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: "session-123" }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      success: false,
      stage: "verification",
      code: "verification_already_completed",
    });
    expect(mockGetLivenessResults).not.toHaveBeenCalled();
    expect(mockGetRegistrationAccountDraft).not.toHaveBeenCalled();
    expect(mockRegisterOryAccount).not.toHaveBeenCalled();
  });

  it("completes liveness, creates the account from the draft, and clears temporary cookies", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "identified",
      returnUrl: "https://example.com/dashboard",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      email: "user@example.com",
      password: "Password123!",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30_000,
    });
    mockGetLivenessResults.mockResolvedValueOnce({
      confidence: 99,
      referenceImageBytes: new Uint8Array([1, 2, 3]),
    });
    mockFetchCitizenPhoto.mockResolvedValueOnce(new Uint8Array([4, 5, 6]));
    mockCompareFaces.mockResolvedValueOnce({
      isMatch: true,
      similarity: 96,
    });
    mockIsValidCedula.mockResolvedValueOnce(true);
    mockFindCitizenByCedula.mockResolvedValueOnce({
      names: "Juan",
      lastName: "Perez",
      birthDate: "1990-01-01",
      gender: "male",
    });
    mockRegisterOryAccount.mockResolvedValueOnce({
      payload: {
        continue_with: [
          {
            action: "show_verification_ui",
            flow: { id: "flow-123" },
          },
        ],
      },
      setCookies: [],
    });

    const response = await postLivenessComplete(
      new Request(
        "http://localhost/api/registration/verification/liveness-complete",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: "session-123" }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(mockRegisterOryAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
        password: "Password123!",
        cedula: "00100063362",
      }),
    );
    expect(mockClearRegistrationSessionCookie).toHaveBeenCalledTimes(1);
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      confidence: 99,
      similarity: 96,
      destination: "email-sent",
      redirectTo:
        "/register/email-sent?flow=flow-123&return_url=https%3A%2F%2Fexample.com%2Fdashboard",
    });
  });

  it("keeps the verified registration session when Ory rejects the account draft", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "identified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      email: "user@example.com",
      password: "Password123!",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30_000,
    });
    mockGetLivenessResults.mockResolvedValueOnce({
      confidence: 99,
      referenceImageBytes: new Uint8Array([1, 2, 3]),
    });
    mockFetchCitizenPhoto.mockResolvedValueOnce(new Uint8Array([4, 5, 6]));
    mockCompareFaces.mockResolvedValueOnce({
      isMatch: true,
      similarity: 96,
    });
    mockIsValidCedula.mockResolvedValueOnce(true);
    mockFindCitizenByCedula.mockResolvedValueOnce({
      names: "Juan",
      lastName: "Perez",
      birthDate: "1990-01-01",
      gender: "male",
    });
    mockRegisterOryAccount.mockResolvedValueOnce({
      payload: {
        ui: {
          nodes: [],
        },
      },
      setCookies: [],
    });
    mockMapOryAccountErrors.mockReturnValueOnce({
      code: "identity_exists",
      fieldErrors: {
        email: "identities.messages.4000007",
      },
    });

    const response = await postLivenessComplete(
      new Request(
        "http://localhost/api/registration/verification/liveness-complete",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: "session-123" }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(mockCreateRegistrationSessionCookieFromSession).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
        cedula: "00100063362",
        status: "identified",
      }),
      "verified",
    );
    expect(mockClearRegistrationSessionCookie).not.toHaveBeenCalled();
    expect(mockClearRegistrationAccountDraftCookie).not.toHaveBeenCalled();
    expect(response.cookies.get("registration_session")?.value).toBe(
      "signed-verified-session",
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      stage: "account",
      code: "identity_exists",
      fieldErrors: {
        email: "identities.messages.4000007",
      },
    });
  });

  it("rejects liveness completion before Rekognition when the account draft is missing", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "identified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce(null);
    const response = await postLivenessComplete(
      new Request(
        "http://localhost/api/registration/verification/liveness-complete",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: "session-123" }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(mockGetLivenessResults).not.toHaveBeenCalled();
    expect(mockFetchCitizenPhoto).not.toHaveBeenCalled();
    expect(mockCompareFaces).not.toHaveBeenCalled();
    expect(
      mockCreateRegistrationSessionCookieFromSession,
    ).not.toHaveBeenCalled();
    expect(mockRegisterOryAccount).not.toHaveBeenCalled();
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalledTimes(1);
    expect(response.cookies.get("registration_session")).toBeUndefined();
    expect(response.cookies.get("registration_account_draft")?.value).toBe("");
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      stage: "account",
      code: "account_draft_missing",
    });
  });

  it("returns unexpected_error before Rekognition when account draft reading fails", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "identified",
      returnUrl: "https://example.com/dashboard",
    });
    mockGetRegistrationAccountDraft.mockRejectedValueOnce(
      new Error("cookie store unavailable"),
    );
    const response = await postLivenessComplete(
      new Request(
        "http://localhost/api/registration/verification/liveness-complete",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: "session-123" }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(mockGetLivenessResults).not.toHaveBeenCalled();
    expect(mockFetchCitizenPhoto).not.toHaveBeenCalled();
    expect(mockCompareFaces).not.toHaveBeenCalled();
    expect(
      mockCreateRegistrationSessionCookieFromSession,
    ).not.toHaveBeenCalled();
    expect(mockRegisterOryAccount).not.toHaveBeenCalled();
    expect(mockClearRegistrationSessionCookie).not.toHaveBeenCalled();
    expect(response.cookies.get("registration_session")).toBeUndefined();
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      stage: "verification",
      code: "unexpected_error",
    });
  });

  it("rejects account drafts tied to a different cedula after liveness", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "identified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "40200612345",
      email: "user@example.com",
      password: "Password123!",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30_000,
    });
    const response = await postLivenessComplete(
      new Request(
        "http://localhost/api/registration/verification/liveness-complete",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: "session-123" }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(mockGetLivenessResults).not.toHaveBeenCalled();
    expect(mockFetchCitizenPhoto).not.toHaveBeenCalled();
    expect(mockCompareFaces).not.toHaveBeenCalled();
    expect(
      mockCreateRegistrationSessionCookieFromSession,
    ).not.toHaveBeenCalled();
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalledTimes(1);
    expect(mockIsValidCedula).not.toHaveBeenCalled();
    expect(mockFindCitizenByCedula).not.toHaveBeenCalled();
    expect(mockRegisterOryAccount).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      stage: "account",
      code: "account_draft_missing",
    });
  });

  it("rejects account drafts tied to a different registration session after liveness", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "identified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce({
      sessionId: "71e8e018-9b9f-4acf-af6e-3a7d781a771b",
      cedula: "00100063362",
      email: "user@example.com",
      password: "Password123!",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30_000,
    });
    const response = await postLivenessComplete(
      new Request(
        "http://localhost/api/registration/verification/liveness-complete",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: "session-123" }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(mockGetLivenessResults).not.toHaveBeenCalled();
    expect(mockFetchCitizenPhoto).not.toHaveBeenCalled();
    expect(mockCompareFaces).not.toHaveBeenCalled();
    expect(
      mockCreateRegistrationSessionCookieFromSession,
    ).not.toHaveBeenCalled();
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalledTimes(1);
    expect(mockIsValidCedula).not.toHaveBeenCalled();
    expect(mockFindCitizenByCedula).not.toHaveBeenCalled();
    expect(mockRegisterOryAccount).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      stage: "account",
      code: "account_draft_missing",
    });
  });
});

describe("registration route orchestration - liveness-result", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateRegistrationSessionCookieFromSession.mockReturnValue({
      name: "registration_session",
      value: "signed-session",
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    });
    mockClearRegistrationLivenessChallengeCookie.mockReturnValue({
      name: "registration_liveness_challenge",
      value: "",
      path: "/",
      maxAge: 0,
    });
    mockClearRegistrationAccountDraftCookie.mockReturnValue({
      name: "registration_account_draft",
      value: "",
      path: "/",
      maxAge: 0,
    });
    mockGetRegistrationLivenessChallenge.mockResolvedValue({
      registrationSessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      livenessSessionId: "session-123",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    mockGetRegistrationAccountDraft.mockResolvedValue(
      createValidAccountDraft(),
    );
  });

  it("rejects malformed payloads before liveness verification", async () => {
    const response = await postLivenessResult(
      new Request(
        "http://localhost/api/registration/verification/liveness-result",
        {
          method: "POST",
          body: "not-json",
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(mockGetRegistrationSession).not.toHaveBeenCalled();
    expect(mockGetLivenessResults).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "invalid_payload",
    });
  });

  it("requires an existing registration session", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce(null);

    const response = await postLivenessResult(
      new Request(
        "http://localhost/api/registration/verification/liveness-result",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: "session-123" }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "registration_session_missing",
    });
  });

  it("rejects requests without a liveness session id before liveness verification", async () => {
    const response = await postLivenessResult(
      new Request(
        "http://localhost/api/registration/verification/liveness-result",
        {
          method: "POST",
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(mockGetRegistrationSession).not.toHaveBeenCalled();
    expect(mockGetLivenessResults).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "invalid_payload",
    });
  });

  it("rejects completed verification sessions before reading liveness results", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "verified",
    });

    const response = await postLivenessResult(
      new Request(
        "http://localhost/api/registration/verification/liveness-result",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: "session-123" }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "verification_already_completed",
    });
    expect(mockGetLivenessResults).not.toHaveBeenCalled();
    expect(
      mockCreateRegistrationSessionCookieFromSession,
    ).not.toHaveBeenCalled();
  });

  it("rejects liveness results tied to a different registration session", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "identified",
    });
    mockGetRegistrationLivenessChallenge.mockResolvedValueOnce({
      registrationSessionId: "71e8e018-9b9f-4acf-af6e-3a7d781a771b",
      livenessSessionId: "session-123",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const response = await postLivenessResult(
      new Request(
        "http://localhost/api/registration/verification/liveness-result",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: "session-123" }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "invalid_session_id",
    });
    expect(mockGetLivenessResults).not.toHaveBeenCalled();
    expect(
      mockCreateRegistrationSessionCookieFromSession,
    ).not.toHaveBeenCalled();
  });

  it("rejects liveness results before Rekognition when the account draft is missing", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "identified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce(null);

    const response = await postLivenessResult(
      new Request(
        "http://localhost/api/registration/verification/liveness-result",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: "session-123" }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "account_draft_missing",
    });
    expect(response.cookies.get("registration_account_draft")?.value).toBe("");
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalledTimes(1);
    expect(mockGetLivenessResults).not.toHaveBeenCalled();
    expect(
      mockCreateRegistrationSessionCookieFromSession,
    ).not.toHaveBeenCalled();
  });

  it("rejects liveness results below the configured threshold", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "identified",
    });
    mockGetLivenessResults.mockResolvedValueOnce({
      confidence: 50,
      referenceImageBytes: new Uint8Array([1, 2, 3]),
    });

    const response = await postLivenessResult(
      new Request(
        "http://localhost/api/registration/verification/liveness-result",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: "session-123" }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "liveness_check_failed",
    });
  });

  it("returns face_mismatch when the compared faces do not match", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "identified",
      returnUrl: "https://example.com/dashboard",
    });
    mockGetLivenessResults.mockResolvedValueOnce({
      confidence: 99,
      referenceImageBytes: new Uint8Array([1, 2, 3]),
    });
    mockFetchCitizenPhoto.mockResolvedValueOnce(new Uint8Array([4, 5, 6]));
    mockCompareFaces.mockResolvedValueOnce({
      isMatch: false,
      similarity: 45,
    });

    const response = await postLivenessResult(
      new Request(
        "http://localhost/api/registration/verification/liveness-result",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: "session-123" }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "face_mismatch",
    });
  });

  it("marks the registration session as verified on successful liveness verification", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "identified",
      returnUrl: "https://example.com/dashboard",
    });
    mockGetLivenessResults.mockResolvedValueOnce({
      confidence: 99,
      referenceImageBytes: new Uint8Array([1, 2, 3]),
    });
    mockFetchCitizenPhoto.mockResolvedValueOnce(new Uint8Array([4, 5, 6]));
    mockCompareFaces.mockResolvedValueOnce({
      isMatch: true,
      similarity: 96,
    });

    const response = await postLivenessResult(
      new Request(
        "http://localhost/api/registration/verification/liveness-result",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: "session-123" }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    expect(mockCreateRegistrationSessionCookieFromSession).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
        cedula: "00100063362",
        status: "identified",
        returnUrl: "https://example.com/dashboard",
      }),
      "verified",
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      confidence: 99,
      similarity: 96,
    });
  });
});
