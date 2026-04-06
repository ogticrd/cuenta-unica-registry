import { beforeEach, describe, expect, it, vi } from "vitest";
import { API } from "@/lib/constants/api";
import { accountService } from "@/lib/services/registration/account.service";
import { registrationSessionApiService } from "@/lib/services/registration/registration-session-api.service";
import { verificationService } from "@/lib/services/registration/verification.service";

describe("registration services", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts account data to the real registration account endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          destination: "login",
          redirectTo: "/login",
        }),
    } as Response);

    const result = await accountService.registerAccount({
      email: "user@example.com",
      password: "Password123!",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      API.registrationAccount,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "Password123!",
        }),
      }),
    );
    expect(result).toEqual({
      success: true,
      destination: "login",
      redirectTo: "/login",
    });
  });

  it("returns unexpected_error when account registration JSON is invalid", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: () => Promise.reject(new Error("invalid json")),
    } as Response);

    const result = await accountService.registerAccount({
      email: "user@example.com",
      password: "Password123!",
    });

    expect(result).toEqual({
      success: false,
      code: "unexpected_error",
    });
  });

  it("returns unexpected_error when account registration fetch fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("offline"));

    const result = await accountService.registerAccount({
      email: "user@example.com",
      password: "Password123!",
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      code: "unexpected_error",
    });
  });

  it("creates a liveness session through the real verification service", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          sessionId: "session-123",
        }),
    } as Response);

    const result = await verificationService.createLivenessSession();

    expect(fetchSpy).toHaveBeenCalledWith(
      API.registrationLivenessSession,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
    expect(result).toEqual({
      success: true,
      sessionId: "session-123",
    });
  });

  it("posts the liveness session id when verifying", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    } as Response);

    const result = await verificationService.verifyLiveness("session-123");

    expect(fetchSpy).toHaveBeenCalledWith(
      API.registrationLivenessResult,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "session-123" }),
      }),
    );
    expect(result).toEqual({ success: true });
  });

  it("returns unexpected_error when liveness session JSON is invalid", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: () => Promise.reject(new Error("invalid json")),
    } as Response);

    const result = await verificationService.createLivenessSession();

    expect(result).toEqual({
      success: false,
      code: "unexpected_error",
    });
  });

  it("returns unexpected_error when liveness verification JSON is invalid", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: () => Promise.reject(new Error("invalid json")),
    } as Response);

    const result = await verificationService.verifyLiveness("session-123");

    expect(result).toEqual({
      success: false,
      code: "unexpected_error",
    });
  });

  it("returns unexpected_error when liveness verification fetch fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("offline"));

    const result = await verificationService.verifyLiveness("session-123");

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      code: "unexpected_error",
    });
  });

  it("returns reset success from the real session reset endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    } as Response);

    const result = await registrationSessionApiService.reset();

    expect(fetchSpy).toHaveBeenCalledWith(
      API.registrationSessionReset,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
    expect(result).toEqual({ success: true });
  });

  it("returns unexpected_error when session reset JSON is invalid", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: () => Promise.reject(new Error("invalid json")),
    } as Response);

    const result = await registrationSessionApiService.reset();

    expect(result).toEqual({
      success: false,
      code: "unexpected_error",
    });
  });

  it("uses the real session reset endpoint and falls back on network failure", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("offline"));

    const result = await registrationSessionApiService.reset();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      code: "unexpected_error",
    });
  });
});
