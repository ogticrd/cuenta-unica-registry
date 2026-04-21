import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API } from "@/lib/constants/api";
import { accountService } from "@/lib/services/registration/account.service";

describe("accountService.registerAccount", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed response data on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          redirectTo: "/verification",
          destination: "verification",
        }),
    } as Response);

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
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    } as Response);

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

  it("returns unexpected_error when JSON parsing fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: () => Promise.reject(new Error("invalid json")),
    } as Response);

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
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: false,
          code: "identity_exists",
          fieldErrors: { email: "identities.messages.4000007" },
        }),
    } as Response);

    const result = await accountService.registerAccount({
      email: "test@example.com",
      password: "StrongPass123!",
    });

    expect(result).toEqual({
      success: false,
      code: "identity_exists",
      fieldErrors: { email: "identities.messages.4000007" },
    });
  });
});
