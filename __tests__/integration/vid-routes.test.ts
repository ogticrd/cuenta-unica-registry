import { NextRequest, type NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  browserCookies,
  getOAuth2Client,
  introspectOAuth2Token,
  findCitizenSummaryByCedula,
  findOryIdentityById,
  createLivenessSession,
  getLivenessResults,
  compareFaces,
  fetchCitizenPhoto,
} = vi.hoisted(() => ({
  browserCookies: new Map<string, { value: string }>(),
  getOAuth2Client: vi.fn(),
  introspectOAuth2Token: vi.fn(),
  findCitizenSummaryByCedula: vi.fn(),
  findOryIdentityById: vi.fn(),
  createLivenessSession: vi.fn(),
  getLivenessResults: vi.fn(),
  compareFaces: vi.fn(),
  fetchCitizenPhoto: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => browserCookies }));
vi.mock("@/lib/ory/oauth-client", () => ({
  getOAuth2AdminClient: () => ({ introspectOAuth2Token }),
  getOAuth2Client,
}));
vi.mock("@/lib/services/registration/citizen-registry.service", () => ({
  findCitizenSummaryByCedula,
}));
vi.mock("@/lib/services/registration/ory-identity.service", () => ({
  findOryIdentityById,
}));
vi.mock("@/lib/services/registration/rekognition.service", () => ({
  createLivenessSession,
  getLivenessResults,
  compareFaces,
}));
vi.mock("@/lib/services/registration/citizen-photo.service", () => ({
  fetchCitizenPhoto,
}));

import { POST } from "@/app/api/vid/liveness/route";
import { GET } from "@/app/api/vid/route";

const clientId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const identityId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const callback = "https://partner.example/vid/callback?transaction=opaque";
const cedula = "00100000003";
const state = "client-state & context";

function launchRequest(changes?: Record<string, string>) {
  const url = new URL("https://cuc.example/api/vid");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callback,
    access_token: "test-access-token",
    state,
    ...changes,
  }).toString();
  return new NextRequest(url);
}

function receiveCookies(response: NextResponse) {
  for (const cookie of response.cookies.getAll()) {
    if (cookie.maxAge === 0) {
      browserCookies.delete(cookie.name);
    } else {
      browserCookies.set(cookie.name, { value: cookie.value });
    }
  }
}

async function launch() {
  const response = await GET(launchRequest());
  expect(response.status).toBe(303);
  const location = response.headers.get("location") ?? "";
  expect(location).toMatch(/^\/vid\?flow=/);
  expect(location).not.toContain("test-access-token");
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  const cookie = response.cookies.getAll()[0];
  expect(cookie).toMatchObject({
    httpOnly: true,
    sameSite: "lax",
    maxAge: 120,
  });
  expect(cookie?.value).not.toContain(cedula);
  receiveCookies(response);
  return new URL(location, "https://cuc.example").searchParams.get("flow");
}

async function sendLiveness(body: Record<string, unknown>) {
  return POST(
    new Request("https://cuc.example/api/vid/liveness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("REGISTRATION_SESSION_SECRET", "vid-test-secret");
  vi.stubEnv("BIOMETRIC_MAX_ATTEMPTS", "3");
  browserCookies.clear();
  introspectOAuth2Token.mockResolvedValue({
    data: {
      active: true,
      client_id: clientId,
      sub: identityId,
      token_use: "access_token",
    },
  });
  getOAuth2Client.mockResolvedValue({ redirect_uris: [callback] });
  findOryIdentityById.mockResolvedValue({ traits: { username: cedula } });
  findCitizenSummaryByCedula.mockResolvedValue({
    id: cedula,
    firstName: "Test",
  });
  createLivenessSession.mockResolvedValue("rekognition-test-session");
  getLivenessResults.mockResolvedValue({
    status: "SUCCEEDED",
    confidence: 100,
    referenceImageBytes: Uint8Array.of(1),
  });
  fetchCitizenPhoto.mockResolvedValue(Uint8Array.of(2));
  compareFaces.mockResolvedValue({ isMatch: true, similarity: 100 });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("VID routes", () => {
  it("returns the approved callback with the original state only after a face match", async () => {
    const flowId = await launch();
    const started = await sendLiveness({
      stage: "start",
      flowId,
      retry: false,
    });
    expect(await started.json()).toEqual({
      success: true,
      sessionId: "rekognition-test-session",
    });
    receiveCookies(started);

    const reused = await sendLiveness({ stage: "start", flowId, retry: false });
    expect(await reused.json()).toEqual({
      success: true,
      sessionId: "rekognition-test-session",
    });
    expect(createLivenessSession).toHaveBeenCalledTimes(1);

    const result = await sendLiveness({
      stage: "complete",
      flowId,
      sessionId: "rekognition-test-session",
      cedula: "other",
      redirect_uri: "https://unregistered.example",
    });
    const destination = new URL(callback);
    destination.searchParams.set("state", state);
    expect(await result.json()).toEqual({
      success: true,
      redirectTo: destination.href,
    });
    expect(fetchCitizenPhoto).toHaveBeenCalledWith(cedula);
    receiveCookies(result);
    expect(browserCookies.size).toBe(0);
  });

  it("accepts a legacy UserInfo response with a matching audience", async () => {
    vi.stubEnv("ORY_SDK_URL", "https://ory.example");
    introspectOAuth2Token.mockResolvedValue({ data: { active: false } });
    const fetch = vi
      .fn()
      .mockResolvedValue(Response.json({ sub: identityId, aud: clientId }));
    vi.stubGlobal("fetch", fetch);
    await launch();
    expect(fetch).toHaveBeenCalledWith(
      new URL("https://ory.example/userinfo"),
      expect.objectContaining({
        headers: { Authorization: "Bearer test-access-token" },
      }),
    );
  });

  it("rejects a token for a different client", async () => {
    introspectOAuth2Token.mockResolvedValue({
      data: { active: true, client_id: "different-client", sub: identityId },
    });
    const response = await GET(launchRequest());
    expect(response.headers.get("location")).toBe("/vid?error=invalid_client");
    expect(response.cookies.getAll()).toHaveLength(0);
    expect(findCitizenSummaryByCedula).not.toHaveBeenCalled();
  });

  it("requires the exact registered return address", async () => {
    const response = await GET(
      launchRequest({
        redirect_uri: "https://partner.example/another-path",
        lang: "en",
      }),
    );
    expect(response.headers.get("location")).toBe(
      "/vid?error=invalid_redirect_uri",
    );
    expect(response.cookies.getAll()).toHaveLength(0);
  });

  it("rejects a liveness challenge from a different flow", async () => {
    const flowId = await launch();
    const started = await sendLiveness({
      stage: "start",
      flowId,
      retry: false,
    });
    receiveCookies(started);
    const result = await sendLiveness({
      stage: "complete",
      flowId,
      sessionId: "unrelated-session",
    });
    expect(result.status).toBe(400);
    expect(await result.json()).toMatchObject({
      success: false,
      code: "invalid_session_id",
    });
    expect(getLivenessResults).not.toHaveBeenCalled();
  });

  it("withholds the callback on a face mismatch and limits new attempts", async () => {
    const flowId = await launch();
    const started = await sendLiveness({
      stage: "start",
      flowId,
      retry: false,
    });
    receiveCookies(started);
    compareFaces.mockResolvedValue({ isMatch: false, similarity: 0 });
    const mismatch = await sendLiveness({
      stage: "complete",
      flowId,
      sessionId: "rekognition-test-session",
    });
    expect(await mismatch.json()).toEqual({
      success: false,
      code: "face_mismatch",
      stage: "complete",
    });

    for (const attempt of [
      "rekognition-test-session-2",
      "rekognition-test-session-3",
    ]) {
      createLivenessSession.mockResolvedValueOnce(attempt);
      const retry = await sendLiveness({ stage: "start", flowId, retry: true });
      expect(await retry.json()).toEqual({ success: true, sessionId: attempt });
      receiveCookies(retry);
    }

    const limited = await sendLiveness({ stage: "start", flowId, retry: true });
    expect(limited.status).toBe(429);
    expect(await limited.json()).toMatchObject({
      success: false,
      code: "attempt_limit",
    });
    expect(createLivenessSession).toHaveBeenCalledTimes(3);
  });

  it("rejects an expired flow before creating a Rekognition session", async () => {
    vi.useFakeTimers();
    const flowId = await launch();
    vi.advanceTimersByTime(120_000);
    const response = await sendLiveness({
      stage: "start",
      flowId,
      retry: false,
    });
    expect(response.status).toBe(410);
    expect(await response.json()).toMatchObject({
      success: false,
      code: "flow_expired",
    });
    expect(createLivenessSession).not.toHaveBeenCalled();
  });
});
