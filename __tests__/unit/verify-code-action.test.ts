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
});
