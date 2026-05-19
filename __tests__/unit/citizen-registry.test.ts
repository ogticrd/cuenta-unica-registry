import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("findCitizenSummaryByCedula", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.CITIZENS_API_BASE_URL = "https://api.citizens.test";
    process.env.CITIZENS_INFO_API_KEY = "test-api-key";
  });

  it("returns citizen summary when API returns valid data", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          valid: true,
          payload: { id: "40200612345", names: "Juan Perez" },
        }),
    } as Response);

    const { findCitizenSummaryByCedula } = await import(
      "@/lib/services/registration/citizen-registry.service"
    );
    const result = await findCitizenSummaryByCedula("402-0061234-5");
    expect(result).toEqual({ id: "40200612345", firstName: "Juan" });
  });

  it("returns null when citizen is not found", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ valid: false, payload: null }),
    } as Response);

    const { findCitizenSummaryByCedula } = await import(
      "@/lib/services/registration/citizen-registry.service"
    );
    const result = await findCitizenSummaryByCedula("40200612345");
    expect(result).toBeNull();
  });

  it("throws when API request fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Server Error"),
    } as Response);

    const { findCitizenSummaryByCedula } = await import(
      "@/lib/services/registration/citizen-registry.service"
    );
    await expect(findCitizenSummaryByCedula("40200612345")).rejects.toThrow(
      "Request failed with status 500",
    );
  });

  it("throws with minimal message when API fails without error text", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve(""),
    } as Response);

    const { findCitizenSummaryByCedula } = await import(
      "@/lib/services/registration/citizen-registry.service"
    );
    await expect(findCitizenSummaryByCedula("40200612345")).rejects.toThrow(
      "Request failed with status 404",
    );
  });

  it("throws with minimal message when API text() throws", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: () => Promise.reject(new Error("network")),
    } as Response);

    const { findCitizenSummaryByCedula } = await import(
      "@/lib/services/registration/citizen-registry.service"
    );
    await expect(findCitizenSummaryByCedula("40200612345")).rejects.toThrow(
      "Request failed with status 503",
    );
  });
});

describe("findCitizenByCedula", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.CITIZENS_API_BASE_URL = "https://api.citizens.test";
    process.env.CITIZENS_INFO_API_KEY = "test-api-key";
  });

  it("returns full citizen profile when both APIs succeed", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            valid: true,
            payload: {
              id: "40200612345",
              names: "Juan Alberto",
              firstSurname: "Perez",
              secondSurname: "Garcia",
              gender: "M",
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            valid: true,
            payload: { birthDate: "1990-05-15T00:00:00Z" },
          }),
      } as Response);

    const { findCitizenByCedula } = await import(
      "@/lib/services/registration/citizen-registry.service"
    );
    const result = await findCitizenByCedula("40200612345");
    expect(result).toEqual({
      id: "40200612345",
      names: "Juan Alberto",
      firstName: "Juan",
      lastName: "Perez Garcia",
      birthDate: "1990-05-15",
      gender: "M",
    });
  });

  it("returns null when basic information is not found", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ valid: false, payload: null }),
    } as Response);

    const { findCitizenByCedula } = await import(
      "@/lib/services/registration/citizen-registry.service"
    );
    const result = await findCitizenByCedula("40200612345");
    expect(result).toBeNull();
  });

  it("returns null when birth information is not found", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            valid: true,
            payload: {
              id: "40200612345",
              names: "Juan",
              firstSurname: "Perez",
              gender: "M",
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ valid: false, payload: null }),
      } as Response);

    const { findCitizenByCedula } = await import(
      "@/lib/services/registration/citizen-registry.service"
    );
    const result = await findCitizenByCedula("40200612345");
    expect(result).toBeNull();
  });

  it("builds last name with only first surname when second is empty", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            valid: true,
            payload: {
              id: "40200612345",
              names: "Juan",
              firstSurname: "Perez",
              secondSurname: "",
              gender: "M",
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            valid: true,
            payload: { birthDate: "1990-01-01T00:00:00Z" },
          }),
      } as Response);

    const { findCitizenByCedula } = await import(
      "@/lib/services/registration/citizen-registry.service"
    );
    const result = await findCitizenByCedula("40200612345");
    expect(result?.lastName).toBe("Perez");
  });
});
