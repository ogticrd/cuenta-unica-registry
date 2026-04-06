import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API } from "@/lib/constants/api";
import { citizenService } from "@/lib/services/registration/citizen.service";

describe("citizenService.identifyCitizen", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns citizen data from the real service when the API succeeds", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          citizen: {
            id: "citizen-123",
            firstName: "Juan",
          },
        }),
    } as Response);

    const result = await citizenService.identifyCitizen(
      "00100063362",
      "https://example.com/dashboard",
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      API.registrationCitizen,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cedula: "00100063362",
          returnUrl: "https://example.com/dashboard",
        }),
      }),
    );
    expect(result).toEqual({
      success: true,
      citizen: {
        id: "citizen-123",
        firstName: "Juan",
      },
    });
  });

  it("returns unexpected_error when the API payload is invalid", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: () => Promise.reject(new Error("invalid json")),
    } as Response);

    const result = await citizenService.identifyCitizen("00100063362");

    expect(result).toEqual({
      success: false,
      code: "unexpected_error",
    });
  });

  it("sends the production request shape when returnUrl is omitted", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          citizen: {
            id: "citizen-123",
            firstName: "Juan",
          },
        }),
    } as Response);

    await citizenService.identifyCitizen("00100063362");

    expect(fetchSpy).toHaveBeenCalledWith(
      API.registrationCitizen,
      expect.objectContaining({
        body: JSON.stringify({
          cedula: "00100063362",
        }),
      }),
    );
  });

  it("returns unexpected_error when fetch throws", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("offline"));

    const result = await citizenService.identifyCitizen("00100063362");

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      code: "unexpected_error",
    });
  });
});
