import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    mockHeaders,
    mockGetLoginFlowRaw,
    mockGetFlowFactory,
} = vi.hoisted(() => ({
    mockHeaders: vi.fn(),
    mockGetLoginFlowRaw: vi.fn(),
    mockGetFlowFactory: vi.fn(),
}));

vi.mock("next/headers", () => ({
    cookies: vi.fn(),
    headers: mockHeaders,
}));

vi.mock("server-only", () => ({}));

vi.mock("@ory/client-fetch", () => ({
    Configuration: class Configuration {
        constructor(_options?: unknown) { }
    },
    FlowType: {
        Login: "login",
        Registration: "registration",
        Recovery: "recovery",
        Verification: "verification",
        Settings: "settings",
    },
    FrontendApi: class FrontendApi {
        getLoginFlowRaw(...args: unknown[]) {
            return mockGetLoginFlowRaw(...args);
        }
    },
}));

vi.mock("@ory/nextjs/app", () => ({
    getFlowFactory: mockGetFlowFactory,
    getOryConfig: vi.fn(),
}));

import { getLoginFlow } from "@/lib/ory/flow";
import { getOryConfig } from "@/ory.config";

const config = getOryConfig();

beforeEach(() => {
    vi.clearAllMocks();

    mockHeaders.mockResolvedValue(
        new Headers({
            host: "cuentaunica.gob.do",
            "x-forwarded-proto": "https",
            cookie: "ory_session=test-session; csrf_token=csrf-123",
        }),
    );

    mockGetFlowFactory.mockResolvedValue({
        flow: { id: "login-flow-123" },
        flowUiUrl: "/login",
    });
});

describe("getLoginFlow", () => {
    it("resolves the public URL from request headers and forwards to Ory", async () => {
        const params = Promise.resolve({ flow: "login-flow-123" });

        await getLoginFlow(config, params);

        expect(mockGetFlowFactory).toHaveBeenCalledWith(
            expect.objectContaining({
                flow: "login-flow-123",
                return_to: "https://cuentaunica.gob.do/",
            }),
            expect.any(Function),
            "login",
            "https://cuentaunica.gob.do",
            "/login",
        );
    });

    it("preserves an existing return_to parameter", async () => {
        const params = Promise.resolve({
            flow: "login-flow-456",
            return_to: "https://cuentaunica.gob.do/dashboard",
        });

        await getLoginFlow(config, params);

        expect(mockGetFlowFactory).toHaveBeenCalledWith(
            expect.objectContaining({
                flow: "login-flow-456",
                return_to: "https://cuentaunica.gob.do/dashboard",
            }),
            expect.any(Function),
            "login",
            "https://cuentaunica.gob.do",
            "/login",
        );
    });

    it("injects return_to when it is missing from params", async () => {
        const params = Promise.resolve({ flow: "login-flow-789" });

        await getLoginFlow(config, params);

        const factoryCall = mockGetFlowFactory.mock.calls[0];
        expect(factoryCall[0].return_to).toBe("https://cuentaunica.gob.do/");
    });

    it("uses x-forwarded-proto header for URL resolution", async () => {
        mockHeaders.mockResolvedValue(
            new Headers({
                host: "staging.cuentaunica.gob.do",
                "x-forwarded-proto": "http",
                cookie: "ory_session=test",
            }),
        );

        const params = Promise.resolve({ flow: "flow-http" });

        await getLoginFlow(config, params);

        const factoryCall = mockGetFlowFactory.mock.calls[0];
        expect(factoryCall[0].return_to).toBe("http://staging.cuentaunica.gob.do/");
        expect(factoryCall[3]).toBe("http://staging.cuentaunica.gob.do");
    });

    it("defaults to https when x-forwarded-proto is absent", async () => {
        mockHeaders.mockResolvedValue(
            new Headers({
                host: "cuentaunica.gob.do",
                cookie: "ory_session=test",
            }),
        );

        const params = Promise.resolve({ flow: "flow-no-proto" });

        await getLoginFlow(config, params);

        const factoryCall = mockGetFlowFactory.mock.calls[0];
        expect(factoryCall[0].return_to).toBe("https://cuentaunica.gob.do/");
    });

    it("forwards browser cookies to the Ory client", async () => {
        const params = Promise.resolve({ flow: "flow-cookies" });

        await getLoginFlow(config, params);

        const createFlowFn = mockGetFlowFactory.mock.calls[0][1];
        mockGetLoginFlowRaw.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: "flow-cookies" }),
        });

        await createFlowFn();

        expect(mockGetLoginFlowRaw).toHaveBeenCalledWith(
            expect.objectContaining({
                cookie: "ory_session=test-session; csrf_token=csrf-123",
            }),
            { cache: "no-cache" },
        );
    });

    it("passes the login_ui_url from config as the UI URL", async () => {
        const params = Promise.resolve({ flow: "flow-ui-url" });

        await getLoginFlow(config, params);

        const factoryCall = mockGetFlowFactory.mock.calls[0];
        expect(factoryCall[4]).toBe("/login");
    });

    it("handles missing flow parameter gracefully", async () => {
        const params = Promise.resolve({});

        await getLoginFlow(config, params);

        const factoryCall = mockGetFlowFactory.mock.calls[0];
        expect(factoryCall[0].flow).toBeUndefined();
    });
});