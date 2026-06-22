import { beforeEach, describe, expect, it, vi } from "vitest";
import { API } from "@/lib/constants/api";
import { accountService } from "@/lib/services/registration/account.service";

describe("accountService.registerAccount", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed response data on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          redirectTo: "/verification",
          destination: "verification",
        }),
        { status: 200 },
      ),
    );

    const result = await accountService.registerAccount({
      email: "test@example.com",
      password: "StrongPass123!",
    });

    expect(result).toEqual({
      success: true,
      redirectTo: "/verification",
      destination: "verification",
    });
  });

  it("sends the correct request shape", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );

    await accountService.registerAccount({
      email: "test@example.com",
      password: "StrongPass123!",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      API.registrationAccount,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "StrongPass123!",
        }),
      }),
    );
  });

  it("can finalize using the server-side account draft without a request body", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          redirectTo: "/register/email-sent?flow=flow-123",
          destination: "email-sent",
        }),
        { status: 200 },
      ),
    );

    await accountService.registerAccount();

    expect(fetchSpy).toHaveBeenCalledWith(
      API.registrationAccount,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
    expect(fetchSpy.mock.calls[0]?.[1]).not.toHaveProperty("body");
  });

  it("saves the account draft before liveness starts", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          sessionStatus: "identified",
        }),
        { status: 200 },
      ),
    );

    const result = await accountService.saveAccountDraft({
      email: "test@example.com",
      password: "StrongPass123!",
    });

    expect(result).toEqual({
      success: true,
      sessionStatus: "identified",
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      API.registrationAccountDraft,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "StrongPass123!",
        }),
      }),
    );
  });

  it("returns unexpected_error when JSON parsing fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("invalid json", { status: 200 }),
    );

    const result = await accountService.registerAccount({
      email: "test@example.com",
      password: "StrongPass123!",
    });

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

    const result = await accountService.registerAccount({
      email: "test@example.com",
      password: "StrongPass123!",
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      code: "unexpected_error",
    });
  });

  it("returns error response with code and fieldErrors from the API", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          code: "identity_exists",
          fieldErrors: { email: "identities.messages.4000007" },
        }),
        { status: 400 },
      ),
    );

    const result = await accountService.registerAccount({
      email: "test@example.com",
      password: "StrongPass123!",
    });

    expect(result).toEqual({
      success: false,
      code: "identity_exists",
      fieldErrors: { email: "identities.messages.4000007" },
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("preserves draft API error codes from non-OK responses", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          code: "registration_session_missing",
        }),
        { status: 401 },
      ),
    );

    const result = await accountService.saveAccountDraft({
      email: "test@example.com",
      password: "StrongPass123!",
    });

    expect(result).toEqual({
      success: false,
      code: "registration_session_missing",
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it.each([
    [
      "password_cedula_similarity",
      "account.validation.password_cedula_similarity",
    ],
    [
      "password_email_similarity",
      "account.validation.password_email_similarity",
    ],
    ["password_weak", "account.validation.password_weak"],
    ["password_compromised", "account.validation.password_compromised"],
  ] as const)("preserves draft password error code and field errors for %s", async (code, messageKey) => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          code,
          fieldErrors: {
            password: messageKey,
          },
        }),
        { status: 400 },
      ),
    );

    const result = await accountService.saveAccountDraft({
      email: "test@example.com",
      password: "StrongPass123!",
    });

    expect(result).toEqual({
      success: false,
      code,
      fieldErrors: {
        password: messageKey,
      },
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
