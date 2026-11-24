import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockValidateRecaptchaToken } = vi.hoisted(() => ({
  mockValidateRecaptchaToken: vi.fn(),
}));

vi.mock("@/lib/services/recaptcha/recaptcha.service", () => ({
  validateRecaptchaToken: mockValidateRecaptchaToken,
}));

import { POST } from "@/app/api/security/recaptcha/route";
import {
  RECAPTCHA_PROOF_COOKIE,
  RECOVERY_RECAPTCHA_ACTION,
} from "@/lib/security/recaptcha-proof-core";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.REGISTRATION_SESSION_SECRET = "test-registration-secret";
});

describe("POST /api/security/recaptcha", () => {
  it("sets a short-lived HttpOnly proof after validation", async () => {
    mockValidateRecaptchaToken.mockResolvedValueOnce(true);

    const response = await POST(
      new Request("http://localhost/api/security/recaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "recaptcha-token",
          action: RECOVERY_RECAPTCHA_ACTION,
        }),
      }),
    );

    expect(mockValidateRecaptchaToken).toHaveBeenCalledWith(
      "recaptcha-token",
      RECOVERY_RECAPTCHA_ACTION,
    );
    expect(response.status).toBe(200);
    expect(response.cookies.get(RECAPTCHA_PROOF_COOKIE)?.value).toBeTruthy();
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=strict");
  });

  it("does not issue a proof when Google rejects the token", async () => {
    mockValidateRecaptchaToken.mockResolvedValueOnce(false);

    const response = await POST(
      new Request("http://localhost/api/security/recaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "rejected-token",
          action: RECOVERY_RECAPTCHA_ACTION,
        }),
      }),
    );

    expect(response.status).toBe(403);
    expect(response.cookies.get(RECAPTCHA_PROOF_COOKIE)).toBeUndefined();
  });
});
