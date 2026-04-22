import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetRegistrationSession,
  mockClearRegistrationSessionCookie,
  mockCreateRegistrationSessionCookie,
  mockFindCitizenSummaryByCedula,
  mockCheckCitizenIdentity,
  mockFindCitizenByCedula,
  mockRegisterOryAccount,
  mockMapOryAccountErrors,
  mockGetServerCookies,
  mockIsValidCedula,
  mockNormalizeCedula,
  mockIsValidReturnUrl,
  mockCreateLivenessSession,
  mockGetLivenessResults,
  mockCompareFaces,
  mockFetchCitizenPhoto,
} = vi.hoisted(() => ({
  mockGetRegistrationSession: vi.fn(),
  mockClearRegistrationSessionCookie: vi.fn(),
  mockCreateRegistrationSessionCookie: vi.fn(),
  mockFindCitizenSummaryByCedula: vi.fn(),
  mockCheckCitizenIdentity: vi.fn(),
  mockFindCitizenByCedula: vi.fn(),
  mockRegisterOryAccount: vi.fn(),
  mockMapOryAccountErrors: vi.fn(),
  mockGetServerCookies: vi.fn(),
  mockIsValidCedula: vi.fn(),
  mockNormalizeCedula: vi.fn((value: string) => value),
  mockIsValidReturnUrl: vi.fn(),
  mockCreateLivenessSession: vi.fn(),
  mockGetLivenessResults: vi.fn(),
  mockCompareFaces: vi.fn(),
  mockFetchCitizenPhoto: vi.fn(),
}));

vi.mock("@/lib/services/registration/registration-session.service", () => ({
  getRegistrationSession: mockGetRegistrationSession,
  clearRegistrationSessionCookie: mockClearRegistrationSessionCookie,
  createRegistrationSessionCookie: mockCreateRegistrationSessionCookie,
}));

vi.mock("@/lib/services/registration/citizen-registry.service", () => ({
  findCitizenByCedula: mockFindCitizenByCedula,
  findCitizenSummaryByCedula: mockFindCitizenSummaryByCedula,
}));

vi.mock("@/lib/services/registration/ory-identity.service", () => ({
  checkCitizenIdentity: mockCheckCitizenIdentity,
}));

vi.mock("@/lib/services/registration/ory-registration.service", () => ({
  registerOryAccount: mockRegisterOryAccount,
}));

vi.mock("@/lib/services/registration/ory-account-error-mapper", () => ({
  mapOryAccountErrors: mockMapOryAccountErrors,
}));

vi.mock("@/lib/ory/cookies", () => ({
  getServerCookies: mockGetServerCookies,
}));

vi.mock("@/lib/utils/cedula", () => ({
  isValidCedula: mockIsValidCedula,
  normalizeCedula: mockNormalizeCedula,
}));

vi.mock("@/lib/utils/return-url", () => ({
  isValidReturnUrl: mockIsValidReturnUrl,
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
import { POST as postCitizen } from "@/app/api/registration/citizen/route";
import { POST as postSessionReset } from "@/app/api/registration/session/reset/route";
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
    mockGetServerCookies.mockResolvedValue("ory_cookie=value");
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

describe("registration route orchestration - citizen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNormalizeCedula.mockImplementation((value: string) =>
      value.replace(/\D/g, ""),
    );
    mockIsValidReturnUrl.mockReturnValue(true);
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
    mockIsValidReturnUrl.mockReturnValueOnce(false);
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
  });

  it("returns success and clears the registration session cookie", async () => {
    const response = await postSessionReset();

    expect(mockClearRegistrationSessionCookie).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
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
