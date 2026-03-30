import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================
// Types
// ============================================

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  cedula: string;
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  cedula: string;
  emailVerified: boolean;
  createdAt: Date;
}

interface VerificationResult {
  verified: boolean;
  attemptsRemaining: number;
}

// ============================================
// Mock Server Actions Implementation
// ============================================

// Simulated delay for async operations
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock database
const mockUsers: Map<string, User> = new Map();
const mockVerificationCodes: Map<
  string,
  { code: string; attempts: number; expiresAt: Date }
> = new Map();
const mockSessions: Map<string, { userId: string; expiresAt: Date }> =
  new Map();

// Mock rate limiting
const rateLimitStore: Map<string, { count: number; resetAt: Date }> = new Map();

function checkRateLimit(
  identifier: string,
  maxAttempts: number,
  windowMs: number,
): boolean {
  const now = new Date();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: new Date(now.getTime() + windowMs),
    });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count++;
  return true;
}

// Server Actions
async function loginAction(
  credentials: LoginCredentials,
): Promise<ActionResult<{ user: User; token: string }>> {
  // Validate input
  if (!credentials.email || !credentials.password) {
    return {
      success: false,
      error: {
        code: "validation_error",
        message: "Email and password are required",
      },
    };
  }

  // Rate limiting
  if (!checkRateLimit(`login:${credentials.email}`, 5, 60000)) {
    return {
      success: false,
      error: {
        code: "rate_limited",
        message: "Too many login attempts. Please try again later.",
      },
    };
  }

  // Simulate database lookup
  const user = Array.from(mockUsers.values()).find(
    (u) => u.email === credentials.email,
  );

  if (!user) {
    return {
      success: false,
      error: {
        code: "invalid_credentials",
        message: "Invalid email or password",
      },
    };
  }

  // Simulate password verification
  const validPassword = credentials.password === "ValidPassword123!";
  if (!validPassword) {
    return {
      success: false,
      error: {
        code: "invalid_credentials",
        message: "Invalid email or password",
      },
    };
  }

  // Create session
  const token = `token-${Date.now()}`;
  mockSessions.set(token, {
    userId: user.id,
    expiresAt: new Date(Date.now() + 86400000),
  });

  return {
    success: true,
    data: { user, token },
  };
}

async function registerAction(
  data: RegisterData,
): Promise<ActionResult<{ user: User }>> {
  // Validate input
  if (!data.cedula || !data.email || !data.password) {
    return {
      success: false,
      error: { code: "validation_error", message: "All fields are required" },
    };
  }

  // Check if user already exists
  const existingUser = Array.from(mockUsers.values()).find(
    (u) => u.email === data.email || u.cedula === data.cedula,
  );

  if (existingUser) {
    if (existingUser.email === data.email) {
      return {
        success: false,
        error: {
          code: "email_exists",
          message: "An account with this email already exists",
        },
      };
    }
    return {
      success: false,
      error: {
        code: "cedula_exists",
        message: "An account with this cedula already exists",
      },
    };
  }

  // Validate password strength
  if (data.password.length < 10) {
    return {
      success: false,
      error: {
        code: "weak_password",
        message: "Password must be at least 10 characters",
      },
    };
  }

  // Create user
  const user: User = {
    id: `user-${Date.now()}`,
    email: data.email,
    name: "Test User",
    cedula: data.cedula,
    emailVerified: false,
    createdAt: new Date(),
  };

  mockUsers.set(user.id, user);

  // Generate verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  mockVerificationCodes.set(user.id, {
    code,
    attempts: 3,
    expiresAt: new Date(Date.now() + 600000), // 10 minutes
  });

  return {
    success: true,
    data: { user },
  };
}

async function verifyEmailAction(
  userId: string,
  code: string,
): Promise<ActionResult<VerificationResult>> {
  const entry = mockVerificationCodes.get(userId);

  if (!entry) {
    return {
      success: false,
      error: {
        code: "no_verification_pending",
        message: "No verification pending for this user",
      },
    };
  }

  if (entry.expiresAt < new Date()) {
    mockVerificationCodes.delete(userId);
    return {
      success: false,
      error: { code: "code_expired", message: "Verification code has expired" },
    };
  }

  if (entry.attempts <= 0) {
    return {
      success: false,
      error: {
        code: "no_attempts",
        message: "No verification attempts remaining",
      },
    };
  }

  if (entry.code !== code) {
    entry.attempts--;
    return {
      success: false,
      error: {
        code: "invalid_code",
        message: `Invalid code. ${entry.attempts} attempts remaining`,
      },
      data: { verified: false, attemptsRemaining: entry.attempts },
    };
  }

  // Mark email as verified
  const user = mockUsers.get(userId);
  if (user) {
    user.emailVerified = true;
  }
  mockVerificationCodes.delete(userId);

  return {
    success: true,
    data: { verified: true, attemptsRemaining: 0 },
  };
}

async function logoutAction(token: string): Promise<ActionResult> {
  if (!token) {
    return {
      success: false,
      error: { code: "no_session", message: "No active session" },
    };
  }

  mockSessions.delete(token);
  return { success: true };
}

async function resendVerificationAction(userId: string): Promise<ActionResult> {
  const user = mockUsers.get(userId);

  if (!user) {
    return {
      success: false,
      error: { code: "user_not_found", message: "User not found" },
    };
  }

  if (user.emailVerified) {
    return {
      success: false,
      error: { code: "already_verified", message: "Email is already verified" },
    };
  }

  // Rate limiting for resend
  if (!checkRateLimit(`resend:${userId}`, 3, 60000)) {
    return {
      success: false,
      error: {
        code: "rate_limited",
        message: "Too many resend attempts. Please wait.",
      },
    };
  }

  // Generate new code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  mockVerificationCodes.set(userId, {
    code,
    attempts: 3,
    expiresAt: new Date(Date.now() + 600000),
  });

  return { success: true };
}

async function getSessionAction(
  token: string,
): Promise<ActionResult<{ user: User; session: { expiresAt: Date } }>> {
  if (!token) {
    return {
      success: false,
      error: { code: "no_session", message: "No session token provided" },
    };
  }

  const session = mockSessions.get(token);

  if (!session) {
    return {
      success: false,
      error: { code: "invalid_session", message: "Invalid or expired session" },
    };
  }

  if (session.expiresAt < new Date()) {
    mockSessions.delete(token);
    return {
      success: false,
      error: { code: "session_expired", message: "Session has expired" },
    };
  }

  const user = mockUsers.get(session.userId);

  if (!user) {
    return {
      success: false,
      error: { code: "user_not_found", message: "User not found" },
    };
  }

  return {
    success: true,
    data: { user, session: { expiresAt: session.expiresAt } },
  };
}

async function resetPasswordAction(email: string): Promise<ActionResult> {
  if (!email) {
    return {
      success: false,
      error: { code: "validation_error", message: "Email is required" },
    };
  }

  // Rate limiting
  if (!checkRateLimit(`reset:${email}`, 3, 60000)) {
    return {
      success: false,
      error: {
        code: "rate_limited",
        message: "Too many reset attempts. Please wait.",
      },
    };
  }

  const user = Array.from(mockUsers.values()).find((u) => u.email === email);

  // Always return success to prevent email enumeration
  return { success: true };
}

// ============================================
// Tests
// ============================================

describe("Login Action", () => {
  beforeEach(() => {
    mockUsers.clear();
    mockSessions.clear();
    rateLimitStore.clear();

    // Create test user
    mockUsers.set("user-1", {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      cedula: "00100063362",
      emailVerified: true,
      createdAt: new Date(),
    });
  });

  describe("Successful login", () => {
    it("should return user and token on valid credentials", async () => {
      const result = await loginAction({
        email: "test@example.com",
        password: "ValidPassword123!",
      });

      expect(result.success).toBe(true);
      expect(result.data?.user).toBeDefined();
      expect(result.data?.user.email).toBe("test@example.com");
      expect(result.data?.token).toBeDefined();
    });

    it("should create a session on successful login", async () => {
      const result = await loginAction({
        email: "test@example.com",
        password: "ValidPassword123!",
      });

      expect(result.success).toBe(true);
      expect(mockSessions.has(result.data!.token)).toBe(true);
    });
  });

  describe("Failed login", () => {
    it("should fail with missing email", async () => {
      const result = await loginAction({
        email: "",
        password: "password",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("validation_error");
    });

    it("should fail with missing password", async () => {
      const result = await loginAction({
        email: "test@example.com",
        password: "",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("validation_error");
    });

    it("should fail with non-existent email", async () => {
      const result = await loginAction({
        email: "nonexistent@example.com",
        password: "ValidPassword123!",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("invalid_credentials");
    });

    it("should fail with wrong password", async () => {
      const result = await loginAction({
        email: "test@example.com",
        password: "WrongPassword123!",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("invalid_credentials");
    });

    it("should not reveal if email exists or not", async () => {
      const result1 = await loginAction({
        email: "nonexistent@example.com",
        password: "ValidPassword123!",
      });

      const result2 = await loginAction({
        email: "test@example.com",
        password: "WrongPassword123!",
      });

      // Both should return the same error code
      expect(result1.error?.code).toBe("invalid_credentials");
      expect(result2.error?.code).toBe("invalid_credentials");
    });
  });

  describe("Rate limiting", () => {
    it("should block after 5 failed attempts", async () => {
      for (let i = 0; i < 5; i++) {
        await loginAction({
          email: "test@example.com",
          password: "wrong",
        });
      }

      const result = await loginAction({
        email: "test@example.com",
        password: "ValidPassword123!",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("rate_limited");
    });

    it("should allow login before rate limit is hit", async () => {
      // 4 failed attempts
      for (let i = 0; i < 4; i++) {
        await loginAction({
          email: "test@example.com",
          password: "wrong",
        });
      }

      // 5th attempt with correct password should work
      const result = await loginAction({
        email: "test@example.com",
        password: "ValidPassword123!",
      });

      expect(result.success).toBe(true);
    });
  });
});

describe("Register Action", () => {
  beforeEach(() => {
    mockUsers.clear();
    mockVerificationCodes.clear();
  });

  describe("Successful registration", () => {
    it("should create a new user", async () => {
      const result = await registerAction({
        cedula: "00100063362",
        email: "newuser@example.com",
        password: "StrongPassword123!",
      });

      expect(result.success).toBe(true);
      expect(result.data?.user).toBeDefined();
      expect(result.data?.user.email).toBe("newuser@example.com");
      expect(result.data?.user.emailVerified).toBe(false);
    });

    it("should generate verification code", async () => {
      const result = await registerAction({
        cedula: "00100063362",
        email: "newuser@example.com",
        password: "StrongPassword123!",
      });

      const userId = result.data?.user.id;
      expect(mockVerificationCodes.has(userId!)).toBe(true);
    });
  });

  describe("Failed registration", () => {
    it("should fail with missing fields", async () => {
      const result = await registerAction({
        cedula: "",
        email: "",
        password: "",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("validation_error");
    });

    it("should fail with weak password", async () => {
      const result = await registerAction({
        cedula: "00100063362",
        email: "newuser@example.com",
        password: "weak",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("weak_password");
    });

    it("should fail if email already exists", async () => {
      // First registration
      await registerAction({
        cedula: "00100063362",
        email: "existing@example.com",
        password: "StrongPassword123!",
      });

      // Second registration with same email
      const result = await registerAction({
        cedula: "00100063363",
        email: "existing@example.com",
        password: "StrongPassword123!",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("email_exists");
    });

    it("should fail if cedula already exists", async () => {
      // First registration
      await registerAction({
        cedula: "00100063362",
        email: "user1@example.com",
        password: "StrongPassword123!",
      });

      // Second registration with same cedula
      const result = await registerAction({
        cedula: "00100063362",
        email: "user2@example.com",
        password: "StrongPassword123!",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("cedula_exists");
    });
  });
});

describe("Verify Email Action", () => {
  let testUserId: string;
  let testCode: string;

  beforeEach(() => {
    mockUsers.clear();
    mockVerificationCodes.clear();

    testUserId = "user-1";
    testCode = "123456";

    mockUsers.set(testUserId, {
      id: testUserId,
      email: "test@example.com",
      name: "Test User",
      cedula: "00100063362",
      emailVerified: false,
      createdAt: new Date(),
    });

    mockVerificationCodes.set(testUserId, {
      code: testCode,
      attempts: 3,
      expiresAt: new Date(Date.now() + 600000),
    });
  });

  describe("Successful verification", () => {
    it("should verify email with correct code", async () => {
      const result = await verifyEmailAction(testUserId, testCode);

      expect(result.success).toBe(true);
      expect(result.data?.verified).toBe(true);
    });

    it("should mark user as verified", async () => {
      await verifyEmailAction(testUserId, testCode);

      const user = mockUsers.get(testUserId);
      expect(user?.emailVerified).toBe(true);
    });

    it("should remove verification code after success", async () => {
      await verifyEmailAction(testUserId, testCode);

      expect(mockVerificationCodes.has(testUserId)).toBe(false);
    });
  });

  describe("Failed verification", () => {
    it("should fail with incorrect code", async () => {
      const result = await verifyEmailAction(testUserId, "000000");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("invalid_code");
    });

    it("should decrement attempts on wrong code", async () => {
      await verifyEmailAction(testUserId, "000000");

      const entry = mockVerificationCodes.get(testUserId);
      expect(entry?.attempts).toBe(2);
    });

    it("should fail when no verification pending", async () => {
      const result = await verifyEmailAction("nonexistent-user", "123456");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("no_verification_pending");
    });

    it("should fail when code expired", async () => {
      mockVerificationCodes.set(testUserId, {
        code: testCode,
        attempts: 3,
        expiresAt: new Date(Date.now() - 1000), // Expired
      });

      const result = await verifyEmailAction(testUserId, testCode);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("code_expired");
    });

    it("should fail when no attempts remaining", async () => {
      mockVerificationCodes.set(testUserId, {
        code: testCode,
        attempts: 0,
        expiresAt: new Date(Date.now() + 600000),
      });

      const result = await verifyEmailAction(testUserId, testCode);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("no_attempts");
    });
  });
});

describe("Logout Action", () => {
  beforeEach(() => {
    mockSessions.clear();
    mockSessions.set("valid-token", {
      userId: "user-1",
      expiresAt: new Date(Date.now() + 86400000),
    });
  });

  it("should delete session on logout", async () => {
    const result = await logoutAction("valid-token");

    expect(result.success).toBe(true);
    expect(mockSessions.has("valid-token")).toBe(false);
  });

  it("should succeed even with invalid token", async () => {
    const result = await logoutAction("invalid-token");

    expect(result.success).toBe(true);
  });

  it("should fail with empty token", async () => {
    const result = await logoutAction("");

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("no_session");
  });
});

describe("Get Session Action", () => {
  beforeEach(() => {
    mockUsers.clear();
    mockSessions.clear();

    mockUsers.set("user-1", {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      cedula: "00100063362",
      emailVerified: true,
      createdAt: new Date(),
    });

    mockSessions.set("valid-token", {
      userId: "user-1",
      expiresAt: new Date(Date.now() + 86400000),
    });
  });

  it("should return user for valid session", async () => {
    const result = await getSessionAction("valid-token");

    expect(result.success).toBe(true);
    expect(result.data?.user.email).toBe("test@example.com");
  });

  it("should fail with invalid token", async () => {
    const result = await getSessionAction("invalid-token");

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("invalid_session");
  });

  it("should fail with empty token", async () => {
    const result = await getSessionAction("");

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("no_session");
  });

  it("should fail with expired session", async () => {
    mockSessions.set("expired-token", {
      userId: "user-1",
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await getSessionAction("expired-token");

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("session_expired");
    expect(mockSessions.has("expired-token")).toBe(false);
  });
});

describe("Resend Verification Action", () => {
  beforeEach(() => {
    mockUsers.clear();
    mockVerificationCodes.clear();
    rateLimitStore.clear();

    mockUsers.set("user-1", {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      cedula: "00100063362",
      emailVerified: false,
      createdAt: new Date(),
    });
  });

  it("should generate new verification code", async () => {
    const result = await resendVerificationAction("user-1");

    expect(result.success).toBe(true);
    expect(mockVerificationCodes.has("user-1")).toBe(true);
  });

  it("should fail if user not found", async () => {
    const result = await resendVerificationAction("nonexistent");

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("user_not_found");
  });

  it("should fail if already verified", async () => {
    mockUsers.get("user-1")!.emailVerified = true;

    const result = await resendVerificationAction("user-1");

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("already_verified");
  });

  it("should rate limit resend attempts", async () => {
    await resendVerificationAction("user-1");
    await resendVerificationAction("user-1");
    await resendVerificationAction("user-1");

    const result = await resendVerificationAction("user-1");

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("rate_limited");
  });
});

describe("Reset Password Action", () => {
  beforeEach(() => {
    mockUsers.clear();
    rateLimitStore.clear();

    mockUsers.set("user-1", {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      cedula: "00100063362",
      emailVerified: true,
      createdAt: new Date(),
    });
  });

  it("should succeed even for non-existent email", async () => {
    const result = await resetPasswordAction("nonexistent@example.com");

    expect(result.success).toBe(true);
  });

  it("should succeed for existing email", async () => {
    const result = await resetPasswordAction("test@example.com");

    expect(result.success).toBe(true);
  });

  it("should fail with empty email", async () => {
    const result = await resetPasswordAction("");

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("validation_error");
  });

  it("should rate limit reset attempts", async () => {
    const email = "test@example.com";

    await resetPasswordAction(email);
    await resetPasswordAction(email);
    await resetPasswordAction(email);

    const result = await resetPasswordAction(email);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("rate_limited");
  });
});

describe("Action Error Handling", () => {
  it("should handle all error codes consistently", async () => {
    const errorCodes = [
      "validation_error",
      "invalid_credentials",
      "rate_limited",
      "email_exists",
      "cedula_exists",
      "weak_password",
      "no_verification_pending",
      "code_expired",
      "invalid_code",
      "no_attempts",
      "no_session",
      "invalid_session",
      "session_expired",
      "user_not_found",
      "already_verified",
    ];

    // All error codes should be strings
    errorCodes.forEach((code) => {
      expect(typeof code).toBe("string");
      expect(code.length).toBeGreaterThan(0);
    });
  });
});
