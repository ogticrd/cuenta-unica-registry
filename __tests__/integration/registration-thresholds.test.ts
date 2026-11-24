import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requestCookies,
  getRequestCookieHeader,
  setRequestCookieHeader,
  mockCookies,
  mockHeaders,
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
    mockRekognitionSend: vi.fn(),
  };
});

vi.mock("next/headers", () => ({
  cookies: mockCookies,
  headers: mockHeaders,
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/aws/rekognition-client", () => ({
  getRekognitionClient: () => ({
    send: mockRekognitionSend,
  }),
}));

// We import this dynamically inside the test so vi.resetModules() only affects this file
import { createRegistrationAccountDraftCookie } from "@/lib/services/registration/registration-account-draft.service";
import { createRegistrationLivenessChallengeCookie } from "@/lib/services/registration/registration-liveness-challenge.service";
import { createRegistrationSessionCookie } from "@/lib/services/registration/registration-session.service";

const TEST_REGISTRATION_SESSION_ID = "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d";

function setRequestCookies(cookies: Record<string, string>) {
  requestCookies.clear();
  for (const [name, value] of Object.entries(cookies)) {
    requestCookies.set(name, value);
  }
}

function setIdentifiedSessionWithLivenessChallenge() {
  const expiresAt = Date.now() + 30 * 60 * 1000;
  const sessionCookie = createRegistrationSessionCookie(
    "40200612345",
    "identified",
    undefined,
    TEST_REGISTRATION_SESSION_ID,
  );
  const challengeCookie = createRegistrationLivenessChallengeCookie(
    {
      sessionId: TEST_REGISTRATION_SESSION_ID,
      cedula: "40200612345",
      status: "identified",
      issuedAt: Date.now(),
      expiresAt,
    },
    "session-123",
  );
  const draftCookie = createRegistrationAccountDraftCookie({
    sessionId: TEST_REGISTRATION_SESSION_ID,
    sessionExpiresAt: expiresAt,
    cedula: "40200612345",
    email: "user@example.com",
    password: "Password123!",
  });

  setRequestCookies({
    registration_session: sessionCookie.value,
    registration_account_draft: draftCookie.value,
    registration_liveness_challenge: challengeCookie.value,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  setRequestCookies({});
  setRequestCookieHeader("");

  process.env.REGISTRATION_SESSION_SECRET = "test-registration-secret";
  process.env.CITIZENS_API_BASE_URL = "https://citizens.example.gov";
  process.env.CITIZENS_PHOTO_API_KEY = "citizens-photo-key";
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

  vi.spyOn(global, "fetch").mockImplementation(() => {
    throw new Error("Unexpected fetch call");
  });
});

describe("liveness threshold configuration", () => {
  it.each([
    { confidence: 85, similarity: 99, code: "liveness_check_failed" },
    { confidence: 85.01, similarity: 95, code: null },
    { confidence: 99, similarity: 94.99, code: "face_mismatch" },
    { confidence: 99, similarity: 95, code: null },
    { confidence: 99, similarity: null, code: "face_mismatch" },
  ])("matches v1 at confidence=$confidence and similarity=$similarity", async ({
    confidence,
    similarity,
    code,
  }) => {
    const { POST } = await import(
      "@/app/api/registration/verification/liveness-result/route"
    );
    setIdentifiedSessionWithLivenessChallenge();
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(Uint8Array.from([4, 5, 6])),
    );
    mockRekognitionSend.mockImplementation(
      async (command: { input?: Record<string, unknown> }) =>
        command.input?.SessionId
          ? {
              Confidence: confidence,
              ReferenceImage: { Bytes: new Uint8Array([1, 2, 3]) },
              Status: "SUCCEEDED",
            }
          : {
              FaceMatches:
                similarity === null ? [] : [{ Similarity: similarity }],
            },
    );
    const response = await POST(
      new Request(
        "http://localhost/api/registration/verification/liveness-result",
        {
          method: "POST",
          body: JSON.stringify({ sessionId: "session-123" }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    if (code) {
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ success: false, code });
    } else {
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        success: true,
        confidence,
        similarity,
      });
    }
    if (confidence <= 85) expect(mockRekognitionSend).toHaveBeenCalledTimes(1);
    else
      expect(
        mockRekognitionSend.mock.calls[1][0].input.SimilarityThreshold,
      ).toBe(95);
  });

  it("does not allow an invalid facial threshold to weaken comparison", async () => {
    process.env.FACE_SIMILARITY_THRESHOLD = "-1";
    const { POST } = await import(
      "@/app/api/registration/verification/liveness-result/route"
    );
    setIdentifiedSessionWithLivenessChallenge();
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(Uint8Array.from([4, 5, 6])),
    );
    mockRekognitionSend.mockImplementation(
      async (command: { input?: Record<string, unknown> }) =>
        command.input?.SessionId
          ? {
              Confidence: 99,
              ReferenceImage: { Bytes: new Uint8Array([1, 2, 3]) },
              Status: "SUCCEEDED",
            }
          : { FaceMatches: [{ Similarity: 94 }] },
    );
    const response = await POST(
      new Request(
        "http://localhost/api/registration/verification/liveness-result",
        { method: "POST", body: JSON.stringify({ sessionId: "session-123" }) },
      ),
    );
    expect(await response.json()).toMatchObject({
      success: false,
      code: "face_mismatch",
    });
    expect(mockRekognitionSend.mock.calls[1][0].input.SimilarityThreshold).toBe(
      95,
    );
  });

  it("uses custom threshold env vars", async () => {
    // Set custom thresholds BEFORE importing the route module
    process.env.LIVENESS_CONFIDENCE_THRESHOLD = "95";
    process.env.FACE_SIMILARITY_THRESHOLD = "97";

    // Dynamic import picks up the env vars at module evaluation time
    const { POST: postLivenessResult } = await import(
      "@/app/api/registration/verification/liveness-result/route"
    );

    setIdentifiedSessionWithLivenessChallenge();

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(Uint8Array.from([4, 5, 6]), { status: 200 }),
    );

    mockRekognitionSend.mockImplementation(
      async (command: { input?: Record<string, unknown> }) => {
        if (command.input?.SessionId) {
          return {
            Confidence: 96, // strictly above the custom threshold, as in v1
            ReferenceImage: { Bytes: new Uint8Array([1, 2, 3]) },
            Status: "SUCCEEDED",
          };
        }
        return {
          FaceMatches: [{ Similarity: 96 }], // below custom 97 threshold
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

    // Assert the custom threshold was used
    expect(mockRekognitionSend.mock.calls[1]?.[0]?.input).toMatchObject({
      SimilarityThreshold: 97,
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "face_mismatch",
    });
  });

  it("uses default thresholds when env vars are not set", async () => {
    // Ensure defaults are used
    delete process.env.LIVENESS_CONFIDENCE_THRESHOLD;
    delete process.env.FACE_SIMILARITY_THRESHOLD;

    const { POST: postLivenessResult } = await import(
      "@/app/api/registration/verification/liveness-result/route"
    );

    setIdentifiedSessionWithLivenessChallenge();

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(Uint8Array.from([4, 5, 6]), { status: 200 }),
    );

    mockRekognitionSend.mockImplementation(
      async (command: { input?: Record<string, unknown> }) => {
        if (command.input?.SessionId) {
          return {
            Confidence: 85, // v1 requires confidence strictly greater than 85
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

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "liveness_check_failed",
    });
  });

  it("falls back to default thresholds when env vars are invalid", async () => {
    process.env.LIVENESS_CONFIDENCE_THRESHOLD = "not-a-number";
    process.env.FACE_SIMILARITY_THRESHOLD = "-1";

    const { POST: postLivenessResult } = await import(
      "@/app/api/registration/verification/liveness-result/route"
    );

    setIdentifiedSessionWithLivenessChallenge();

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(Uint8Array.from([4, 5, 6]), { status: 200 }),
    );

    mockRekognitionSend.mockImplementation(
      async (command: { input?: Record<string, unknown> }) => {
        if (command.input?.SessionId) {
          return {
            Confidence: 85,
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

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: "liveness_check_failed",
    });
  });
});
