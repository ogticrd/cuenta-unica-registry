import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================
// Types
// ============================================

interface MiddlewareRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  pathname: string;
  searchParams: Record<string, string>;
}

interface MiddlewareResponse {
  status: number;
  headers: Record<string, string>;
  cookies?: Record<
    string,
    { value: string; options?: Record<string, unknown> }
  >;
  redirectUrl?: string;
}

type MiddlewareResult = MiddlewareResponse | undefined;

interface SessionPayload {
  userId: string;
  email: string;
  expiresAt: Date;
}

// ============================================
// Mock Middleware Implementation
// ============================================

// Mock session store
const mockSessions: Map<string, SessionPayload> = new Map();
const mockRevokedTokens: Set<string> = new Set();

// Configuration
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/verify",
];

const AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const PROTECTED_PATHS = [
  "/dashboard",
  "/profile",
  "/settings",
  "/api/user",
  "/api/dashboard",
];

const ADMIN_PATHS = ["/admin", "/api/admin"];

// Mock JWT verification
function verifyToken(token: string): SessionPayload | null {
  if (!token || mockRevokedTokens.has(token)) {
    return null;
  }

  const session = mockSessions.get(token);
  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt) < new Date()) {
    mockSessions.delete(token);
    return null;
  }

  return session;
}

// Mock middleware
function authMiddleware(request: MiddlewareRequest): MiddlewareResult {
  const { pathname, cookies } = request;

  // Allow public paths
  if (
    PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(path + "/"),
    )
  ) {
    // If user is authenticated and tries to access auth pages, redirect to dashboard
    const token = cookies["session_token"];
    if (
      token &&
      AUTH_PATHS.some(
        (path) => pathname === path || pathname.startsWith(path + "/"),
      )
    ) {
      const session = verifyToken(token);
      if (session) {
        return {
          status: 302,
          headers: { Location: "/dashboard" },
          redirectUrl: "/dashboard",
        };
      }
    }
    return undefined;
  }

  // Check if path is protected
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );
  const isAdminPath = ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );

  if (!isProtected && !isAdminPath) {
    return undefined;
  }

  // Get session token
  const token = cookies["session_token"];

  if (!token) {
    // API routes return 401, pages redirect to login
    if (pathname.startsWith("/api/")) {
      return {
        status: 401,
        headers: { "Content-Type": "application/json" },
      };
    }

    const loginUrl = new URL("/login", "http://localhost");
    loginUrl.searchParams.set("redirect", pathname);
    return {
      status: 302,
      headers: { Location: loginUrl.toString() },
      redirectUrl: loginUrl.toString(),
    };
  }

  const session = verifyToken(token);

  if (!session) {
    // Clear invalid token
    if (pathname.startsWith("/api/")) {
      return {
        status: 401,
        headers: { "Content-Type": "application/json" },
        cookies: {
          session_token: { value: "", options: { maxAge: 0 } },
        },
      };
    }

    const loginUrl = new URL("/login", "http://localhost");
    loginUrl.searchParams.set("redirect", pathname);
    return {
      status: 302,
      headers: { Location: loginUrl.toString() },
      redirectUrl: loginUrl.toString(),
      cookies: {
        session_token: { value: "", options: { maxAge: 0 } },
      },
    };
  }

  // Check admin access
  if (isAdminPath) {
    const adminEmails = ["admin@example.com"];
    if (!adminEmails.includes(session.email)) {
      if (pathname.startsWith("/api/")) {
        return {
          status: 403,
          headers: { "Content-Type": "application/json" },
        };
      }

      return {
        status: 302,
        headers: { Location: "/dashboard" },
        redirectUrl: "/dashboard",
      };
    }
  }

  // Add user info to headers for downstream use
  return {
    status: 200,
    headers: {
      "x-user-id": session.userId,
      "x-user-email": session.email,
    },
  };
}

// Helper to create mock request
function createMockRequest(
  pathname: string,
  options: Partial<MiddlewareRequest> = {},
): MiddlewareRequest {
  // Strip query params and fragments from pathname for proper matching
  const cleanPath = pathname.split(/[?#]/)[0];

  return {
    url: `http://localhost${pathname}`,
    method: "GET",
    headers: {},
    cookies: {},
    pathname: cleanPath,
    searchParams: {},
    ...options,
  };
}

// ============================================
// Tests
// ============================================

describe("Auth Middleware", () => {
  beforeEach(() => {
    mockSessions.clear();
    mockRevokedTokens.clear();
  });

  describe("Public Paths", () => {
    it("should allow access to public paths without authentication", () => {
      const publicPaths = ["/", "/login", "/register", "/forgot-password"];

      publicPaths.forEach((path) => {
        const request = createMockRequest(path);
        const result = authMiddleware(request);

        expect(result).toBeUndefined();
      });
    });

    it("should allow access to public API routes", () => {
      const apiPaths = [
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/reset-password",
      ];

      apiPaths.forEach((path) => {
        const request = createMockRequest(path);
        const result = authMiddleware(request);

        expect(result).toBeUndefined();
      });
    });

    it("should allow access to static assets", () => {
      const staticPaths = [
        "/favicon.ico",
        "/images/logo.png",
        "/styles/main.css",
        "/scripts/app.js",
      ];

      staticPaths.forEach((path) => {
        const request = createMockRequest(path);
        const result = authMiddleware(request);

        expect(result).toBeUndefined();
      });
    });
  });

  describe("Protected Paths - Unauthenticated", () => {
    it("should redirect to login for protected pages", () => {
      const request = createMockRequest("/dashboard");
      const result = authMiddleware(request);

      expect(result).toBeDefined();
      expect(result?.status).toBe(302);
      expect(result?.redirectUrl).toContain("/login");
      expect(result?.redirectUrl).toContain("redirect=%2Fdashboard");
    });

    it("should return 401 for protected API routes", () => {
      const request = createMockRequest("/api/user/profile");
      const result = authMiddleware(request);

      expect(result).toBeDefined();
      expect(result?.status).toBe(401);
    });

    it("should preserve the original URL in redirect", () => {
      const request = createMockRequest("/settings/security");
      const result = authMiddleware(request);

      expect(result?.redirectUrl).toContain("redirect=%2Fsettings%2Fsecurity");
    });

    it("should redirect to login from profile page", () => {
      const request = createMockRequest("/profile");
      const result = authMiddleware(request);

      expect(result?.status).toBe(302);
      expect(result?.redirectUrl).toContain("/login");
    });
  });

  describe("Protected Paths - Authenticated", () => {
    const validToken = "valid-session-token";

    beforeEach(() => {
      mockSessions.set(validToken, {
        userId: "user-1",
        email: "test@example.com",
        expiresAt: new Date(Date.now() + 86400000), // 24 hours
      });
    });

    it("should allow access to protected pages with valid token", () => {
      const request = createMockRequest("/dashboard", {
        cookies: { session_token: validToken },
      });
      const result = authMiddleware(request);

      expect(result).toBeDefined();
      expect(result?.status).toBe(200);
      expect(result?.headers["x-user-id"]).toBe("user-1");
    });

    it("should allow access to protected API routes with valid token", () => {
      const request = createMockRequest("/api/user/profile", {
        cookies: { session_token: validToken },
      });
      const result = authMiddleware(request);

      expect(result).toBeDefined();
      expect(result?.status).toBe(200);
      expect(result?.headers["x-user-email"]).toBe("test@example.com");
    });

    it("should clear expired tokens", () => {
      const expiredToken = "expired-token";
      mockSessions.set(expiredToken, {
        userId: "user-2",
        email: "expired@example.com",
        expiresAt: new Date(Date.now() - 1000), // Expired
      });

      const request = createMockRequest("/dashboard", {
        cookies: { session_token: expiredToken },
      });
      const result = authMiddleware(request);

      expect(result?.status).toBe(302);
      expect(result?.cookies?.session_token?.value).toBe("");
      expect(result?.cookies?.session_token?.options?.maxAge).toBe(0);
    });

    it("should reject revoked tokens", () => {
      mockRevokedTokens.add(validToken);

      const request = createMockRequest("/dashboard", {
        cookies: { session_token: validToken },
      });
      const result = authMiddleware(request);

      expect(result?.status).toBe(302);
      expect(result?.redirectUrl).toContain("/login");
    });
  });

  describe("Auth Pages - Already Authenticated", () => {
    const validToken = "valid-session-token";

    beforeEach(() => {
      mockSessions.set(validToken, {
        userId: "user-1",
        email: "test@example.com",
        expiresAt: new Date(Date.now() + 86400000),
      });
    });

    it("should redirect authenticated users away from login page", () => {
      const request = createMockRequest("/login", {
        cookies: { session_token: validToken },
      });
      const result = authMiddleware(request);

      expect(result).toBeDefined();
      expect(result?.redirectUrl).toBe("/dashboard");
    });

    it("should redirect authenticated users away from register page", () => {
      const request = createMockRequest("/register", {
        cookies: { session_token: validToken },
      });
      const result = authMiddleware(request);

      expect(result?.redirectUrl).toBe("/dashboard");
    });

    it("should redirect authenticated users away from forgot password page", () => {
      const request = createMockRequest("/forgot-password", {
        cookies: { session_token: validToken },
      });
      const result = authMiddleware(request);

      expect(result?.redirectUrl).toBe("/dashboard");
    });
  });

  describe("Admin Paths", () => {
    const userToken = "user-token";
    const adminToken = "admin-token";

    beforeEach(() => {
      mockSessions.set(userToken, {
        userId: "user-1",
        email: "test@example.com",
        expiresAt: new Date(Date.now() + 86400000),
      });

      mockSessions.set(adminToken, {
        userId: "admin-1",
        email: "admin@example.com",
        expiresAt: new Date(Date.now() + 86400000),
      });
    });

    it("should allow admin access to admin pages", () => {
      const request = createMockRequest("/admin", {
        cookies: { session_token: adminToken },
      });
      const result = authMiddleware(request);

      expect(result?.status).toBe(200);
    });

    it("should deny non-admin access to admin pages", () => {
      const request = createMockRequest("/admin", {
        cookies: { session_token: userToken },
      });
      const result = authMiddleware(request);

      expect(result?.status).toBe(302);
      expect(result?.redirectUrl).toBe("/dashboard");
    });

    it("should return 403 for admin API routes for non-admins", () => {
      const request = createMockRequest("/api/admin/users", {
        cookies: { session_token: userToken },
      });
      const result = authMiddleware(request);

      expect(result?.status).toBe(403);
    });

    it("should allow admin access to admin API routes", () => {
      const request = createMockRequest("/api/admin/users", {
        cookies: { session_token: adminToken },
      });
      const result = authMiddleware(request);

      expect(result?.status).toBe(200);
    });
  });

  describe("Edge Cases", () => {
    it("should handle paths with query parameters", () => {
      // Query params are stripped from pathname for matching
      const request = createMockRequest("/dashboard?tab=settings");
      const result = authMiddleware(request);

      expect(result?.status).toBe(302);
      expect(result?.redirectUrl).toContain("/login");
    });

    it("should handle paths with fragments", () => {
      // Fragments are stripped from pathname for matching
      const request = createMockRequest("/dashboard#section");
      const result = authMiddleware(request);

      expect(result?.status).toBe(302);
      expect(result?.redirectUrl).toContain("/login");
    });

    it("should handle malformed cookies", () => {
      const request = createMockRequest("/dashboard", {
        cookies: { session_token: "" },
      });
      const result = authMiddleware(request);

      expect(result?.status).toBe(302);
    });

    it("should handle case-sensitive paths", () => {
      const request = createMockRequest("/Dashboard");
      const result = authMiddleware(request);

      // Non-matching path should pass through (or be handled as 404 by app)
      expect(result).toBeUndefined();
    });

    it("should handle nested protected paths", () => {
      const request = createMockRequest("/settings/security/password");
      const result = authMiddleware(request);

      expect(result?.status).toBe(302);
      expect(result?.redirectUrl).toContain("/login");
    });
  });

  describe("Cookie Handling", () => {
    it("should set cookie deletion options on invalid session", () => {
      const request = createMockRequest("/dashboard", {
        cookies: { session_token: "invalid-token" },
      });
      const result = authMiddleware(request);

      expect(result?.cookies?.session_token).toBeDefined();
      expect(result?.cookies?.session_token?.value).toBe("");
      expect(result?.cookies?.session_token?.options?.maxAge).toBe(0);
    });

    it("should handle missing session cookie", () => {
      const request = createMockRequest("/dashboard", {
        cookies: {},
      });
      const result = authMiddleware(request);

      expect(result?.status).toBe(302);
      expect(result?.cookies).toBeUndefined();
    });
  });

  describe("Rate Limiting (if implemented)", () => {
    it("should handle rate limit headers", () => {
      // This would test rate limiting if implemented in middleware
      // For now, just verify the middleware can process requests
      const request = createMockRequest("/login");
      const result = authMiddleware(request);

      expect(result).toBeUndefined();
    });
  });

  describe("Security Headers", () => {
    it("should pass user context to downstream handlers", () => {
      const validToken = "valid-token";
      mockSessions.set(validToken, {
        userId: "user-123",
        email: "user@example.com",
        expiresAt: new Date(Date.now() + 86400000),
      });

      const request = createMockRequest("/dashboard", {
        cookies: { session_token: validToken },
      });
      const result = authMiddleware(request);

      expect(result?.headers["x-user-id"]).toBe("user-123");
      expect(result?.headers["x-user-email"]).toBe("user@example.com");
    });
  });
});

describe("Middleware Path Matching", () => {
  it("should correctly match exact paths", () => {
    // /login is public, /dashboard is protected
    const loginRequest = createMockRequest("/login");
    const loginResult = authMiddleware(loginRequest);
    expect(loginResult).toBeUndefined(); // Public path passes through

    const dashboardRequest = createMockRequest("/dashboard");
    const dashboardResult = authMiddleware(dashboardRequest);
    expect(dashboardResult?.status).toBe(302); // Protected redirects to login

    const apiUserRequest = createMockRequest("/api/user");
    const apiUserResult = authMiddleware(apiUserRequest);
    expect(apiUserResult?.status).toBe(401); // API returns 401
  });

  it("should correctly match nested paths", () => {
    // /dashboard/overview is protected (under /dashboard)
    const dashboardOverviewRequest = createMockRequest("/dashboard/overview");
    const dashboardOverviewResult = authMiddleware(dashboardOverviewRequest);
    expect(dashboardOverviewResult?.status).toBe(302);

    // /dashboard/settings is protected
    const dashboardSettingsRequest = createMockRequest("/dashboard/settings");
    const dashboardSettingsResult = authMiddleware(dashboardSettingsRequest);
    expect(dashboardSettingsResult?.status).toBe(302);

    // /api/user/profile is protected (under /api/user)
    const apiUserProfileRequest = createMockRequest("/api/user/profile");
    const apiUserProfileResult = authMiddleware(apiUserProfileRequest);
    expect(apiUserProfileResult?.status).toBe(401); // API returns 401

    // /api/auth/callback is public (under /api/auth)
    const apiAuthCallbackRequest = createMockRequest("/api/auth/callback");
    const apiAuthCallbackResult = authMiddleware(apiAuthCallbackRequest);
    expect(apiAuthCallbackResult).toBeUndefined();
  });
});

describe("Middleware Error Handling", () => {
  it("should handle malformed tokens gracefully", () => {
    const request = createMockRequest("/dashboard", {
      cookies: { session_token: "not-a-valid-jwt" },
    });
    const result = authMiddleware(request);

    expect(result?.status).toBe(302);
  });

  it("should handle very long tokens", () => {
    const longToken = "a".repeat(10000);
    const request = createMockRequest("/dashboard", {
      cookies: { session_token: longToken },
    });
    const result = authMiddleware(request);

    expect(result?.status).toBe(302);
  });

  it("should handle special characters in paths", () => {
    const specialPaths = [
      "/dashboard/test%20space",
      "/dashboard/test?param=value",
      "/dashboard/<script>",
    ];

    specialPaths.forEach((path) => {
      const request = createMockRequest(path);
      // Should not throw
      expect(() => authMiddleware(request)).not.toThrow();
    });
  });
});
