import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockListIdentities } = vi.hoisted(() => ({
  mockListIdentities: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@ory/client", () => ({
  Configuration: class Configuration {
    constructor(public readonly options: unknown) {}
  },
  IdentityApi: class IdentityApi {
    constructor(public readonly configuration: unknown) {}

    listIdentities(...args: unknown[]) {
      return mockListIdentities(...args);
    }
  },
}));

import { checkCitizenIdentity } from "@/lib/services/registration/ory-identity.service";

describe("checkCitizenIdentity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ORY_SDK_URL = "https://ory.example.test";
    process.env.ORY_SDK_TOKEN = "ory-token";
  });

  it("returns exists=true when Ory finds at least one identity", async () => {
    mockListIdentities.mockResolvedValueOnce({
      data: [{ id: "identity-1" }],
    });

    const result = await checkCitizenIdentity("40200612345");

    expect(mockListIdentities).toHaveBeenCalledWith({
      credentialsIdentifier: "40200612345",
    });
    expect(result).toEqual({ exists: true });
  });

  it("returns exists=false when Ory finds no identities", async () => {
    mockListIdentities.mockResolvedValueOnce({
      data: [],
    });

    await expect(checkCitizenIdentity("40200612345")).resolves.toEqual({
      exists: false,
    });
  });

  it("throws when ORY_SDK_URL is missing", async () => {
    delete process.env.ORY_SDK_URL;

    await expect(checkCitizenIdentity("40200612345")).rejects.toThrow(
      "Missing ORY_SDK_URL environment variable",
    );
  });

  it("throws when ORY_SDK_TOKEN is missing", async () => {
    delete process.env.ORY_SDK_TOKEN;

    await expect(checkCitizenIdentity("40200612345")).rejects.toThrow(
      "Missing ORY_SDK_TOKEN environment variable",
    );
  });
});
