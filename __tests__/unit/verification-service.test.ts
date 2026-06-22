import { beforeEach, describe, expect, it, vi } from "vitest";
import { API } from "@/lib/constants/api";
import { verificationService } from "@/lib/services/registration/verification.service";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("verificationService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("createLivenessSession", () => {
    it("returns sessionId on success", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        jsonResponse({
          success: true,
          sessionId: "liveness-session-123",
        }),
      );

      const result = await verificationService.createLivenessSession();

      expect(result).toEqual({
        success: true,
        sessionId: "liveness-session-123",
      });
    });

    it("sends the correct request shape", async () => {
      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockResolvedValueOnce(
          jsonResponse({ success: true, sessionId: "liveness-session-123" }),
        );

      await verificationService.createLivenessSession();

      expect(fetchSpy).toHaveBeenCalledWith(
        API.registrationLivenessSession,
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        }),
      );
    });

    it("returns unexpected_error when JSON parsing fails", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response("invalid json", { status: 200 }),
      );

      const result = await verificationService.createLivenessSession();

      expect(result).toEqual({
        success: false,
        code: "unexpected_error",
      });
    });

    it("returns unexpected_error when fetch throws", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("offline"));

      const result = await verificationService.createLivenessSession();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        code: "unexpected_error",
      });
    });

    it("preserves verified-session errors from the API", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        jsonResponse(
          {
            success: false,
            code: "verification_already_completed",
          },
          409,
        ),
      );

      const result = await verificationService.createLivenessSession();

      expect(result).toEqual({
        success: false,
        code: "verification_already_completed",
      });
    });
  });

  describe("verifyLiveness", () => {
    it("returns confidence and similarity on success", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        jsonResponse({
          success: true,
          confidence: 99.5,
          similarity: 98.2,
        }),
      );

      const result = await verificationService.verifyLiveness("session-abc");

      expect(result).toEqual({
        success: true,
        confidence: 99.5,
        similarity: 98.2,
      });
    });

    it("sends the correct request shape with sessionId in body", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
        jsonResponse({
          success: true,
          confidence: 99.5,
          similarity: 98.2,
        }),
      );

      await verificationService.verifyLiveness("session-abc");

      expect(fetchSpy).toHaveBeenCalledWith(
        API.registrationLivenessResult,
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: "session-abc" }),
        }),
      );
    });

    it("returns unexpected_error when JSON parsing fails", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response("invalid json", { status: 200 }),
      );

      const result = await verificationService.verifyLiveness("session-abc");

      expect(result).toEqual({
        success: false,
        code: "unexpected_error",
      });
    });

    it("returns unexpected_error when fetch throws", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("offline"));

      const result = await verificationService.verifyLiveness("session-abc");

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        code: "unexpected_error",
      });
    });

    it("returns error response from the API", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        jsonResponse(
          {
            success: false,
            code: "liveness_check_failed",
          },
          422,
        ),
      );

      const result = await verificationService.verifyLiveness("session-abc");

      expect(result).toEqual({
        success: false,
        code: "liveness_check_failed",
      });
    });

    it("preserves completed verification errors from the API", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        jsonResponse(
          {
            success: false,
            code: "verification_already_completed",
          },
          409,
        ),
      );

      const result = await verificationService.verifyLiveness("session-abc");

      expect(result).toEqual({
        success: false,
        code: "verification_already_completed",
      });
    });
  });

  describe("completeLivenessRegistration", () => {
    it("returns the account redirect destination on success", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        jsonResponse({
          success: true,
          confidence: 99,
          similarity: 96,
          destination: "email-sent",
          redirectTo: "/register/email-sent?flow=flow-123",
        }),
      );

      const result =
        await verificationService.completeLivenessRegistration("session-abc");

      expect(result).toEqual({
        success: true,
        confidence: 99,
        similarity: 96,
        destination: "email-sent",
        redirectTo: "/register/email-sent?flow=flow-123",
      });
    });

    it("sends the correct request shape with sessionId in body", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
        jsonResponse({
          success: true,
          confidence: 99,
          similarity: 96,
          destination: "email-sent",
          redirectTo: "/register/email-sent?flow=flow-123",
        }),
      );

      await verificationService.completeLivenessRegistration("session-abc");

      expect(fetchSpy).toHaveBeenCalledWith(
        API.registrationLivenessComplete,
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: "session-abc" }),
        }),
      );
    });

    it("returns verification unexpected_error when parsing fails", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response("invalid json", { status: 200 }),
      );

      const result =
        await verificationService.completeLivenessRegistration("session-abc");

      expect(result).toEqual({
        success: false,
        stage: "verification",
        code: "unexpected_error",
      });
    });

    it("returns account-stage errors from the API", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        jsonResponse(
          {
            success: false,
            stage: "account",
            code: "identity_exists",
            fieldErrors: { email: "identities.messages.4000007" },
          },
          409,
        ),
      );

      const result =
        await verificationService.completeLivenessRegistration("session-abc");

      expect(result).toEqual({
        success: false,
        stage: "account",
        code: "identity_exists",
        fieldErrors: { email: "identities.messages.4000007" },
      });
    });

    it("preserves completed verification errors from the API", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        jsonResponse(
          {
            success: false,
            stage: "verification",
            code: "verification_already_completed",
          },
          409,
        ),
      );

      const result =
        await verificationService.completeLivenessRegistration("session-abc");

      expect(result).toEqual({
        success: false,
        stage: "verification",
        code: "verification_already_completed",
      });
    });
  });
});
