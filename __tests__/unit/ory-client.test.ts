import { describe, expect, it, vi } from "vitest";

vi.mock("@ory/client", () => ({
    Configuration: vi.fn(),
    FrontendApi: vi.fn(function () {
        return { mocked: true };
    }),
}));

describe("createOryClient", () => {
    it("throws when ORY_SDK_URL is missing", async () => {
        delete process.env.ORY_SDK_URL;
        vi.resetModules();
        const { createOryClient } = await import("@/lib/ory/client");
        expect(() => createOryClient()).toThrow(
            "Missing ORY_SDK_URL environment variable",
        );
    });

    it("creates a client when ORY_SDK_URL is present", async () => {
        process.env.ORY_SDK_URL = "https://ory.example.com";
        vi.resetModules();
        const { createOryClient } = await import("@/lib/ory/client");
        const client = createOryClient();
        expect(client).toEqual({ mocked: true });
    });
});

describe("getOryClient", () => {
    it("returns the same instance on subsequent calls (lazy singleton)", async () => {
        process.env.ORY_SDK_URL = "https://ory.example.com";
        vi.resetModules();
        const { getOryClient } = await import("@/lib/ory/client");
        const client1 = getOryClient();
        const client2 = getOryClient();
        expect(client1).toBe(client2);
    });
});