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
  mockRekognitionSend,
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
    mockRekognitionSend: vi.fn(),
  };
});

vi.mock("next/headers", () => ({
  cookies: mockCookies,
  headers: mockHeaders,
}));

vi.mock("server-only", () => ({}));

vi.mock("@ory/client", () => ({
  Configuration: class Configuration {
    constructor(_options?: unknown) {}
  },
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
  },
}));

vi.mock("@/lib/aws/rekognition-client", () => ({
  getRekognitionClient: () => ({
    send: mockRekognitionSend,
  }),
}));

import { POST as postAccount } from "@/app/api/registration/account/route";
import { POST as postCitizen } from "@/app/api/registration/citizen/route";
import { POST as postLivenessSession } from "@/app/api/registration/verification/liveness-session/route";
import { POST as postVerification } from "@/app/api/registration/verification/route";
import { POST as postLivenessResult } from "@/app/api/registration/verification/liveness-result/route";
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

function buildJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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
      getRequestCookieHeader() ? { cookie: getRequestCookieHeader() } : undefined,
    ),
  );

  mockListIdentities.mockResolvedValue({ data: [] });
  vi.spyOn(global, "fetch").mockImplementation(() => {
    throw new Error("Unexpected fetch call");
  });
});

describe("registration production paths", () => {
  it("accepts a valid signed registration session in the verification route", async () => {
    setRequestCookies({
      registration_session: createRegistrationSessionCookie(
        "40200612345",
        "identified",
      ).value,
    });

    const response = await postVerification();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("rejects an expired signed registration session in the verification route", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000);
    const cookie = createRegistrationSessionCookie("40200612345", "identified").value;
    nowSpy.mockReturnValue(31 * 60 * 1_000);

    setRequestCookies({
      registration_session: cookie,
    });

    const response = await postVerification();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "registration_session_missing",
    });
  });

  it("redirects to the return url when Ory completes registration immediately", async () => {
    setRequestCookies({
      registration_session: createRegistrationSessionCookie(
        "40200612345",
        "verified",
        "https://example.com/welcome",
      ).value,
    });
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
        "set-cookie": ["csrf_token=csrf-123; Path=/; HttpOnly; Domain=ory.test"],
      },
    });
    mockUpdateRegistrationFlow.mockResolvedValueOnce({
      data: {
        identity: {
          id: "identity-123",
        },
      },
      headers: {
        "set-cookie": ["ory_session=ory-session; Path=/; HttpOnly; Domain=ory.test"],
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

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      destination: "login",
      redirectTo: "https://example.com/welcome",
    });
    expect(response.cookies.get("ory_session")?.value).toBe("ory-session");
    expect(response.cookies.get("registration_session")?.value).toBe("");
  });

  it("maps Ory error payloads to a bad request when Ory reports a csrf violation", async () => {
    setRequestCookies({
      registration_session: createRegistrationSessionCookie(
        "40200612345",
        "verified",
      ).value,
    });
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
        "set-cookie": ["csrf_token=csrf-123; Path=/; HttpOnly; Domain=ory.test"],
      },
    });
    mockUpdateRegistrationFlow.mockResolvedValueOnce({
      data: {
        error: {
          id: "security_csrf_violation",
          message: "csrf rejected",
        },
      },
      headers: {
        "set-cookie": ["ory_session=partial-session; Path=/; HttpOnly; Domain=ory.test"],
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
      code: "ory_validation_error",
    });
    expect(response.cookies.get("ory_session")?.value).toBe("partial-session");
  });

  it("maps other Ory error payloads to a gateway failure", async () => {
    setRequestCookies({
      registration_session: createRegistrationSessionCookie(
        "40200612345",
        "verified",
      ).value,
    });
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
        "set-cookie": ["csrf_token=csrf-123; Path=/; HttpOnly; Domain=ory.test"],
      },
    });
    mockUpdateRegistrationFlow.mockResolvedValueOnce({
      data: {
        error: {
          id: "server_error",
          message: "upstream failed",
        },
      },
      headers: {
        "set-cookie": ["ory_session=partial-session; Path=/; HttpOnly; Domain=ory.test"],
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

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "ory_validation_error",
    });
  });

  it("returns citizen_photo_unavailable when the official citizen photo cannot be fetched", async () => {
    setRequestCookies({
      registration_session: createRegistrationSessionCookie(
        "40200612345",
        "identified",
        "https://example.com/dashboard",
      ).value,
    });

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("unavailable", {
        status: 503,
        statusText: "Service Unavailable",
      }),
    );
    mockRekognitionSend.mockResolvedValueOnce({
      Confidence: 99,
      ReferenceImage: { Bytes: new Uint8Array([1, 2, 3]) },
      Status: "SUCCEEDED",
    });

    const response = await postLivenessResult(
      new Request("http://localhost/api/registration/verification/liveness-result", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-123" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "citizen_photo_unavailable",
    });
  });

  it("returns rekognition_error when face comparison fails after loading real images", async () => {
    setRequestCookies({
      registration_session: createRegistrationSessionCookie(
        "40200612345",
        "identified",
      ).value,
    });

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(Uint8Array.from([4, 5, 6]), { status: 200 }),
    );
    mockRekognitionSend
      .mockResolvedValueOnce({
        Confidence: 99,
        ReferenceImage: { Bytes: new Uint8Array([1, 2, 3]) },
        Status: "SUCCEEDED",
      })
      .mockRejectedValueOnce(new Error("compare failed"));

    const response = await postLivenessResult(
      new Request("http://localhost/api/registration/verification/liveness-result", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-123" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "rekognition_error",
    });
  });

  it("treats missing liveness reference images as a failed check", async () => {
    setRequestCookies({
      registration_session: createRegistrationSessionCookie(
        "40200612345",
        "identified",
      ).value,
    });

    mockRekognitionSend.mockResolvedValueOnce({
      Confidence: 99,
      Status: "SUCCEEDED",
    });

    const response = await postLivenessResult(
      new Request("http://localhost/api/registration/verification/liveness-result", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-123" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "liveness_check_failed",
    });
  });

  it("surfaces registry API failures from the citizen route with real services", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("registry unavailable", {
        status: 500,
        statusText: "Internal Server Error",
      }),
    );

    const response = await postCitizen(
      new Request("http://localhost/api/registration/citizen", {
        method: "POST",
        body: JSON.stringify({ cedula: "40200612345" }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "unexpected_error",
    });
  });

  it("completes the multi-step registration flow across real routes", async () => {
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
      .mockResolvedValueOnce(new Response(Uint8Array.from([4, 5, 6]), { status: 200 }))
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
        "set-cookie": ["csrf_token=csrf-123; Path=/; HttpOnly; Domain=ory.test"],
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
        "set-cookie": ["ory_session=ory-session; Path=/; HttpOnly; Domain=ory.test"],
      },
    });
    mockRekognitionSend.mockImplementation(async (command: { input?: Record<string, unknown> }) => {
      if (command.input?.SessionId) {
        return {
          Confidence: 99,
          ReferenceImage: { Bytes: new Uint8Array([1, 2, 3]) },
          Status: "SUCCEEDED",
        };
      }

      if (command.input?.SimilarityThreshold) {
        return {
          FaceMatches: [{ Similarity: 96 }],
        };
      }

      return {
        SessionId: "session-123",
      };
    });

    const citizenResponse = await postCitizen(
      new Request("http://localhost/api/registration/citizen", {
        method: "POST",
        body: JSON.stringify({
          cedula: "40200612345",
          returnUrl: "https://example.com/dashboard",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(citizenResponse.status).toBe(200);
    const identifiedCookie = citizenResponse.cookies.get("registration_session");
    expect(identifiedCookie?.value).toBeTruthy();

    setRequestCookies({
      registration_session: identifiedCookie?.value ?? "",
    });

    const verificationResponse = await postVerification();
    expect(verificationResponse.status).toBe(200);

    const livenessSessionResponse = await postLivenessSession();
    expect(livenessSessionResponse.status).toBe(200);
    await expect(livenessSessionResponse.json()).resolves.toEqual({
      success: true,
      sessionId: "session-123",
    });

    const livenessResultResponse = await postLivenessResult(
      new Request("http://localhost/api/registration/verification/liveness-result", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-123" }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(livenessResultResponse.status).toBe(200);

    const verifiedCookie = livenessResultResponse.cookies.get("registration_session");
    expect(verifiedCookie?.value).toBeTruthy();

    setRequestCookies({
      registration_session: verifiedCookie?.value ?? "",
    });
    setRequestCookieHeader("existing_browser=browser-cookie");
    mockHeaders.mockResolvedValue(
      new Headers({ cookie: getRequestCookieHeader() }),
    );

    const accountResponse = await postAccount(
      new Request("http://localhost/api/registration/account", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "Password123!",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(accountResponse.status).toBe(200);
    await expect(accountResponse.json()).resolves.toEqual({
      success: true,
      destination: "email-sent",
      redirectTo:
        "/register/email-sent?flow=verification-flow-123&return_url=https%3A%2F%2Fexample.com%2Fdashboard",
    });
    expect(accountResponse.cookies.get("registration_session")?.value).toBe("");
    expect(accountResponse.cookies.get("ory_session")?.value).toBe("ory-session");

    setRequestCookies({});
    await expect(getRegistrationSession()).resolves.toBeNull();
  });
});
