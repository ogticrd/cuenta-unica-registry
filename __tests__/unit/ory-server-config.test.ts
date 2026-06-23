import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockHeaders } = vi.hoisted(() => ({
  mockHeaders: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/ory/server-locale", () => ({
  getServerLocale: vi.fn(async () => "es"),
}));

import { getServerOryConfig } from "@/lib/ory/server-config";

beforeEach(() => {
  vi.clearAllMocks();
  mockHeaders.mockResolvedValue(
    new Headers({
      host: "0.0.0.0:8080",
      "x-forwarded-host": "cuenta-unica.example.test",
      "x-forwarded-proto": "https",
    }),
  );
});

describe("getServerOryConfig", () => {
  it("sets Ory Elements SDK URL to the current public request origin", async () => {
    const config = await getServerOryConfig();

    expect(config.sdk?.url).toBe("https://cuenta-unica.example.test");
    expect(config.sdk?.options?.credentials).toBe("include");
  });
});
