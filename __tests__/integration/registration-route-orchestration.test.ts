import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetRegistrationSession,
  mockClearRegistrationSessionCookie,
  mockCreateRegistrationSessionCookie,
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
  mockGetRequestOrigin,
  mockGetSafeReturnUrl,
  mockParseAllowedReturnOrigins,
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
  mockGetRequestOrigin: vi.fn(),
  mockGetSafeReturnUrl: vi.fn(),
  mockParseAllowedReturnOrigins: vi.fn(),
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
}));

vi.mock(
  "@/lib/services/registration/registration-account-draft.service",
  () => ({
    getRegistrationAccountDraft: mockGetRegistrationAccountDraft,
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

vi.mock("@/lib/utils/return-url", () => ({
  getRequestOrigin: mockGetRequestOrigin,
  getSafeReturnUrl: mockGetSafeReturnUrl,
  parseAllowedReturnOrigins: mockParseAllowedReturnOrigins,
}));

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

describe("registration route orchestration - account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNormalizeCedula.mockImplementation((value: string) => value);
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

  it("rejects passwords that contain the verified cedula", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "verified",
    });
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
    });
  });

  it("returns citizen_not_found when the verified cedula cannot be hydrated", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "verified",
    });
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
      cedula: "00100063362",
      status: "verified",
      returnUrl: "https://example.com/dashboard",
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

  it("finalizes account registration without a body by using the encrypted draft cookie", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "verified",
      returnUrl: "https://example.com/dashboard",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce({
      cedula: "00100063362",
      email: "user@example.com",
      password: "Password123!",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30_000,
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
      cedula: "00100063362",
      status: "verified",
      returnUrl: "https://example.com/dashboard",
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
      cedula: "00100063362",
      status: "verified",
      returnUrl: "https://example.com/dashboard",
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
    expect(mockGetRegistrationSession).not.toHaveBeenCalled();
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalledTimes(1);
  });

  it("returns mapped Ory field errors from the real route", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "verified",
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

  it("stores the encrypted account draft and returns the current session status", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "identified",
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
    mockCreateRegistrationSessionCookie.mockReturnValue({
      name: "registration_session",
      value: "signed-session",
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    });
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
});

describe("registration route orchestration - liveness-session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("returns the created liveness session id", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "identified",
    });
    mockCreateLivenessSession.mockResolvedValueOnce("session-123");

    const response = await postLivenessSession();

    expect(mockCreateLivenessSession).toHaveBeenCalledTimes(1);
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
      cedula: "00100063362",
      status: "identified",
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
  });

  it("returns success and clears registration session and account draft cookies", async () => {
    const response = await postSessionReset();

    expect(mockClearRegistrationSessionCookie).toHaveBeenCalledTimes(1);
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalledTimes(1);
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
    mockCreateRegistrationSessionCookie.mockReturnValue({
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
    mockGetServerCookies.mockResolvedValue("ory_cookie=value");
  });

  it("completes liveness, creates the account from the draft, and clears temporary cookies", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "identified",
      returnUrl: "https://example.com/dashboard",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce({
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
      cedula: "00100063362",
      status: "identified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce({
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

    expect(mockCreateRegistrationSessionCookie).toHaveBeenCalledWith(
      "00100063362",
      "verified",
      undefined,
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

  it("keeps the verified registration session when the account draft is missing after liveness", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "identified",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce(null);
    mockGetLivenessResults.mockResolvedValueOnce({
      confidence: 99,
      referenceImageBytes: new Uint8Array([1, 2, 3]),
    });
    mockFetchCitizenPhoto.mockResolvedValueOnce(new Uint8Array([4, 5, 6]));
    mockCompareFaces.mockResolvedValueOnce({
      isMatch: true,
      similarity: 96,
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

    expect(mockCreateRegistrationSessionCookie).toHaveBeenCalledWith(
      "00100063362",
      "verified",
      undefined,
    );
    expect(mockRegisterOryAccount).not.toHaveBeenCalled();
    expect(mockClearRegistrationAccountDraftCookie).toHaveBeenCalledTimes(1);
    expect(response.cookies.get("registration_session")?.value).toBe(
      "signed-verified-session",
    );
    expect(response.cookies.get("registration_account_draft")?.value).toBe("");
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
    mockCreateRegistrationSessionCookie.mockReturnValue({
      name: "registration_session",
      value: "signed-session",
      path: "/",
      httpOnly: true,
      sameSite: "strict",
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

  it("rejects requests without a liveness session id", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "identified",
    });

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

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "invalid_session_id",
    });
  });

  it("rejects liveness results below the configured threshold", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
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

    expect(mockCreateRegistrationSessionCookie).toHaveBeenCalledWith(
      "00100063362",
      "verified",
      "https://example.com/dashboard",
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      confidence: 99,
      similarity: 96,
    });
  });
});
