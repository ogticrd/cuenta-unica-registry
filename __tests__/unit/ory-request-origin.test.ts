import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockHeaders } = vi.hoisted(() => ({
  mockHeaders: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

vi.mock("server-only", () => ({}));

import { getRequestOrigin } from "@/lib/ory/request-origin";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getRequestOrigin", () => {
  it("uses forwarded host and protocol before internal host headers", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        host: "0.0.0.0:8080",
        "x-forwarded-host": "cuenta-unica.example.test",
        "x-forwarded-proto": "https",
      }),
    );

    await expect(getRequestOrigin()).resolves.toBe(
      "https://cuenta-unica.example.test",
    );
  });

  it("uses the first value from comma-separated proxy headers", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        host: "0.0.0.0:8080",
        "x-forwarded-host":
          "cuenta-unica.example.test, internal-proxy.example.test",
        "x-forwarded-proto": "https, http",
      }),
    );

    await expect(getRequestOrigin()).resolves.toBe(
      "https://cuenta-unica.example.test",
    );
  });

  it("falls back to the host header using https", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        host: "localhost:3000",
      }),
    );

    await expect(getRequestOrigin()).resolves.toBe("https://localhost:3000");
  });
});
