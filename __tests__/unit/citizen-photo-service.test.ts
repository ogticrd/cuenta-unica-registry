import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockNormalizeCedula } = vi.hoisted(() => ({
  mockNormalizeCedula: vi.fn((value: string) => value.replace(/\D/g, "")),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/utils/cedula", () => ({
  normalizeCedula: mockNormalizeCedula,
}));

import { fetchCitizenPhoto } from "@/lib/services/registration/citizen-photo.service";

describe("fetchCitizenPhoto", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.CITIZENS_API_BASE_URL = "https://citizens.example.gov/";
    process.env.CITIZENS_PHOTO_API_KEY = "photo-key";
  });

  it("fetches the citizen photo using the normalized cedula", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(Uint8Array.from([1, 2, 3]).buffer),
    } as Response);

    const result = await fetchCitizenPhoto("402-0061234-5");

    expect(mockNormalizeCedula).toHaveBeenCalledWith("402-0061234-5");
    expect(global.fetch).toHaveBeenCalledWith(
      new URL(
        "https://citizens.example.gov/v1/citizens/pictures/40200612345/photo?api-key=photo-key",
      ),
      { cache: "no-store" },
    );
    expect(result).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("throws when the base url environment variable is missing", async () => {
    delete process.env.CITIZENS_API_BASE_URL;

    await expect(fetchCitizenPhoto("40200612345")).rejects.toThrow(
      "Missing CITIZENS_API_BASE_URL environment variable",
    );
  });

  it("throws when the photo api key environment variable is missing", async () => {
    delete process.env.CITIZENS_PHOTO_API_KEY;

    await expect(fetchCitizenPhoto("40200612345")).rejects.toThrow(
      "Missing CITIZENS_PHOTO_API_KEY environment variable",
    );
  });

  it("throws with the upstream status when the photo request fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    await expect(fetchCitizenPhoto("40200612345")).rejects.toThrow(
      "Failed to fetch citizen photo: 404 Not Found",
    );
  });
});
