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
import { POST as postLivenessResult } from "@/app/api/registration/verification/liveness-result/route";
import { POST as postVerification } from "@/app/api/registration/verification/route";
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
  vi.spyOn(global, "fetch").mockImplementation(() => {
    throw new Error("Unexpected fetch call");
  });
});

describe("registration production routes", () => {
  it("creates a signed registration session cookie from the citizen route", async () => {
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

  it("maps Ory registration success into email verification while clearing the registration session", async () => {
    setRequestCookies({
      registration_session: createRegistrationSessionCookie(
        "40200612345",
        "verified",
        "https://example.com/dashboard",
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

  it("propagates Ory field errors through the real error mapper", async () => {
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
    setRequestCookies({
      registration_session: createRegistrationSessionCookie(
        "40200612345",
        "identified",
        "https://example.com/dashboard",
      ).value,
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
