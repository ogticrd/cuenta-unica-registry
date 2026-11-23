import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { validateRecaptchaToken } from "@/lib/services/recaptcha/recaptcha.service";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv("RECAPTCHA_PROJECT_ID", "project-id");
  vi.stubEnv("RECAPTCHA_API_KEY", "api-key");
  vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY", "site-key");
});

describe("validateRecaptchaToken", () => {
  it("accepts a valid assessment at the v1 score threshold", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          tokenProperties: { valid: true, action: "form_submit" },
          riskAnalysis: { score: 0.3 },
        }),
        { status: 200 },
      ),
    );

    await expect(validateRecaptchaToken("token-123")).resolves.toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("projects/project-id/assessments"),
      }),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          event: {
            token: "token-123",
            siteKey: "site-key",
            expectedAction: "form_submit",
          },
        }),
      }),
    );
  });

  it("rejects low scores and mismatched actions", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            tokenProperties: { valid: true, action: "form_submit" },
            riskAnalysis: { score: 0.29 },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            tokenProperties: { valid: true, action: "different_action" },
            riskAnalysis: { score: 0.9 },
          }),
          { status: 200 },
        ),
      );

    await expect(validateRecaptchaToken("low-score")).resolves.toBe(false);
    await expect(validateRecaptchaToken("wrong-action")).resolves.toBe(false);
  });

  it("fails closed when the assessment service is unavailable", async () => {
    const stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("offline"));

    await expect(validateRecaptchaToken("token-123")).resolves.toBe(false);
    expect(stdoutSpy).toHaveBeenCalled();
  });

  it("supports the explicit local-only bypass", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RECAPTCHA_BYPASS_LOCAL", "true");
    const fetchSpy = vi.spyOn(global, "fetch");

    await expect(validateRecaptchaToken(undefined)).resolves.toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
