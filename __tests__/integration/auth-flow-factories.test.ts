import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockHeaders,
  mockGetFlowFactory,
  mockGetRegistrationFlowRaw,
  mockGetRecoveryFlowRaw,
  mockGetVerificationFlowRaw,
  mockGetSettingsFlowRaw,
} = vi.hoisted(() => ({
  mockHeaders: vi.fn(),
  mockGetFlowFactory: vi.fn(),
  mockGetRegistrationFlowRaw: vi.fn(),
  mockGetRecoveryFlowRaw: vi.fn(),
  mockGetVerificationFlowRaw: vi.fn(),
  mockGetSettingsFlowRaw: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
  headers: mockHeaders,
}));

vi.mock("server-only", () => ({}));

vi.mock("@ory/client-fetch", () => ({
  Configuration: class Configuration {},
  FlowType: {
    Login: "login",
    Registration: "registration",
    Recovery: "recovery",
    Verification: "verification",
    Settings: "settings",
  },
  FrontendApi: class FrontendApi {
    getRegistrationFlowRaw(...args: unknown[]) {
      return mockGetRegistrationFlowRaw(...args);
    }

    getRecoveryFlowRaw(...args: unknown[]) {
      return mockGetRecoveryFlowRaw(...args);
    }

    getVerificationFlowRaw(...args: unknown[]) {
      return mockGetVerificationFlowRaw(...args);
    }

    getSettingsFlowRaw(...args: unknown[]) {
      return mockGetSettingsFlowRaw(...args);
    }
  },
}));

vi.mock("@ory/nextjs/app", () => ({
  getFlowFactory: mockGetFlowFactory,
  getOryConfig: vi.fn(),
}));

import {
  getRecoveryFlow,
  getRegistrationFlow,
  getSettingsFlow,
  getVerificationFlow,
} from "@/lib/ory/flow";
import { getOryConfig } from "@/ory.config";

const config = getOryConfig();

beforeEach(() => {
  vi.clearAllMocks();
  mockHeaders.mockResolvedValue(
    new Headers({
      host: "cuentaunica.gob.do",
      "x-forwarded-proto": "https",
    }),
  );
  mockGetFlowFactory.mockResolvedValue({
    flow: { id: "flow-123" },
  });
});

describe("auth flow factories", () => {
  it("builds the registration flow with a default return_to and optional cookie", async () => {
    const params = Promise.resolve({ flow: "registration-flow-123" });

    await getRegistrationFlow(config, params);

    expect(mockGetFlowFactory).toHaveBeenCalledWith(
      {
        flow: "registration-flow-123",
        return_to: "https://cuentaunica.gob.do/",
      },
      expect.any(Function),
      "registration",
      "https://cuentaunica.gob.do",
      "/register",
    );

    const createFlowFn = mockGetFlowFactory.mock.calls[0][1];
    mockGetRegistrationFlowRaw.mockResolvedValueOnce({ ok: true });

    await createFlowFn();

    expect(mockGetRegistrationFlowRaw).toHaveBeenCalledWith(
      {
        id: "registration-flow-123",
        cookie: undefined,
      },
      { cache: "no-cache" },
    );
  });

  it("preserves explicit return_to for recovery flows", async () => {
    const params = Promise.resolve({
      flow: "recovery-flow-123",
      return_to: "https://cuentaunica.gob.do/recovery/done",
    });

    await getRecoveryFlow(config, params);

    expect(mockGetFlowFactory).toHaveBeenCalledWith(
      {
        flow: "recovery-flow-123",
        return_to: "https://cuentaunica.gob.do/recovery/done",
      },
      expect.any(Function),
      "recovery",
      "https://cuentaunica.gob.do",
      "/recovery",
    );
  });

  it("forwards the browser cookie into verification flows", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        host: "cuentaunica.gob.do",
        "x-forwarded-proto": "https",
        cookie: "ory_session=session-123; csrf_token=csrf-456",
      }),
    );

    await getVerificationFlow(config, Promise.resolve({ flow: "verify-123" }));

    const createFlowFn = mockGetFlowFactory.mock.calls[0][1];
    mockGetVerificationFlowRaw.mockResolvedValueOnce({ ok: true });

    await createFlowFn();

    expect(mockGetVerificationFlowRaw).toHaveBeenCalledWith(
      {
        id: "verify-123",
        cookie: "ory_session=session-123; csrf_token=csrf-456",
      },
      { cache: "no-cache" },
    );
  });

  it("uses the settings UI URL from config", async () => {
    await getSettingsFlow(config, Promise.resolve({ flow: "settings-123" }));

    expect(mockGetFlowFactory).toHaveBeenCalledWith(
      {
        flow: "settings-123",
        return_to: "https://cuentaunica.gob.do/",
      },
      expect.any(Function),
      "settings",
      "https://cuentaunica.gob.do",
      "/settings",
    );
  });
});
