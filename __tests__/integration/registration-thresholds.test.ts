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
import {
    createRegistrationSessionCookie,
} from "@/lib/services/registration/registration-session.service";

function setRequestCookies(cookies: Record<string, string>) {
    requestCookies.clear();
    for (const [name, value] of Object.entries(cookies)) {
        requestCookies.set(name, value);
    }
}

beforeEach(() => {
    vi.clearAllMocks();
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
            getRequestCookieHeader() ? { cookie: getRequestCookieHeader() } : undefined,
        ),
    );

    vi.spyOn(global, "fetch").mockImplementation(() => {
        throw new Error("Unexpected fetch call");
    });
});

describe("liveness threshold configuration", () => {
    it("uses custom threshold env vars", async () => {
        // Set custom thresholds BEFORE importing the route module
        process.env.LIVENESS_CONFIDENCE_THRESHOLD = "95";
        process.env.FACE_SIMILARITY_THRESHOLD = "97";

        // Dynamic import picks up the env vars at module evaluation time
        const { POST: postLivenessResult } = await import(
            "@/app/api/registration/verification/liveness-result/route"
        );

        setRequestCookies({
            registration_session: createRegistrationSessionCookie(
                "40200612345",
                "identified",
            ).value,
        });

        vi.spyOn(global, "fetch").mockResolvedValueOnce(
            new Response(Uint8Array.from([4, 5, 6]), { status: 200 }),
        );

        mockRekognitionSend.mockImplementation(async (command: { input?: Record<string, unknown> }) => {
            if (command.input?.SessionId) {
                return {
                    Confidence: 95, // exactly at custom threshold
                    ReferenceImage: { Bytes: new Uint8Array([1, 2, 3]) },
                    Status: "SUCCEEDED",
                };
            }
            return {
                FaceMatches: [{ Similarity: 96 }], // below custom 97 threshold
            };
        });

        const response = await postLivenessResult(
            new Request("http://localhost/api/registration/verification/liveness-result", {
                method: "POST",
                body: JSON.stringify({ sessionId: "session-123" }),
                headers: { "Content-Type": "application/json" },
            }),
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

        setRequestCookies({
            registration_session: createRegistrationSessionCookie(
                "40200612345",
                "identified",
            ).value,
        });

        vi.spyOn(global, "fetch").mockResolvedValueOnce(
            new Response(Uint8Array.from([4, 5, 6]), { status: 200 }),
        );

        mockRekognitionSend.mockImplementation(async (command: { input?: Record<string, unknown> }) => {
            if (command.input?.SessionId) {
                return {
                    Confidence: 89, // below default 90 threshold
                    ReferenceImage: { Bytes: new Uint8Array([1, 2, 3]) },
                    Status: "SUCCEEDED",
                };
            }
            return {
                FaceMatches: [{ Similarity: 96 }],
            };
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
});