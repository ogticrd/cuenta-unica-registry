import { describe, expect, it } from "vitest";
import {
  RECOVERY_RECAPTCHA_ACTION,
  serializeRecaptchaProof,
  validateRecaptchaProof,
} from "@/lib/security/recaptcha-proof-core";

describe("reCAPTCHA proof", () => {
  it("accepts a signed proof for the expected action", async () => {
    const now = Date.now();
    const proof = await serializeRecaptchaProof(
      RECOVERY_RECAPTCHA_ACTION,
      "test-secret",
      now,
    );

    await expect(
      validateRecaptchaProof(
        proof,
        RECOVERY_RECAPTCHA_ACTION,
        "test-secret",
        now + 1_000,
      ),
    ).resolves.toBe(true);
  });

  it("rejects tampered, expired, and wrong-action proofs", async () => {
    const now = Date.now();
    const proof = await serializeRecaptchaProof(
      RECOVERY_RECAPTCHA_ACTION,
      "test-secret",
      now,
    );
    const tampered = `${proof.slice(0, -1)}${proof.endsWith("a") ? "b" : "a"}`;

    await expect(
      validateRecaptchaProof(
        tampered,
        RECOVERY_RECAPTCHA_ACTION,
        "test-secret",
        now,
      ),
    ).resolves.toBe(false);
    await expect(
      validateRecaptchaProof(proof, "form_submit", "test-secret", now),
    ).resolves.toBe(false);
    await expect(
      validateRecaptchaProof(
        proof,
        RECOVERY_RECAPTCHA_ACTION,
        "test-secret",
        now + 120_001,
      ),
    ).resolves.toBe(false);
  });
});
