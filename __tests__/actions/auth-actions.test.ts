import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetT,
  mockUpdateVerificationFlow,
  mockCreateOryClient,
} = vi.hoisted(() => {
  const updateVerificationFlow = vi.fn();

  return {
    mockGetT: vi.fn(),
    mockUpdateVerificationFlow: updateVerificationFlow,
    mockCreateOryClient: vi.fn(() => ({
      updateVerificationFlow,
    })),
  };
});

vi.mock("@/lib/i18n/server", () => ({
  getT: mockGetT,
}));

vi.mock("@/lib/ory/client", () => ({
  createOryClient: mockCreateOryClient,
}));

import {
  verifyCodeAction,
  type VerifyCodeState,
} from "@/app/(auth)/register/email-sent/actions";

function createTranslator() {
  return (key: string) => `translated:${key}`;
}

function createFormData(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

describe("verifyCodeAction", () => {
  const previousState: VerifyCodeState = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetT.mockResolvedValue(createTranslator());
  });

  it("returns a translated error when flow is missing", async () => {
    const result = await verifyCodeAction(
      previousState,
      createFormData({ code: "123456" }),
    );

    expect(result).toEqual({ error: "translated:error_missing_data" });
    expect(mockCreateOryClient).not.toHaveBeenCalled();
  });

  it("returns a translated error when the code length is invalid", async () => {
    const result = await verifyCodeAction(
      previousState,
      createFormData({ flow: "flow-id", code: "123" }),
    );

    expect(result).toEqual({ error: "translated:error_code_length" });
    expect(mockCreateOryClient).not.toHaveBeenCalled();
  });

  it("rejects codes longer than six digits", async () => {
    const result = await verifyCodeAction(
      previousState,
      createFormData({ flow: "flow-id", code: "1234567" }),
    );

    expect(result).toEqual({ error: "translated:error_code_length" });
    expect(mockCreateOryClient).not.toHaveBeenCalled();
  });

  it("returns success when Ory passes the challenge", async () => {
    mockUpdateVerificationFlow.mockResolvedValueOnce({
      data: { state: "passed_challenge" },
    });

    const result = await verifyCodeAction(
      previousState,
      createFormData({ flow: "flow-id", code: "123456" }),
    );

    expect(mockUpdateVerificationFlow).toHaveBeenCalledWith({
      flow: "flow-id",
      updateVerificationFlowBody: {
        method: "code",
        code: "123456",
      },
    });
    expect(result).toEqual({ success: true });
  });

  it("returns a translated invalid-code error when Ory does not pass the challenge", async () => {
    mockUpdateVerificationFlow.mockResolvedValueOnce({
      data: { state: "choose_method" },
    });

    const result = await verifyCodeAction(
      previousState,
      createFormData({ flow: "flow-id", code: "123456" }),
    );

    expect(result).toEqual({ error: "translated:error_invalid_code" });
  });

  it("surfaces Ory UI messages when present", async () => {
    mockUpdateVerificationFlow.mockRejectedValueOnce({
      response: {
        data: {
          ui: {
            messages: [{ text: "The verification code is incorrect" }],
          },
        },
      },
    });

    const result = await verifyCodeAction(
      previousState,
      createFormData({ flow: "flow-id", code: "123456" }),
    );

    expect(result).toEqual({ error: "The verification code is incorrect" });
  });

  it("uses the first Ory UI message when multiple messages are returned", async () => {
    mockUpdateVerificationFlow.mockRejectedValueOnce({
      response: {
        data: {
          ui: {
            messages: [
              { text: "First error" },
              { text: "Second error" },
            ],
          },
        },
      },
    });

    const result = await verifyCodeAction(
      previousState,
      createFormData({ flow: "flow-id", code: "123456" }),
    );

    expect(result).toEqual({ error: "First error" });
  });

  it("falls back to the translated expired-code error when Ory returns no UI messages", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockUpdateVerificationFlow.mockRejectedValueOnce({
      response: {
        data: {
          ui: {
            messages: [],
          },
        },
      },
    });

    const result = await verifyCodeAction(
      previousState,
      createFormData({ flow: "flow-id", code: "123456" }),
    );

    expect(result).toEqual({ error: "translated:error_expired_code" });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("falls back to the translated expired-code error on unexpected failures", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockUpdateVerificationFlow.mockRejectedValueOnce(new Error("boom"));

    const result = await verifyCodeAction(
      previousState,
      createFormData({ flow: "flow-id", code: "123456" }),
    );

    expect(result).toEqual({ error: "translated:error_expired_code" });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
