import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requestCookies,
  getRequestCookieHeader,
  setRequestCookieHeader,
  mockCookies,
  mockHeaders,
  mockListIdentities,
  mockCreateBrowserRegistrationFlow,
  mockUpdateRegistrationFlow,
  mockCreateBrowserVerificationFlow,
  mockUpdateVerificationFlow,
  mockRekognitionSend,
  mockIsPasswordStrongEnough,
  mockIsBreachedPassword,
} = vi.hoisted(() => {
  const cookies = new Map<string, string>();
  let cookieHeader = "";

  return {
    requestCookies: cookies,
    getRequestCookieHeader: () => cookieHeader,
    setRequestCookieHeader: (value: string) => {
      cookieHeader = value;
    },
    mockCookies: vi.fn(),
    mockHeaders: vi.fn(),
    mockListIdentities: vi.fn(),
    mockCreateBrowserRegistrationFlow: vi.fn(),
    mockUpdateRegistrationFlow: vi.fn(),
    mockCreateBrowserVerificationFlow: vi.fn(),
    mockUpdateVerificationFlow: vi.fn(),
    mockRekognitionSend: vi.fn(),
    mockIsPasswordStrongEnough: vi.fn(),
    mockIsBreachedPassword: vi.fn(),
  };
});

vi.mock("next/headers", () => ({
  cookies: mockCookies,
  headers: mockHeaders,
}));

vi.mock("server-only", () => ({}));

vi.mock("@ory/client", () => ({
  Configuration: class Configuration {},
  IdentityApi: class IdentityApi {
    listIdentities(...args: unknown[]) {
      return mockListIdentities(...args);
    }
  },
  FrontendApi: class FrontendApi {
    createBrowserRegistrationFlow(...args: unknown[]) {
      return mockCreateBrowserRegistrationFlow(...args);
    }

    updateRegistrationFlow(...args: unknown[]) {
      return mockUpdateRegistrationFlow(...args);
    }

    createBrowserVerificationFlow(...args: unknown[]) {
      return mockCreateBrowserVerificationFlow(...args);
    }

    updateVerificationFlow(...args: unknown[]) {
      return mockUpdateVerificationFlow(...args);
    }
  },
}));

vi.mock("@/lib/aws/rekognition-client", () => ({
  getRekognitionClient: () => ({
    send: mockRekognitionSend,
  }),
}));

vi.mock("@/lib/utils/password", () => ({
  PASSWORD_MIN_LENGTH: 10,
  isPasswordStrongEnough: mockIsPasswordStrongEnough,
  isBreachedPassword: mockIsBreachedPassword,
}));

import { POST as postAccount } from "@/app/api/registration/account/route";
import { POST as postAccountDraft } from "@/app/api/registration/account-draft/route";
import { POST as postCitizen } from "@/app/api/registration/citizen/route";
import { POST as postLivenessComplete } from "@/app/api/registration/verification/liveness-complete/route";
import { POST as postLivenessResult } from "@/app/api/registration/verification/liveness-result/route";
import { POST as postVerification } from "@/app/api/registration/verification/route";
import {
  createRegistrationAccountDraftCookie,
  getRegistrationAccountDraft,
} from "@/lib/services/registration/registration-account-draft.service";
import { createRegistrationLivenessChallengeCookie } from "@/lib/services/registration/registration-liveness-challenge.service";
import {
  createRegistrationSessionCookie,
  getRegistrationSession,
} from "@/lib/services/registration/registration-session.service";

function setRequestCookies(cookies: Record<string, string>) {
  requestCookies.clear();

  for (const [name, value] of Object.entries(cookies)) {
    requestCookies.set(name, value);
  }
}

const TEST_REGISTRATION_SESSION_ID = "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d";

function createVerifiedSessionWithAccountDraft(returnUrl?: string) {
  const expiresAt = Date.now() + 30 * 60 * 1000;
  const sessionCookie = createRegistrationSessionCookie(
    "40200612345",
    "verified",
    returnUrl,
    TEST_REGISTRATION_SESSION_ID,
  );
  const draftCookie = createRegistrationAccountDraftCookie({
    sessionId: TEST_REGISTRATION_SESSION_ID,
    sessionExpiresAt: expiresAt,
    cedula: "40200612345",
    email: "user@example.com",
    password: "Password123!",
  });

  return {
    registration_session: sessionCookie.value,
    registration_account_draft: draftCookie.value,
  };
}

function buildJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildBinaryResponse(bytes: number[], status = 200) {
  return new Response(Uint8Array.from(bytes), { status });
}

beforeEach(() => {
  vi.clearAllMocks();
  setRequestCookies({});
  setRequestCookieHeader("");

  process.env.REGISTRATION_SESSION_SECRET = "test-registration-secret";
  process.env.CITIZENS_API_BASE_URL = "https://citizens.example.gov";
  process.env.CITIZENS_INFO_API_KEY = "citizens-info-key";
  process.env.CITIZENS_PHOTO_API_KEY = "citizens-photo-key";
  process.env.ORY_SDK_URL = "https://ory.example.test";
  process.env.ORY_SDK_TOKEN = "ory-token";
  delete process.env.REGISTRATION_ALLOWED_RETURN_ORIGINS;
  delete process.env.LIVENESS_CONFIDENCE_THRESHOLD;
  delete process.env.FACE_SIMILARITY_THRESHOLD;

  mockCookies.mockResolvedValue({
    get(name: string) {
      const value = requestCookies.get(name);
      return value ? { name, value } : undefined;
    },
  });

  mockHeaders.mockResolvedValue(
    new Headers(
      getRequestCookieHeader()
        ? { cookie: getRequestCookieHeader() }
        : undefined,
    ),
  );

  mockListIdentities.mockResolvedValue({ data: [] });
  mockIsPasswordStrongEnough.mockReturnValue(true);
  mockIsBreachedPassword.mockResolvedValue(false);
  vi.spyOn(global, "fetch").mockImplementation(() => {
    throw new Error("Unexpected fetch call");
  });
});

describe("registration production routes", () => {
  it("creates a signed registration session cookie from the citizen route", async () => {
    process.env.REGISTRATION_ALLOWED_RETURN_ORIGINS = "https://example.com";

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      buildJsonResponse({
        valid: true,
        payload: {
          id: "402-0061234-5",
          names: "Juan Pablo",
          firstSurname: "Perez",
          secondSurname: "Gomez",
          gender: "M",
        },
      }),
    );

    const response = await postCitizen(
      new Request("http://localhost/api/registration/citizen", {
        method: "POST",
        body: JSON.stringify({
          cedula: "40200612345",
          returnUrl: "https://example.com/dashboard",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockListIdentities).toHaveBeenCalledWith({
      credentialsIdentifier: "40200612345",
    });
    expect(global.fetch).toHaveBeenCalledWith(
      new URL(
        "https://citizens.example.gov/v2/citizens/40200612345/info/basic?api-key=citizens-info-key",
      ),
      { cache: "no-store" },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      citizen: {
        id: "402-0061234-5",
        firstName: "Juan",
      },
    });

    const sessionCookie = response.cookies.get("registration_session");
    expect(sessionCookie?.value).toBeTruthy();

    setRequestCookies({
      registration_session: sessionCookie?.value ?? "",
    });

    await expect(getRegistrationSession()).resolves.toMatchObject({
      cedula: "40200612345",
      status: "identified",
      returnUrl: "https://example.com/dashboard",
    });
  });

  it("drops unallowlisted external return urls from the registration session", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      buildJsonResponse({
        valid: true,
        payload: {
          id: "402-0061234-5",
          names: "Juan Pablo",
          firstSurname: "Perez",
          secondSurname: "Gomez",
          gender: "M",
        },
      }),
    );

    const response = await postCitizen(
      new Request("http://localhost/api/registration/citizen", {
        method: "POST",
        body: JSON.stringify({
          cedula: "40200612345",
          returnUrl: "https://attacker.example/phishing",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    const sessionCookie = response.cookies.get("registration_session");

    setRequestCookies({
      registration_session: sessionCookie?.value ?? "",
    });

    await expect(getRegistrationSession()).resolves.toMatchObject({
      cedula: "40200612345",
      status: "identified",
    });
    await expect(getRegistrationSession()).resolves.not.toHaveProperty(
      "returnUrl",
    );
  });

  it("keeps same-origin return urls without allowlist configuration", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      buildJsonResponse({
        valid: true,
        payload: {
          id: "402-0061234-5",
          names: "Juan Pablo",
          firstSurname: "Perez",
          secondSurname: "Gomez",
          gender: "M",
        },
      }),
    );

    const response = await postCitizen(
      new Request("http://localhost/api/registration/citizen", {
        method: "POST",
        body: JSON.stringify({
          cedula: "40200612345",
          returnUrl: "http://localhost/dashboard",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    const sessionCookie = response.cookies.get("registration_session");

    setRequestCookies({
      registration_session: sessionCookie?.value ?? "",
    });

    await expect(getRegistrationSession()).resolves.toMatchObject({
      cedula: "40200612345",
      status: "identified",
      returnUrl: "http://localhost/dashboard",
    });
  });

  it("returns field errors for invalid citizen lookup payloads", async () => {
    const response = await postCitizen(
      new Request("http://localhost/api/registration/citizen", {
        method: "POST",
        body: JSON.stringify({
          cedula: 40200612345,
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(mockListIdentities).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "invalid_payload",
      fieldErrors: {
        cedula: "identification.id_invalid",
      },
    });
  });

  it("stores an encrypted account draft cookie for the active registration session", async () => {
    setRequestCookies({
      registration_session: createRegistrationSessionCookie(
        "40200612345",
        "identified",
      ).value,
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

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      sessionStatus: "identified",
    });

    const draftCookie = response.cookies.get("registration_account_draft");
    expect(draftCookie?.value).toBeTruthy();
    expect(draftCookie?.value).not.toContain("user@example.com");
    expect(draftCookie?.value).not.toContain("Password123!");
    expect(draftCookie?.value).not.toContain("40200612345");

    setRequestCookies({
      registration_account_draft: draftCookie?.value ?? "",
    });

    await expect(getRegistrationAccountDraft()).resolves.toMatchObject({
      cedula: "40200612345",
      email: "user@example.com",
      password: "Password123!",
    });
  });

  it("requires a registration session before validating account draft credentials", async () => {
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

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "registration_session_missing",
    });
    expect(response.cookies.get("registration_account_draft")).toBeUndefined();
  });

  it("returns field errors for invalid account draft payloads", async () => {
    setRequestCookies({
      registration_session: createRegistrationSessionCookie(
        "40200612345",
        "identified",
      ).value,
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

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "invalid_payload",
      fieldErrors: {
        email: "account.validation.email_invalid",
        password: "account.validation.password_min",
      },
    });
    expect(response.cookies.get("registration_account_draft")).toBeUndefined();
  });

  it("rejects account drafts with weak passwords before storing credentials", async () => {
    setRequestCookies({
      registration_session: createRegistrationSessionCookie(
        "40200612345",
        "identified",
      ).value,
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

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "password_weak",
      fieldErrors: {
        password: "account.validation.password_weak",
      },
    });
    expect(response.cookies.get("registration_account_draft")).toBeUndefined();
  });

  it("rejects account drafts with compromised passwords before storing credentials", async () => {
    setRequestCookies({
      registration_session: createRegistrationSessionCookie(
        "40200612345",
        "identified",
      ).value,
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

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "password_compromised",
      fieldErrors: {
        password: "account.validation.password_compromised",
      },
    });
    expect(response.cookies.get("registration_account_draft")).toBeUndefined();
  });

  it("returns field errors for invalid direct account payloads", async () => {
    setRequestCookies({
      registration_session: createRegistrationSessionCookie(
        "40200612345",
        "verified",
      ).value,
    });
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockRejectedValue(new Error("Unexpected fetch call"));

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

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockCreateBrowserRegistrationFlow).not.toHaveBeenCalled();
    expect(mockUpdateRegistrationFlow).not.toHaveBeenCalled();
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

  it("rejects direct account registration without an account draft before external calls", async () => {
    setRequestCookies({
      registration_session: createRegistrationSessionCookie(
        "40200612345",
        "verified",
      ).value,
    });
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockRejectedValue(new Error("Unexpected fetch call"));

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

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockCreateBrowserRegistrationFlow).not.toHaveBeenCalled();
    expect(mockUpdateRegistrationFlow).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "account_draft_missing",
    });
  });

  it("does not finalize direct account credentials when the draft cookie is missing", async () => {
    setRequestCookies({
      registration_session: createRegistrationSessionCookie(
        "40200612345",
        "verified",
      ).value,
    });
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockRejectedValue(new Error("Unexpected fetch call"));

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

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockCreateBrowserRegistrationFlow).not.toHaveBeenCalled();
    expect(mockUpdateRegistrationFlow).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "account_draft_missing",
    });
  });

  it("completes liveness and creates the account from the encrypted draft without client credentials", async () => {
    const registrationSessionId = "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d";
    const registrationSessionCookie = createRegistrationSessionCookie(
      "40200612345",
      "identified",
      "https://example.com/dashboard",
      registrationSessionId,
    ).value;
    const draftCookie = createRegistrationAccountDraftCookie({
      sessionId: registrationSessionId,
      sessionExpiresAt: Date.now() + 30 * 60 * 1000,
      cedula: "40200612345",
      email: "user@example.com",
      password: "Password123!",
    }).value;
    const livenessChallengeCookie = createRegistrationLivenessChallengeCookie(
      {
        sessionId: registrationSessionId,
        cedula: "40200612345",
        status: "identified",
        returnUrl: "https://example.com/dashboard",
        issuedAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      },
      "session-123",
    ).value;

    setRequestCookies({
      registration_session: registrationSessionCookie,
      registration_account_draft: draftCookie,
      registration_liveness_challenge: livenessChallengeCookie,
    });
    setRequestCookieHeader("existing_browser=browser-cookie");
    mockHeaders.mockResolvedValue(
      new Headers({ cookie: getRequestCookieHeader() }),
    );

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(buildBinaryResponse([4, 5, 6]))
      .mockResolvedValueOnce(
        buildJsonResponse({
          valid: true,
          payload: {
            id: "402-0061234-5",
            names: "Juan Pablo",
            firstSurname: "Perez",
            secondSurname: "Gomez",
            gender: "M",
          },
        }),
      )
      .mockResolvedValueOnce(
        buildJsonResponse({
          valid: true,
          payload: {
            id: "402-0061234-5",
            birthPlace: "Santo Domingo",
            birthDate: "1990-01-01T00:00:00.000Z",
            nationality: "DO",
          },
        }),
      );

    mockRekognitionSend.mockImplementation(
      async (command: { input?: Record<string, unknown> }) => {
        if (command.input?.SessionId) {
          return {
            Confidence: 99,
            ReferenceImage: { Bytes: new Uint8Array([1, 2, 3]) },
            Status: "SUCCEEDED",
          };
        }

        return {
          FaceMatches: [{ Similarity: 96 }],
        };
      },
    );
    mockCreateBrowserRegistrationFlow.mockResolvedValueOnce({
      data: {
        id: "ory-registration-flow",
        ui: {
          nodes: [
            {
              attributes: {
                name: "csrf_token",
                value: "csrf-123",
              },
            },
          ],
        },
      },
      headers: {
        "set-cookie": [
          "csrf_token=csrf-123; Path=/; HttpOnly; Domain=ory.test",
        ],
      },
    });
    mockUpdateRegistrationFlow.mockResolvedValueOnce({
      data: {
        continue_with: [
          {
            action: "show_verification_ui",
            flow: { id: "verification-flow-123" },
          },
        ],
      },
      headers: {
        "set-cookie": [
          "ory_session=ory-session; Path=/; HttpOnly; Domain=ory.test",
        ],
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

    expect(mockRekognitionSend).toHaveBeenCalledTimes(2);
    expect(mockUpdateRegistrationFlow).toHaveBeenCalledWith(
      expect.objectContaining({
        flow: "ory-registration-flow",
        updateRegistrationFlowBody: expect.objectContaining({
          password: "Password123!",
          traits: expect.objectContaining({
            email: "user@example.com",
            username: "40200612345",
          }),
        }),
      }),
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      confidence: 99,
      similarity: 96,
      destination: "email-sent",
      redirectTo:
        "/register/email-sent?flow=verification-flow-123&return_url=https%3A%2F%2Fexample.com%2Fdashboard",
    });
    expect(response.cookies.get("registration_session")?.value).toBe("");
    expect(response.cookies.get("registration_account_draft")?.value).toBe("");
  });

  it("returns unexpected_error before Rekognition when account draft reading fails", async () => {
    const registrationSessionId = "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d";
    const registrationSessionCookie = createRegistrationSessionCookie(
      "40200612345",
      "identified",
      "https://example.com/dashboard",
      registrationSessionId,
    ).value;
    const livenessChallengeCookie = createRegistrationLivenessChallengeCookie(
      {
        sessionId: registrationSessionId,
        cedula: "40200612345",
        status: "identified",
        returnUrl: "https://example.com/dashboard",
        issuedAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      },
      "session-123",
    ).value;
    const draftCookie = createRegistrationAccountDraftCookie({
      sessionId: registrationSessionId,
      sessionExpiresAt: Date.now() + 30 * 60 * 1000,
      cedula: "40200612345",
      email: "user@example.com",
      password: "Password123!",
    }).value;

    setRequestCookies({
      registration_session: registrationSessionCookie,
      registration_account_draft: draftCookie,
      registration_liveness_challenge: livenessChallengeCookie,
    });

    const cookieStore = {
      get(name: string) {
        const value = requestCookies.get(name);
        return value ? { name, value } : undefined;
      },
    };

    mockCookies
      .mockResolvedValueOnce(cookieStore)
      .mockResolvedValueOnce(cookieStore)
      .mockRejectedValueOnce(new Error("cookie store unavailable"));

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

    expect(mockRekognitionSend).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockUpdateRegistrationFlow).not.toHaveBeenCalled();
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      stage: "verification",
      code: "unexpected_error",
    });

    const verifiedCookie = response.cookies.get("registration_session");
    expect(verifiedCookie).toBeUndefined();
  });

  it("maps Ory registration success into email verification while clearing the registration session", async () => {
    setRequestCookies(
      createVerifiedSessionWithAccountDraft("https://example.com/dashboard"),
    );
    setRequestCookieHeader("existing_browser=browser-cookie");
    mockHeaders.mockResolvedValue(
      new Headers({ cookie: getRequestCookieHeader() }),
    );

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        buildJsonResponse({
          valid: true,
          payload: {
            id: "402-0061234-5",
            names: "Juan Pablo",
            firstSurname: "Perez",
            secondSurname: "Gomez",
            gender: "M",
          },
        }),
      )
      .mockResolvedValueOnce(
        buildJsonResponse({
          valid: true,
          payload: {
            id: "402-0061234-5",
            birthPlace: "Santo Domingo",
            birthDate: "1990-01-01T00:00:00.000Z",
            nationality: "DO",
          },
        }),
      );

    mockCreateBrowserRegistrationFlow.mockResolvedValueOnce({
      data: {
        id: "ory-registration-flow",
        ui: {
          nodes: [
            {
              attributes: {
                name: "csrf_token",
                value: "csrf-123",
              },
            },
          ],
        },
      },
      headers: {
        "set-cookie": [
          "csrf_token=csrf-123; Path=/; HttpOnly; Domain=ory.test",
        ],
      },
    });
    mockUpdateRegistrationFlow.mockResolvedValueOnce({
      data: {
        continue_with: [
          {
            action: "show_verification_ui",
            flow: { id: "verification-flow-123" },
          },
        ],
      },
      headers: {
        "set-cookie": [
          "ory_session=ory-session; Path=/; HttpOnly; Domain=ory.test",
        ],
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

    expect(mockCreateBrowserRegistrationFlow).toHaveBeenCalledWith(
      {},
      {
        headers: {
          Accept: "application/json",
          Cookie: "existing_browser=browser-cookie",
        },
      },
    );
    expect(mockUpdateRegistrationFlow).toHaveBeenCalledWith(
      expect.objectContaining({
        flow: "ory-registration-flow",
        cookie: "existing_browser=browser-cookie; csrf_token=csrf-123",
        updateRegistrationFlowBody: expect.objectContaining({
          password: "Password123!",
          traits: {
            email: "user@example.com",
            username: "40200612345",
            name: {
              first: "Juan Pablo",
              last: "Perez Gomez",
            },
            birthdate: "1990-01-01",
            gender: "M",
          },
        }),
      }),
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      destination: "email-sent",
      redirectTo:
        "/register/email-sent?flow=verification-flow-123&return_url=https%3A%2F%2Fexample.com%2Fdashboard",
    });
    expect(response.cookies.get("csrf_token")?.value).toBe("csrf-123");
    expect(response.cookies.get("ory_session")?.value).toBe("ory-session");
    expect(response.cookies.get("registration_session")?.value).toBe("");
  });

  it("creates a verification code flow when Ory creates an unverified identity without continue_with", async () => {
    setRequestCookies(
      createVerifiedSessionWithAccountDraft("https://example.com/dashboard"),
    );
    setRequestCookieHeader("existing_browser=browser-cookie");
    mockHeaders.mockResolvedValue(
      new Headers({ cookie: getRequestCookieHeader() }),
    );

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        buildJsonResponse({
          valid: true,
          payload: {
            id: "402-0061234-5",
            names: "Juan Pablo",
            firstSurname: "Perez",
            secondSurname: "Gomez",
            gender: "M",
          },
        }),
      )
      .mockResolvedValueOnce(
        buildJsonResponse({
          valid: true,
          payload: {
            id: "402-0061234-5",
            birthPlace: "Santo Domingo",
            birthDate: "1990-01-01T00:00:00.000Z",
            nationality: "DO",
          },
        }),
      );

    mockCreateBrowserRegistrationFlow.mockResolvedValueOnce({
      data: {
        id: "ory-registration-flow",
        ui: {
          nodes: [
            {
              attributes: {
                name: "csrf_token",
                value: "csrf-123",
              },
            },
          ],
        },
      },
      headers: {
        "set-cookie": [
          "csrf_token=csrf-123; Path=/; HttpOnly; Domain=ory.test",
        ],
      },
    });
    mockUpdateRegistrationFlow.mockResolvedValueOnce({
      data: {
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
      headers: {
        "set-cookie": [
          "ory_session=ory-session; Path=/; HttpOnly; Domain=ory.test",
        ],
      },
    });
    mockCreateBrowserVerificationFlow.mockResolvedValueOnce({
      data: {
        id: "verification-flow-456",
        ui: {
          nodes: [
            {
              attributes: {
                name: "csrf_token",
                value: "verification-csrf-456",
              },
            },
          ],
        },
      },
      headers: {
        "set-cookie": [
          "verification_csrf=verification-csrf-456; Path=/; HttpOnly; Domain=ory.test",
        ],
      },
    });
    mockUpdateVerificationFlow.mockResolvedValueOnce({
      data: {
        id: "verification-flow-456",
        state: "sent_email",
      },
      headers: {
        "set-cookie": [
          "ory_verification=verification-session; Path=/; HttpOnly; Domain=ory.test",
        ],
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

    expect(mockCreateBrowserVerificationFlow).toHaveBeenCalledWith(
      { returnTo: "https://example.com/dashboard" },
      {
        headers: {
          Accept: "application/json",
          Cookie:
            "existing_browser=browser-cookie; csrf_token=csrf-123; ory_session=ory-session",
        },
      },
    );
    expect(mockUpdateVerificationFlow).toHaveBeenCalledWith(
      {
        flow: "verification-flow-456",
        cookie:
          "existing_browser=browser-cookie; csrf_token=csrf-123; ory_session=ory-session; verification_csrf=verification-csrf-456",
        updateVerificationFlowBody: {
          csrf_token: "verification-csrf-456",
          method: "code",
          email: "user@example.com",
        },
      },
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      destination: "email-sent",
      redirectTo:
        "/register/email-sent?flow=verification-flow-456&return_url=https%3A%2F%2Fexample.com%2Fdashboard",
    });
    expect(response.cookies.get("ory_session")?.value).toBe("ory-session");
    expect(response.cookies.get("ory_verification")?.value).toBe(
      "verification-session",
    );
    expect(response.cookies.get("registration_session")?.value).toBe("");
  });

  it("propagates Ory field errors through the real error mapper", async () => {
    setRequestCookies(createVerifiedSessionWithAccountDraft());
    setRequestCookieHeader("existing_browser=browser-cookie");
    mockHeaders.mockResolvedValue(
      new Headers({ cookie: getRequestCookieHeader() }),
    );

    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        buildJsonResponse({
          valid: true,
          payload: {
            id: "402-0061234-5",
            names: "Juan Pablo",
            firstSurname: "Perez",
            secondSurname: "Gomez",
            gender: "M",
          },
        }),
      )
      .mockResolvedValueOnce(
        buildJsonResponse({
          valid: true,
          payload: {
            id: "402-0061234-5",
            birthPlace: "Santo Domingo",
            birthDate: "1990-01-01T00:00:00.000Z",
            nationality: "DO",
          },
        }),
      );

    mockCreateBrowserRegistrationFlow.mockResolvedValueOnce({
      data: {
        id: "ory-registration-flow",
        ui: {
          nodes: [
            {
              attributes: {
                name: "csrf_token",
                value: "csrf-123",
              },
            },
          ],
        },
      },
      headers: {
        "set-cookie": [
          "csrf_token=csrf-123; Path=/; HttpOnly; Domain=ory.test",
        ],
      },
    });
    mockUpdateRegistrationFlow.mockResolvedValueOnce({
      data: {
        ui: {
          nodes: [
            {
              attributes: {
                name: "traits.email",
              },
              messages: [
                {
                  id: 4000007,
                  text: "An account with this email already exists.",
                },
              ],
            },
          ],
        },
      },
      headers: {
        "set-cookie": [
          "ory_session=partial-session; Path=/; HttpOnly; Domain=ory.test",
        ],
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
    expect(response.cookies.get("ory_session")?.value).toBe("partial-session");
  });

  it("upgrades the signed session to verified after a successful liveness result", async () => {
    const registrationSessionId = "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d";
    const registrationSessionCookie = createRegistrationSessionCookie(
      "40200612345",
      "identified",
      "https://example.com/dashboard",
      registrationSessionId,
    ).value;
    const livenessChallengeCookie = createRegistrationLivenessChallengeCookie(
      {
        sessionId: registrationSessionId,
        cedula: "40200612345",
        status: "identified",
        returnUrl: "https://example.com/dashboard",
        issuedAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      },
      "session-123",
    ).value;
    const draftCookie = createRegistrationAccountDraftCookie({
      sessionId: registrationSessionId,
      sessionExpiresAt: Date.now() + 30 * 60 * 1000,
      cedula: "40200612345",
      email: "user@example.com",
      password: "Password123!",
    }).value;

    setRequestCookies({
      registration_session: registrationSessionCookie,
      registration_account_draft: draftCookie,
      registration_liveness_challenge: livenessChallengeCookie,
    });

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      buildBinaryResponse([4, 5, 6]),
    );
    mockRekognitionSend.mockImplementation(
      async (command: { input?: Record<string, unknown> }) => {
        if (command.input?.SessionId) {
          return {
            Confidence: 99,
            ReferenceImage: { Bytes: new Uint8Array([1, 2, 3]) },
            Status: "SUCCEEDED",
          };
        }

        return {
          FaceMatches: [{ Similarity: 96 }],
        };
      },
    );

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

    expect(global.fetch).toHaveBeenCalledWith(
      new URL(
        "https://citizens.example.gov/v1/citizens/pictures/40200612345/photo?api-key=citizens-photo-key",
      ),
      { cache: "no-store" },
    );
    expect(mockRekognitionSend).toHaveBeenCalledTimes(2);
    expect(mockRekognitionSend.mock.calls[1]?.[0]?.input).toMatchObject({
      SimilarityThreshold: 80,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      confidence: 99,
      similarity: 96,
    });

    const sessionCookie = response.cookies.get("registration_session");
    expect(sessionCookie?.value).toBeTruthy();

    setRequestCookies({
      registration_session: sessionCookie?.value ?? "",
    });

    await expect(getRegistrationSession()).resolves.toMatchObject({
      cedula: "40200612345",
      status: "verified",
      returnUrl: "https://example.com/dashboard",
    });
  });

  it("treats a tampered registration session cookie as missing", async () => {
    const validCookie = createRegistrationSessionCookie(
      "40200612345",
      "identified",
    ).value;
    const tamperedCookie =
      validCookie.slice(0, -1) + (validCookie.endsWith("a") ? "b" : "a");

    setRequestCookies({
      registration_session: tamperedCookie,
    });

    const response = await postVerification();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "registration_session_missing",
    });
  });
});
