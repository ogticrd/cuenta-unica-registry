import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/oauth2/[...path]/route";

const originalOryPublicUrl = process.env.ORY_PUBLIC_URL;
const originalOrySdkUrl = process.env.ORY_SDK_URL;

afterEach(() => {
  process.env.ORY_PUBLIC_URL = originalOryPublicUrl;
  process.env.ORY_SDK_URL = originalOrySdkUrl;
});

describe("OAuth continuation route", () => {
  it("redirects registry OAuth continuation requests to Ory", async () => {
    process.env.ORY_PUBLIC_URL = "";
    process.env.ORY_SDK_URL =
      "https://focused-gagarin-ywepc2q5bu.projects.oryapis.com/";

    const request = new NextRequest(
      "https://cuenta-unica-registry-dev-x6fzoay5ua-ue.a.run.app/oauth2/auth?client_id=4c2d8cc9-1740-47a5-8a32-e94c7049edff&login_verifier=verifier-123&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fcallback&response_type=code&scope=openid+profile+email+offline_access&state=state-123",
    );

    const response = await GET(request, {
      params: Promise.resolve({ path: ["auth"] }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://focused-gagarin-ywepc2q5bu.projects.oryapis.com/oauth2/auth?client_id=4c2d8cc9-1740-47a5-8a32-e94c7049edff&login_verifier=verifier-123&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fcallback&response_type=code&scope=openid+profile+email+offline_access&state=state-123",
    );
  });

  it("prefers ORY_PUBLIC_URL when it is configured", async () => {
    process.env.ORY_PUBLIC_URL = "https://iam.cuentaunica.gob.do";
    process.env.ORY_SDK_URL = "https://ory.example.test";

    const request = new NextRequest(
      "https://registry.example.test/oauth2/auth?login_verifier=verifier-456",
    );

    const response = await GET(request, {
      params: Promise.resolve({ path: ["auth"] }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://iam.cuentaunica.gob.do/oauth2/auth?login_verifier=verifier-456",
    );
  });

  it("returns a clear server error when no Ory public URL is configured", async () => {
    process.env.ORY_PUBLIC_URL = "";
    process.env.ORY_SDK_URL = "";

    const request = new NextRequest(
      "https://registry.example.test/oauth2/auth?login_verifier=verifier-789",
    );

    const response = await GET(request, {
      params: Promise.resolve({ path: ["auth"] }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Missing ORY_PUBLIC_URL or ORY_SDK_URL environment variable",
    });
  });
});
