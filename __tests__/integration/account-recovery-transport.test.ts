import { createServer } from "node:http";
import { Configuration, IdentityApi } from "@ory/client";
import { afterEach, expect, it, vi } from "vitest";

const { createOryIdentityClient } = vi.hoisted(() => ({
  createOryIdentityClient: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/services/registration/ory-identity.service", () => ({
  createOryIdentityClient,
}));

import { recoverOryAccount } from "@/lib/services/registration/account-recovery.service";

afterEach(() => vi.unstubAllEnvs());

it("completes credential recovery through the real SDK when Ory returns relative pagination links", async () => {
  const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const calls: string[] = [];
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    calls.push(`${request.method} ${url.pathname}`);
    response.setHeader("Content-Type", "application/json");
    if (url.pathname.endsWith("/sessions")) {
      response.setHeader(
        "Link",
        `</admin/identities/${id}/sessions?page=2&per_page=250&page_token=>; rel="next"`,
      );
      response.end("[]");
      return;
    }
    const identity = {
      id,
      schema_id: "default",
      state: "active",
      traits: { username: "40214041176", email: "previous@example.com" },
    };
    if (request.method === "PUT") {
      let body = "";
      for await (const chunk of request) body += chunk;
      identity.traits = JSON.parse(body).traits;
    }
    response.end(JSON.stringify(identity));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing test server port");
  const basePath = `http://127.0.0.1:${address.port}`;
  vi.stubEnv("ORY_SDK_URL", basePath);
  createOryIdentityClient.mockReturnValue(
    new IdentityApi(
      new Configuration({
        basePath,
        accessToken: "test-token",
        baseOptions: { adapter: "http" },
      }),
    ),
  );
  try {
    const result = await recoverOryAccount(
      { email: "new@example.com", password: "TestOnlyPassword#2026" },
      {
        sessionId: id,
        cedula: "40214041176",
        status: "verified",
        recovery: { identityId: id },
        issuedAt: Date.now(),
        expiresAt: Date.now() + 60000,
      },
    );
    expect(result).toMatchObject({
      success: true,
      identity: { id, traits: { email: "new@example.com" } },
    });
    expect(calls).toEqual([
      `GET /admin/identities/${id}`,
      `PUT /admin/identities/${id}`,
      `GET /admin/identities/${id}/sessions`,
    ]);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
