import { beforeEach, describe, expect, it, vi } from "vitest";
import { API } from "@/lib/constants/api";
import { citizenService } from "@/lib/services/registration/citizen.service";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("citizenService.identifyCitizen", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns citizen data from the real service when the API succeeds", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({
        success: true,
        citizen: {
          id: "citizen-123",
          firstName: "Juan",
        },
      }),
    );

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
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("invalid json", { status: 200 }),
    );

    const result = await citizenService.identifyCitizen("00100063362");

    expect(result).toEqual({
      success: false,
      code: "unexpected_error",
    });
  });

  it("sends the production request shape when returnUrl is omitted", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({
        success: true,
        citizen: {
          id: "citizen-123",
          firstName: "Juan",
        },
      }),
    );

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

  it("preserves coded API failures from non-OK responses", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse(
        {
          success: false,
          code: "invalid_payload",
        },
        400,
      ),
    );

    const result = await citizenService.identifyCitizen("00100063362");

    expect(result).toEqual({
      success: false,
      code: "invalid_payload",
    });
  });
});
