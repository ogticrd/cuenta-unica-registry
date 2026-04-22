import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    mockHeaders,
    mockCreateBrowserLogoutFlow,
    mockUpdateLogoutFlow,
} = vi.hoisted(() => ({
    mockHeaders: vi.fn(),
    mockCreateBrowserLogoutFlow: vi.fn(),
    mockUpdateLogoutFlow: vi.fn(),
}));

vi.mock("next/headers", () => ({
    cookies: vi.fn(),
    headers: mockHeaders,
}));

vi.mock("server-only", () => ({}));

vi.mock("@ory/client", () => ({
    Configuration: class Configuration {
        constructor(_options?: unknown) { }
    },
    FrontendApi: class FrontendApi {
        createBrowserLogoutFlow(...args: unknown[]) {
            return mockCreateBrowserLogoutFlow(...args);
        }
        updateLogoutFlow(...args: unknown[]) {
            return mockUpdateLogoutFlow(...args);
        }
    },
}));

import { POST } from "@/app/api/ory/logout/route";

beforeEach(() => {
    vi.clearAllMocks();

    process.env.ORY_SDK_URL = "https://ory.example.test";
    process.env.ORY_SDK_TOKEN = "ory-token";

    mockHeaders.mockResolvedValue(
        new Headers({ cookie: "ory_session=test-session-cookie" }),
    );
});

describe("POST /api/ory/logout", () => {
    it("performs logout and forwards Set-Cookie headers from Ory", async () => {
        mockCreateBrowserLogoutFlow.mockResolvedValueOnce({
            data: {
                logout_token: "logout-token-123",
                logout_url: "https://ory.example.test/self-service/logout?token=logout-token-123",
            },
        });

        mockUpdateLogoutFlow.mockResolvedValueOnce({
            headers: {
                "set-cookie": [
                    "ory_session=; Path=/; Max-Age=0; HttpOnly; Domain=ory.example.test",
                ],
            },
        });

        const response = await POST();

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toEqual({
            success: true,
            redirect_to: "/self-service/login/browser",
        });

        // Verify Set-Cookie headers are forwarded
        const setCookieHeaders = response.headers.getSetCookie?.() ?? [];
        expect(setCookieHeaders).toHaveLength(1);
        expect(setCookieHeaders[0]).toContain("ory_session=");
        expect(setCookieHeaders[0]).toContain("Max-Age=0");

        // Verify cookie forwarding to Ory
        expect(mockCreateBrowserLogoutFlow).toHaveBeenCalledWith({
            cookie: "ory_session=test-session-cookie",
        });
        expect(mockUpdateLogoutFlow).toHaveBeenCalledWith(
            { token: "logout-token-123" },
            {
                headers: {
                    Cookie: "ory_session=test-session-cookie",
                },
            },
        );
    });

    it("forwards multiple Set-Cookie headers from Ory", async () => {
        mockCreateBrowserLogoutFlow.mockResolvedValueOnce({
            data: {
                logout_token: "logout-token-456",
                logout_url: "https://ory.example.test/self-service/logout?token=logout-token-456",
            },
        });

        mockUpdateLogoutFlow.mockResolvedValueOnce({
            headers: {
                "set-cookie": [
                    "ory_session=; Path=/; Max-Age=0; HttpOnly",
                    "csrf_token=; Path=/; Max-Age=0",
                ],
            },
        });

        const response = await POST();

        expect(response.status).toBe(200);
        const setCookieHeaders = response.headers.getSetCookie?.() ?? [];
        expect(setCookieHeaders).toHaveLength(2);
    });

    it("returns success when session is already expired (401)", async () => {
        mockCreateBrowserLogoutFlow.mockRejectedValueOnce({
            response: { status: 401 },
        });

        const response = await POST();

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toEqual({
            success: true,
            redirect_to: "/self-service/login/browser",
        });
        expect(mockUpdateLogoutFlow).not.toHaveBeenCalled();
    });

    it("returns success when session is already expired (403)", async () => {
        mockCreateBrowserLogoutFlow.mockRejectedValueOnce({
            response: { status: 403 },
        });

        const response = await POST();

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toEqual({
            success: true,
            redirect_to: "/self-service/login/browser",
        });
    });

    it("returns 500 when createBrowserLogoutFlow fails with unexpected error", async () => {
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => undefined);

        mockCreateBrowserLogoutFlow.mockRejectedValueOnce(
            new Error("Ory network failure"),
        );

        const response = await POST();

        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body).toEqual({
            success: false,
            error: "Failed to logout",
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("Error during logout"),
            expect.any(Error),
        );
    });

    it("returns 500 when updateLogoutFlow fails", async () => {
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => undefined);

        mockCreateBrowserLogoutFlow.mockResolvedValueOnce({
            data: {
                logout_token: "logout-token-789",
                logout_url: "https://ory.example.test/self-service/logout?token=logout-token-789",
            },
        });

        mockUpdateLogoutFlow.mockRejectedValueOnce(new Error("Logout execution failed"));

        const response = await POST();

        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body).toEqual({
            success: false,
            error: "Failed to logout",
        });
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("returns success when no Set-Cookie headers come from Ory", async () => {
        mockCreateBrowserLogoutFlow.mockResolvedValueOnce({
            data: {
                logout_token: "logout-token-nocookie",
                logout_url: "https://ory.example.test/self-service/logout?token=logout-token-nocookie",
            },
        });

        mockUpdateLogoutFlow.mockResolvedValueOnce({
            headers: {},
        });

        const response = await POST();

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        const setCookieHeaders = response.headers.getSetCookie?.() ?? [];
        expect(setCookieHeaders).toHaveLength(0);
    });

    it("forwards the full browser cookie string to both Ory calls", async () => {
        mockHeaders.mockResolvedValueOnce(
            new Headers({ cookie: "ory_session=abc; csrf_token=xyz; other=value" }),
        );

        mockCreateBrowserLogoutFlow.mockResolvedValueOnce({
            data: {
                logout_token: "token-multicookie",
                logout_url: "https://ory.example.test/self-service/logout?token=token-multicookie",
            },
        });

        mockUpdateLogoutFlow.mockResolvedValueOnce({
            headers: {},
        });

        await POST();

        expect(mockCreateBrowserLogoutFlow).toHaveBeenCalledWith({
            cookie: "ory_session=abc; csrf_token=xyz; other=value",
        });
        expect(mockUpdateLogoutFlow).toHaveBeenCalledWith(
            { token: "token-multicookie" },
            {
                headers: {
                    Cookie: "ory_session=abc; csrf_token=xyz; other=value",
                },
            },
        );
    });
});