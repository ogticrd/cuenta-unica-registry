import { beforeEach, describe, expect, it, vi } from "vitest";
import { API } from "@/lib/constants/api";
import { authService } from "@/lib/services/ory/auth.service";
import { sessionService } from "@/lib/services/ory/session.service";
import { registrationSessionApiService } from "@/lib/services/registration/registration-session-api.service";

describe("sessionService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });


  describe("getSession", () => {
    it("returns session data on success", async () => {
      const sessionData = {
        isAuthenticated: true,
        identity: { id: "user-123", traits: { email: "test@example.com" } },
        session: { id: "session-456" },
      };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(sessionData),
      } as Response);

      const result = await sessionService.getSession();

      expect(result).toEqual(sessionData);
    });

    it("sends credentials include in the request", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isAuthenticated: false }),
      } as Response);

      await sessionService.getSession();

      expect(fetchSpy).toHaveBeenCalledWith(
        API.session,
        expect.objectContaining({ credentials: "include" }),
      );
    });

    it("throws when response status is not ok", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ isAuthenticated: false }),
      } as Response);

      await expect(sessionService.getSession()).rejects.toThrow(
        "Request failed with status 401",
      );
    });
  });

  describe("revokeSession", () => {
    it("sends DELETE to the correct URL with session ID", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await sessionService.revokeSession("session-789");

      expect(fetchSpy).toHaveBeenCalledWith(
        `${API.sessions}/session-789`,
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    it("returns success data on successful revocation", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await sessionService.revokeSession("session-789");

      expect(result).toEqual({ success: true });
    });

    it("throws when response status is not ok", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ success: false, error: "Not found" }),
      } as Response);

      await expect(
        sessionService.revokeSession("invalid-session"),
      ).rejects.toThrow("Request failed with status 404");
    });
  });
});

describe("authService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });


  describe("logout", () => {
    it("returns redirect_to on success", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            redirect_to: "https://example.com/login",
          }),
      } as Response);

      const result = await authService.logout();

      expect(result).toEqual({
        success: true,
        redirect_to: "https://example.com/login",
      });
    });

    it("sends POST with credentials include", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await authService.logout();

      expect(fetchSpy).toHaveBeenCalledWith(
        API.logout,
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        }),
      );
    });

    it("rejects when fetch fails", async () => {
      vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("offline"));

      await expect(authService.logout()).rejects.toThrow("offline");
    });
  });
});

describe("registrationSessionApiService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });


  describe("reset", () => {
    it("returns success on successful reset", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await registrationSessionApiService.reset();

      expect(result).toEqual({ success: true });
    });

    it("sends POST with credentials include to the reset endpoint", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await registrationSessionApiService.reset();

      expect(fetchSpy).toHaveBeenCalledWith(
        API.registrationSessionReset,
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        }),
      );
    });

    it("returns unexpected_error when JSON parsing fails", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: () => Promise.reject(new Error("invalid json")),
      } as Response);

      const result = await registrationSessionApiService.reset();

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

      const result = await registrationSessionApiService.reset();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        code: "unexpected_error",
      });
    });
  });
});
