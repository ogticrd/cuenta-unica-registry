import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Types (copied from project)
interface CitizenLookupRequest {
  cedula: string;
  returnUrl?: string;
}

interface CitizenLookupResult {
  id: string;
  firstName: string;
}

type CitizenLookupErrorCode =
  | "invalid_cedula"
  | "identity_exists"
  | "citizen_not_found"
  | "unexpected_error";

type CitizenLookupResponse =
  | {
      success: true;
      citizen: CitizenLookupResult;
    }
  | {
      success: false;
      code: CitizenLookupErrorCode;
    };

// API constants
const API = {
  registrationCitizen: "/api/registration/citizen",
};

// Citizen service (copied from project)
async function parseCitizenLookupResponse(
  response: Response,
): Promise<CitizenLookupResponse> {
  const payload = (await response
    .json()
    .catch(() => null)) as CitizenLookupResponse | null;

  if (!payload) {
    return {
      success: false,
      code: "unexpected_error",
    };
  }

  return payload;
}

const citizenService = {
  async identifyCitizen(
    cedula: string,
    returnUrl?: string,
  ): Promise<CitizenLookupResponse> {
    try {
      const requestBody: CitizenLookupRequest = { cedula, returnUrl };

      const response = await fetch(API.registrationCitizen, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      return parseCitizenLookupResponse(response);
    } catch (error) {
      console.error("[citizenService.identifyCitizen] Request failed:", error);

      return {
        success: false,
        code: "unexpected_error",
      };
    }
  },
};

describe("citizenService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("identifyCitizen", () => {
    it("should return success with citizen data for valid cedula", async () => {
      const mockResponse: CitizenLookupResponse = {
        success: true,
        citizen: {
          id: "citizen-123",
          firstName: "Juan",
        },
      };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await citizenService.identifyCitizen("00100063362");

      expect(result).toEqual({
        success: true,
        citizen: {
          id: "citizen-123",
          firstName: "Juan",
        },
      });
    });

    it("should return error for invalid cedula", async () => {
      const mockResponse: CitizenLookupResponse = {
        success: false,
        code: "invalid_cedula",
      };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await citizenService.identifyCitizen("invalid");

      expect(result).toEqual({
        success: false,
        code: "invalid_cedula",
      });
    });

    it("should return error when citizen not found", async () => {
      const mockResponse: CitizenLookupResponse = {
        success: false,
        code: "citizen_not_found",
      };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await citizenService.identifyCitizen("00000000000");

      expect(result).toEqual({
        success: false,
        code: "citizen_not_found",
      });
    });

    it("should return error when identity already exists", async () => {
      const mockResponse: CitizenLookupResponse = {
        success: false,
        code: "identity_exists",
      };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await citizenService.identifyCitizen("00100063362");

      expect(result).toEqual({
        success: false,
        code: "identity_exists",
      });
    });

    it("should include returnUrl in request when provided", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            citizen: { id: "123", firstName: "Juan" },
          }),
      } as Response);

      await citizenService.identifyCitizen(
        "00100063362",
        "https://example.com/dashboard",
      );

      expect(global.fetch).toHaveBeenCalledWith(
        API.registrationCitizen,
        expect.objectContaining({
          body: JSON.stringify({
            cedula: "00100063362",
            returnUrl: "https://example.com/dashboard",
          }),
        }),
      );
    });

    it("should make request with correct headers and credentials", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            citizen: { id: "123", firstName: "Test" },
          }),
      } as Response);

      await citizenService.identifyCitizen("00100063362");

      expect(global.fetch).toHaveBeenCalledWith(
        API.registrationCitizen,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }),
      );
    });

    it("should return unexpected_error when fetch fails", async () => {
      vi.spyOn(global, "fetch").mockRejectedValueOnce(
        new Error("Network error"),
      );

      const result = await citizenService.identifyCitizen("00100063362");

      expect(result).toEqual({
        success: false,
        code: "unexpected_error",
      });
    });

    it("should return unexpected_error when response is not valid JSON", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      } as Response);

      const result = await citizenService.identifyCitizen("00100063362");

      expect(result).toEqual({
        success: false,
        code: "unexpected_error",
      });
    });
  });
});

describe("parseCitizenLookupResponse", () => {
  it("should parse valid success response", async () => {
    const response = {
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          citizen: { id: "123", firstName: "Maria" },
        }),
    } as Response;

    const result = await parseCitizenLookupResponse(response);

    expect(result).toEqual({
      success: true,
      citizen: { id: "123", firstName: "Maria" },
    });
  });

  it("should parse valid error response", async () => {
    const response = {
      ok: true,
      json: () =>
        Promise.resolve({
          success: false,
          code: "citizen_not_found",
        }),
    } as Response;

    const result = await parseCitizenLookupResponse(response);

    expect(result).toEqual({
      success: false,
      code: "citizen_not_found",
    });
  });

  it("should return unexpected_error for null payload", async () => {
    const response = {
      ok: true,
      json: () => Promise.reject(new Error("Invalid JSON")),
    } as Response;

    const result = await parseCitizenLookupResponse(response);

    expect(result).toEqual({
      success: false,
      code: "unexpected_error",
    });
  });

  it("should handle all error codes", async () => {
    const errorCodes: CitizenLookupErrorCode[] = [
      "invalid_cedula",
      "identity_exists",
      "citizen_not_found",
      "unexpected_error",
    ];

    for (const code of errorCodes) {
      const response = {
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            code,
          }),
      } as Response;

      const result = await parseCitizenLookupResponse(response);

      expect(result).toEqual({
        success: false,
        code,
      });
    }
  });
});

describe("CitizenLookupRequest", () => {
  it("should create correct request body with cedula only", () => {
    const request: CitizenLookupRequest = { cedula: "00100063362" };
    expect(request.cedula).toBe("00100063362");
    expect(request.returnUrl).toBeUndefined();
  });

  it("should create correct request body with cedula and returnUrl", () => {
    const request: CitizenLookupRequest = {
      cedula: "00100063362",
      returnUrl: "https://example.com/return",
    };
    expect(request.cedula).toBe("00100063362");
    expect(request.returnUrl).toBe("https://example.com/return");
  });
});

describe("CitizenLookupResponse Type Safety", () => {
  it("should have correct shape for success response", () => {
    const response: CitizenLookupResponse = {
      success: true,
      citizen: {
        id: "citizen-id",
        firstName: "Juan",
      },
    };

    if (response.success) {
      expect(response.citizen.id).toBe("citizen-id");
      expect(response.citizen.firstName).toBe("Juan");
    }
  });

  it("should have correct shape for error response", () => {
    const response: CitizenLookupResponse = {
      success: false,
      code: "citizen_not_found",
    };

    if (!response.success) {
      expect(response.code).toBe("citizen_not_found");
    }
  });
});
