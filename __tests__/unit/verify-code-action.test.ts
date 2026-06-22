import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateOryClient, mockGetServerCookies, mockGetT, mockUpdateFlow } =
  vi.hoisted(() => ({
    mockCreateOryClient: vi.fn(),
    mockGetServerCookies: vi.fn(),
    mockGetT: vi.fn(),
    mockUpdateFlow: vi.fn(),
  }));

vi.mock("@/lib/i18n/server", () => ({
  getT: mockGetT,
}));

vi.mock("@/lib/ory/client", () => ({
  createOryClient: mockCreateOryClient,
}));

vi.mock("@/lib/ory/cookies", () => ({
  getServerCookies: mockGetServerCookies,
}));

import { verifyCodeAction } from "@/app/(auth)/register/email-sent/actions";

describe("verifyCodeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetT.mockResolvedValue((key: string) => key);
    mockGetServerCookies.mockResolvedValue("ory_verification=verification");
    mockCreateOryClient.mockReturnValue({
      updateVerificationFlow: mockUpdateFlow,
    });
    mockUpdateFlow.mockResolvedValue({
      data: {
        state: "passed_challenge",
      },
    });
  });

  it("forwards browser cookies when submitting the verification code to Ory", async () => {
    const formData = new FormData();
    formData.set("flow", "verification-flow-123");
    formData.set("code", "123456");

    await expect(verifyCodeAction({}, formData)).resolves.toEqual({
      success: true,
    });

    expect(mockUpdateFlow).toHaveBeenCalledWith({
      flow: "verification-flow-123",
      cookie: "ory_verification=verification",
      updateVerificationFlowBody: {
        method: "code",
        code: "123456",
      },
    });
  });

  it("returns a stable code when required form data is missing", async () => {
    const formData = new FormData();
    formData.set("flow", "verification-flow-123");

    await expect(verifyCodeAction({}, formData)).resolves.toEqual({
      code: "missing_data",
      error: "error_missing_data",
    });
    expect(mockUpdateFlow).not.toHaveBeenCalled();
  });

  it("returns a stable code when the verification code length is invalid", async () => {
    const formData = new FormData();
    formData.set("flow", "verification-flow-123");
    formData.set("code", "12345");

    await expect(verifyCodeAction({}, formData)).resolves.toEqual({
      code: "invalid_code_length",
      error: "error_code_length",
    });
    expect(mockUpdateFlow).not.toHaveBeenCalled();
  });

  it("returns invalid_code when Ory does not pass the challenge", async () => {
    mockUpdateFlow.mockResolvedValueOnce({
      data: {
        state: "sent_email",
      },
    });
    const formData = new FormData();
    formData.set("flow", "verification-flow-123");
    formData.set("code", "123456");

    await expect(verifyCodeAction({}, formData)).resolves.toEqual({
      code: "invalid_code",
      error: "error_invalid_code",
    });
  });

  it("preserves Ory verification messages with a stable error code", async () => {
    mockUpdateFlow.mockRejectedValueOnce({
      response: {
        data: {
          ui: {
            messages: [{ text: "The verification code is invalid." }],
          },
        },
      },
    });
    const formData = new FormData();
    formData.set("flow", "verification-flow-123");
    formData.set("code", "123456");

    await expect(verifyCodeAction({}, formData)).resolves.toEqual({
      code: "ory_verification_error",
      error: "The verification code is invalid.",
    });
  });

  it("returns expired_code for unexpected Ory errors", async () => {
    mockUpdateFlow.mockRejectedValueOnce(new Error("network unavailable"));
    const formData = new FormData();
    formData.set("flow", "verification-flow-123");
    formData.set("code", "123456");

    await expect(verifyCodeAction({}, formData)).resolves.toEqual({
      code: "expired_code",
      error: "error_expired_code",
    });
  });
});
