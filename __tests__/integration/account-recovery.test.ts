import type { NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  requestCookies,
  listIdentities,
  getIdentity,
  updateIdentity,
  listIdentitySessions,
  disableSession,
  createRegistrationFlow,
  updateRegistrationFlow,
  createVerificationFlow,
  updateVerificationFlow,
  getLivenessResults,
  validateRecaptchaToken,
} = vi.hoisted(() => ({
  requestCookies: new Map<string, string>(),
  listIdentities: vi.fn(),
  getIdentity: vi.fn(),
  updateIdentity: vi.fn(),
  listIdentitySessions: vi.fn(),
  disableSession: vi.fn(),
  createRegistrationFlow: vi.fn(),
  updateRegistrationFlow: vi.fn(),
  createVerificationFlow: vi.fn(),
  updateVerificationFlow: vi.fn(),
  getLivenessResults: vi.fn(),
  validateRecaptchaToken: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = requestCookies.get(name);
      return value ? { name, value } : undefined;
    },
  }),
  headers: async () =>
    new Headers({
      cookie: [...requestCookies]
        .map(([name, value]) => `${name}=${value}`)
        .join("; "),
    }),
}));
vi.mock("@ory/client", () => ({
  Configuration: class {},
  IdentityApi: class {
    listIdentities = listIdentities;
    getIdentity = getIdentity;
    updateIdentity = updateIdentity;
    listIdentitySessions = listIdentitySessions;
    disableSession = disableSession;
  },
  FrontendApi: class {
    createBrowserRegistrationFlow = createRegistrationFlow;
    updateRegistrationFlow = updateRegistrationFlow;
    createBrowserVerificationFlow = createVerificationFlow;
    updateVerificationFlow = updateVerificationFlow;
  },
}));
vi.mock("@/lib/analytics/context", () => ({
  getAnalyticsContext: async () => null,
}));
vi.mock("@/lib/analytics/emitter", () => ({ emitAnalyticsEvent: vi.fn() }));
vi.mock("@/lib/services/recaptcha/recaptcha.service", () => ({
  validateRecaptchaToken,
}));
vi.mock("@/lib/services/registration/citizen-registry.service", () => ({
  findCitizenSummaryByCedula: async (cedula: string) => ({
    id: cedula,
    firstName: "Prueba",
  }),
}));
vi.mock("@/lib/services/registration/rekognition.service", () => ({
  createLivenessSession: async () => "liveness-session",
  getLivenessResults,
  compareFaces: async () => ({ isMatch: true, similarity: 99 }),
}));
vi.mock("@/lib/services/registration/citizen-photo.service", () => ({
  fetchCitizenPhoto: async () => Uint8Array.of(2),
}));
vi.mock("@/lib/utils/password", () => ({
  PASSWORD_MIN_LENGTH: 10,
  isPasswordStrongEnough: () => true,
  isBreachedPassword: async () => false,
}));

import { POST as finalize } from "@/app/api/registration/account/route";
import { POST as saveDraft } from "@/app/api/registration/account-draft/route";
import { POST as identify } from "@/app/api/registration/citizen/route";
import { POST as completeLiveness } from "@/app/api/registration/verification/liveness-complete/route";
import { POST as startLiveness } from "@/app/api/registration/verification/liveness-session/route";
import { getRegistrationWizardState } from "@/lib/services/registration/registration-flow.service";
import { getRegistrationSession } from "@/lib/services/registration/registration-session.service";

const identityId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const input = { email: "new@example.com", password: "StrongPassword123!" };
const identity = {
  id: identityId,
  schema_id: "citizen-schema",
  state: "active",
  traits: {
    username: "40214041176",
    email: "previous@example.com",
    phone: "test-phone",
    name: { first: "Prueba" },
  },
  metadata_admin: { accountReference: "original-reference" },
  metadata_public: { historyReference: "original-history" },
  external_id: "original-external-id",
};

function request(path: string, body: unknown) {
  return new Request(`http://localhost/api/registration/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function receiveCookies(response: NextResponse) {
  for (const cookie of response.cookies.getAll()) {
    if (cookie.maxAge === 0) requestCookies.delete(cookie.name);
    else requestCookies.set(cookie.name, cookie.value);
  }
}

async function startRecovery(cedula = "40214041176") {
  const response = await identify(
    request("citizen", {
      cedula,
      recoverAccess: true,
      recaptchaToken: "test-token",
    }),
  );
  expect(await response.json()).toMatchObject({
    success: true,
    recovery: true,
  });
  receiveCookies(response);
  expect(await getRegistrationSession()).toMatchObject({
    status: "identified",
    recovery: { identityId },
  });

  const draft = await saveDraft(request("account-draft", input));
  expect(await draft.json()).toMatchObject({ success: true });
  receiveCookies(draft);
  const liveness = await startLiveness(
    request("verification/liveness-session", {}),
  );
  expect(await liveness.json()).toMatchObject({
    success: true,
    sessionId: "liveness-session",
  });
  receiveCookies(liveness);
}

beforeEach(() => {
  vi.resetAllMocks();
  requestCookies.clear();
  vi.stubEnv("ORY_SDK_URL", "https://ory.example");
  vi.stubEnv("ORY_SDK_TOKEN", "test-token");
  vi.stubEnv("REGISTRATION_SESSION_SECRET", "test-secret");
  vi.stubEnv("CEDULA_VALIDATION_API", "https://validation.example/v3/cedulas");
  vi.stubEnv("NEXT_PUBLIC_LUHN_EXCEPTION_HASHES", "");
  validateRecaptchaToken.mockResolvedValue(true);
  listIdentities.mockResolvedValue({ data: [{ id: identityId }] });
  getIdentity.mockResolvedValue({ data: identity });
  updateIdentity.mockResolvedValue({
    data: {
      ...identity,
      traits: { ...identity.traits, email: input.email },
      verifiable_addresses: [
        { value: input.email, verified: false, via: "email" },
      ],
    },
  });
  listIdentitySessions.mockResolvedValue({ data: [], headers: {} });
  disableSession.mockResolvedValue({});
  createVerificationFlow.mockResolvedValue({
    data: { id: "verification-flow", ui: { nodes: [] } },
    headers: {},
  });
  updateVerificationFlow.mockResolvedValue({
    data: { id: "verification-flow", state: "sent_email", ui: { nodes: [] } },
    headers: {},
  });
  getLivenessResults.mockResolvedValue({
    confidence: 99,
    referenceImageBytes: Uint8Array.of(1),
    status: "SUCCEEDED",
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("account recovery in the registration wizard", () => {
  it("identifies and completes recovery for an API-confirmed non-Luhn cedula", async () => {
    const cedula = "12345678901";
    const target = {
      ...identity,
      traits: { ...identity.traits, username: cedula },
    };
    getIdentity.mockResolvedValue({ data: target });
    updateIdentity.mockResolvedValue({
      data: { ...target, traits: { ...target.traits, email: input.email } },
    });
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(Response.json({ valid: true }))
      .mockResolvedValueOnce(Response.json({ valid: true }));
    await startRecovery(cedula);
    const response = await completeLiveness(
      request("verification/liveness-complete", {
        sessionId: "liveness-session",
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      destination: "email-sent",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls.map(([url]) => String(url))).toEqual([
      `https://validation.example/v3/cedulas/${cedula}/validate`,
      `https://validation.example/v3/cedulas/${cedula}/validate`,
    ]);
    expect(updateIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        id: identityId,
        updateIdentityBody: expect.objectContaining({
          traits: { ...target.traits, email: input.email },
        }),
      }),
    );
    receiveCookies(response);
    expect(await getRegistrationSession()).toBeNull();
  });

  it("rejects reCAPTCHA before making any external exception lookup", async () => {
    validateRecaptchaToken.mockResolvedValueOnce(false);
    const fetchSpy = vi.spyOn(global, "fetch");
    const response = await identify(
      request("citizen", {
        cedula: "12345678901",
        recaptchaToken: "invalid",
      }),
    );
    expect(response.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(listIdentities).not.toHaveBeenCalled();
  });

  it("returns a retryable identification error when the validation API is unavailable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      Response.json({}, { status: 503 }),
    );
    const response = await identify(
      request("citizen", {
        cedula: "12345678901",
        recaptchaToken: "test-token",
      }),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      success: false,
      code: "cedula_validation_unavailable",
    });
    expect(response.cookies.getAll()).toHaveLength(0);
    expect(listIdentities).not.toHaveBeenCalled();
  });

  it("preserves the verified draft for an explicit retry when exception validation fails during finalization", async () => {
    const cedula = "12345678901";
    getIdentity.mockResolvedValue({
      data: { ...identity, traits: { ...identity.traits, username: cedula } },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(Response.json({ valid: true }))
      .mockResolvedValueOnce(Response.json({}, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ valid: true }));
    await startRecovery(cedula);
    const failed = await completeLiveness(
      request("verification/liveness-complete", {
        sessionId: "liveness-session",
      }),
    );
    expect(failed.status).toBe(503);
    expect(await failed.json()).toMatchObject({
      success: false,
      stage: "account",
      code: "cedula_validation_unavailable",
    });
    expect(updateIdentity).not.toHaveBeenCalled();
    receiveCookies(failed);
    expect(await getRegistrationSession()).toMatchObject({
      status: "verified",
      cedula,
    });
    expect(requestCookies.has("registration_account_draft")).toBe(true);
    const retried = await finalize(request("account", input));
    expect(retried.status).toBe(200);
    expect(await retried.json()).toMatchObject({
      success: true,
      destination: "email-sent",
    });
    expect(getLivenessResults).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("redirects to email verification when the sent-email response contains the code form", async () => {
    await startRecovery();
    updateVerificationFlow.mockResolvedValueOnce({
      data: {
        id: "verification-flow",
        state: "sent_email",
        ui: {
          action: "/self-service/verification?flow=verification-flow",
          method: "POST",
          messages: [{ id: 1080003, type: "info", text: "Check your email" }],
          nodes: [
            {
              type: "input",
              group: "code",
              attributes: { name: "code", type: "text" },
              messages: [],
            },
          ],
        },
      },
      headers: {
        "set-cookie": ["ory_verification=test-flow; Path=/; HttpOnly"],
      },
    });
    const response = await completeLiveness(
      request("verification/liveness-complete", {
        sessionId: "liveness-session",
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      destination: "email-sent",
      redirectTo: "/register/email-sent?flow=verification-flow",
    });
    expect(response.cookies.get("ory_verification")?.value).toBe("test-flow");
    receiveCookies(response);
    expect(await getRegistrationSession()).toBeNull();
    expect(requestCookies.has("registration_account_draft")).toBe(false);
  });

  it.each([
    "flow",
    "node",
  ])("keeps the verified draft when Ory reports a %s validation error", async (location) => {
    await startRecovery();
    const messages = [{ id: 4000001, type: "error", text: "Invalid email" }];
    updateVerificationFlow.mockResolvedValueOnce({
      data: {
        id: "verification-flow",
        state: "choose_method",
        ui: {
          messages: location === "flow" ? messages : [],
          nodes: location === "node" ? [{ messages }] : [],
        },
      },
      headers: {},
    });
    const response = await completeLiveness(
      request("verification/liveness-complete", {
        sessionId: "liveness-session",
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      stage: "account",
      code: "ory_validation_error",
    });
    receiveCookies(response);
    expect(await getRegistrationSession()).toMatchObject({
      status: "verified",
      recovery: { identityId },
    });
    expect(requestCookies.has("registration_account_draft")).toBe(true);
  });

  it.each([
    [],
    null,
  ])("finishes when an empty session list includes relative next-page links", async (data) => {
    await startRecovery();
    listIdentitySessions.mockResolvedValueOnce({
      data,
      headers: {
        link: '</admin/identities/target/sessions?active=true&page=2&per_page=250&page_token=>; rel="next"',
      },
    });
    const response = await completeLiveness(
      request("verification/liveness-complete", {
        sessionId: "liveness-session",
      }),
    );
    expect(await response.json()).toMatchObject({
      success: true,
      destination: "email-sent",
    });
    expect(listIdentitySessions).toHaveBeenCalledTimes(1);
    expect(disableSession).not.toHaveBeenCalled();
  });

  it("reads all relative offset pages before deactivating sessions", async () => {
    await startRecovery();
    listIdentitySessions
      .mockResolvedValueOnce({
        data: [{ id: "session-a" }],
        headers: {
          link: '</admin/identities/target/sessions?page=2&per_page=1&page_token=>; rel="next"',
        },
      })
      .mockResolvedValueOnce({
        data: [{ id: "session-b" }],
        headers: {
          link: '</admin/identities/target/sessions?page=3&per_page=1&page_token=>; rel="next"',
        },
      })
      .mockResolvedValueOnce({
        data: [],
        headers: {
          link: '</admin/identities/target/sessions?page=4&per_page=1&page_token=>; rel="next"',
        },
      });
    const response = await completeLiveness(
      request("verification/liveness-complete", {
        sessionId: "liveness-session",
      }),
    );
    expect(await response.json()).toMatchObject({
      success: true,
      destination: "email-sent",
    });
    expect(listIdentitySessions).toHaveBeenNthCalledWith(2, {
      id: identityId,
      active: true,
      page: 2,
      perPage: 1,
    });
    expect(listIdentitySessions).toHaveBeenCalledTimes(3);
    expect(disableSession.mock.calls).toEqual([
      [{ id: "session-a" }],
      [{ id: "session-b" }],
    ]);
    expect(
      Math.max(...listIdentitySessions.mock.invocationCallOrder),
    ).toBeLessThan(Math.min(...disableSession.mock.invocationCallOrder));
  });

  it("disables active sessions across pages and tolerates a concurrently removed session", async () => {
    await startRecovery();
    listIdentitySessions
      .mockResolvedValueOnce({
        data: [{ id: "session-a" }],
        headers: {
          link: '<https://ory.example/admin/identities/target/sessions?page_token=next-page>; rel="next"',
        },
      })
      .mockResolvedValueOnce({ data: [{ id: "session-b" }], headers: {} });
    disableSession.mockRejectedValueOnce({ response: { status: 404 } });
    const response = await completeLiveness(
      request("verification/liveness-complete", {
        sessionId: "liveness-session",
      }),
    );
    expect(await response.json()).toMatchObject({
      success: true,
      destination: "email-sent",
    });
    expect(listIdentitySessions).toHaveBeenNthCalledWith(2, {
      id: identityId,
      active: true,
      pageSize: 250,
      pageToken: "next-page",
    });
    expect(disableSession.mock.calls).toEqual([
      [{ id: "session-a" }],
      [{ id: "session-b" }],
    ]);
  });

  it.each([
    "listing",
    "revocation",
  ])("reports updated credentials and retains the verified recovery when session %s fails", async (operation) => {
    await startRecovery();
    if (operation === "listing") {
      listIdentitySessions.mockRejectedValueOnce({ response: { status: 404 } });
    } else {
      listIdentitySessions.mockResolvedValueOnce({
        data: [{ id: "session-a" }, { id: "session-b" }],
        headers: {},
      });
      disableSession
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce({ response: { status: 503 } });
    }
    const failed = await completeLiveness(
      request("verification/liveness-complete", {
        sessionId: "liveness-session",
      }),
    );
    expect(await failed.json()).toMatchObject({
      success: false,
      stage: "account",
      code: "recovery_sessions_revocation_failed",
    });
    expect(failed.status).toBe(502);
    expect(updateIdentity).toHaveBeenCalledTimes(1);
    expect(updateVerificationFlow).not.toHaveBeenCalled();
    receiveCookies(failed);
    expect(await getRegistrationSession()).toMatchObject({
      status: "verified",
      recovery: { identityId },
    });
    expect(requestCookies.has("registration_account_draft")).toBe(true);
  });
  it("updates credentials after biometric verification and retains the identity and its data", async () => {
    const existing = await identify(
      request("citizen", {
        cedula: "40214041176",
        recaptchaToken: "test-token",
      }),
    );
    expect(await existing.json()).toMatchObject({
      success: false,
      code: "identity_exists",
    });
    expect(existing.cookies.getAll()).toHaveLength(0);
    await startRecovery();
    expect(updateIdentity).not.toHaveBeenCalled();
    expect(await getRegistrationWizardState()).toMatchObject({
      initialRecoveryMode: true,
      initialStep: 1,
    });

    const response = await completeLiveness(
      request("verification/liveness-complete", {
        sessionId: "liveness-session",
      }),
    );
    expect(await response.json()).toMatchObject({
      success: true,
      destination: "email-sent",
    });
    expect(updateIdentity).toHaveBeenCalledWith({
      id: identityId,
      updateIdentityBody: expect.objectContaining({
        schema_id: identity.schema_id,
        state: "active",
        traits: { ...identity.traits, email: input.email },
        credentials: { password: { config: { password: input.password } } },
        metadata_admin: identity.metadata_admin,
        metadata_public: identity.metadata_public,
        external_id: identity.external_id,
      }),
    });
    expect(listIdentitySessions).toHaveBeenCalledWith({
      id: identityId,
      active: true,
      pageSize: 250,
      pageToken: undefined,
    });
    expect(disableSession).not.toHaveBeenCalled();
    expect(createRegistrationFlow).not.toHaveBeenCalled();
    expect(updateRegistrationFlow).not.toHaveBeenCalled();
    expect(updateVerificationFlow).toHaveBeenCalledWith(
      expect.objectContaining({
        updateVerificationFlowBody: expect.objectContaining({
          email: input.email,
        }),
      }),
      expect.anything(),
    );
    receiveCookies(response);
    expect(await getRegistrationSession()).toBeNull();
    expect(requestCookies.has("registration_account_draft")).toBe(false);
  });

  it("requires a fresh human verification and an existing unique identity", async () => {
    validateRecaptchaToken.mockResolvedValueOnce(false);
    const rejected = await identify(
      request("citizen", {
        cedula: "40214041176",
        recoverAccess: true,
        recaptchaToken: "invalid",
      }),
    );
    expect(rejected.status).toBe(403);
    expect(listIdentities).not.toHaveBeenCalled();
    listIdentities.mockResolvedValueOnce({ data: [] });
    const missing = await identify(
      request("citizen", {
        cedula: "40214041176",
        recoverAccess: true,
        recaptchaToken: "test-token",
      }),
    );
    expect(await missing.json()).toMatchObject({
      success: false,
      code: "recovery_not_found",
    });
    expect(missing.cookies.getAll()).toHaveLength(0);
    expect(updateIdentity).not.toHaveBeenCalled();
  });

  it("rejects finalization before biometrics and keeps the previous account on a failed face check", async () => {
    await startRecovery();
    const premature = await finalize(request("account", input));
    expect(await premature.json()).toMatchObject({
      success: false,
      code: "verification_required",
    });
    getLivenessResults.mockResolvedValueOnce({
      confidence: 0,
      referenceImageBytes: null,
    });
    const response = await completeLiveness(
      request("verification/liveness-complete", {
        sessionId: "liveness-session",
      }),
    );
    expect(await response.json()).toMatchObject({
      success: false,
      stage: "verification",
      code: "liveness_check_failed",
    });
    expect(updateIdentity).not.toHaveBeenCalled();
    expect(listIdentitySessions).not.toHaveBeenCalled();
  });

  it.each([
    { ...identity, traits: { username: "00100063362" } },
    { ...identity, state: "inactive" },
  ])("rejects a mismatched or inactive target identity", async (target) => {
    await startRecovery();
    getIdentity.mockResolvedValueOnce({
      data: target,
    });
    const response = await completeLiveness(
      request("verification/liveness-complete", {
        sessionId: "liveness-session",
      }),
    );
    expect(await response.json()).toMatchObject({
      success: false,
      stage: "account",
      code: "recovery_not_found",
    });
    expect(updateIdentity).not.toHaveBeenCalled();
  });

  it("maps duplicate identifiers from Ory's HTTP 400 and redacts the diagnostic", async () => {
    await startRecovery();
    const diagnostic = vi.spyOn(console, "error").mockImplementation(() => {});
    updateIdentity.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          error: {
            id: "validation_error",
            reason: `Identifier already exists for ${input.email}; password ${input.password}; citizen ${identity.traits.username}`,
          },
        },
      },
      config: { headers: { Authorization: "secret-access-token" } },
    });
    const response = await completeLiveness(
      request("verification/liveness-complete", {
        sessionId: "liveness-session",
      }),
    );
    expect(await response.json()).toMatchObject({
      success: false,
      code: "identity_exists",
      fieldErrors: { email: "identities.messages.4000007" },
    });
    const logged = JSON.stringify(diagnostic.mock.calls);
    expect(logged).toContain("credentials_update");
    expect(logged).not.toContain(input.email);
    expect(logged).not.toContain(input.password);
    expect(logged).not.toContain(identity.traits.username);
    expect(logged).not.toContain("secret-access-token");
    diagnostic.mockRestore();
  });

  it.each([
    [409, "identity_exists"],
    [400, "ory_validation_error"],
    [503, "recovery_failed"],
  ])("returns a stable error when Ory rejects credential updates with %i", async (status, code) => {
    await startRecovery();
    updateIdentity.mockRejectedValueOnce({ response: { status } });
    const response = await completeLiveness(
      request("verification/liveness-complete", {
        sessionId: "liveness-session",
      }),
    );
    expect(await response.json()).toMatchObject({
      success: false,
      stage: "account",
      code,
    });
    expect(listIdentitySessions).not.toHaveBeenCalled();
    expect(createRegistrationFlow).not.toHaveBeenCalled();
  });

  it("retains a verified recovery session for retry if email delivery fails after the update", async () => {
    await startRecovery();
    updateVerificationFlow.mockResolvedValueOnce({
      data: {
        error: { id: "service_unavailable", message: "Test delivery failure" },
      },
      headers: {},
    });
    const failed = await completeLiveness(
      request("verification/liveness-complete", {
        sessionId: "liveness-session",
      }),
    );
    expect((await failed.json()).success).toBe(false);
    receiveCookies(failed);
    expect(await getRegistrationSession()).toMatchObject({
      status: "verified",
      recovery: { identityId },
    });
    expect(requestCookies.has("registration_account_draft")).toBe(true);

    const retried = await finalize(request("account", input));
    expect(await retried.json()).toMatchObject({
      success: true,
      destination: "email-sent",
    });
    expect(updateIdentity).toHaveBeenCalledTimes(2);
    expect(getLivenessResults).toHaveBeenCalledTimes(1);
    expect(createRegistrationFlow).not.toHaveBeenCalled();
  });
});
