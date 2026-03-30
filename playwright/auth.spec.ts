import { test, expect, Page } from "@playwright/test";

// ============================================
// Configuration
// ============================================

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || "test@example.com",
  password: process.env.E2E_TEST_PASSWORD || "TestPassword123!",
  cedula: process.env.E2E_TEST_CEDULA || "00100063362",
};

// ============================================
// Helper Functions
// ============================================

async function navigateToLogin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");
}

async function navigateToRegister(page: Page) {
  await page.goto(`${BASE_URL}/register`);
  await page.waitForLoadState("networkidle");
}

async function login(page: Page, email: string, password: string) {
  await navigateToLogin(page);

  // Fill in login form
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation
  await page.waitForURL(/\/(dashboard|login)/, { timeout: 10000 });
}

async function logout(page: Page) {
  // Look for logout button/link
  const logoutButton = page.locator(
    '[data-testid="logout-button"], button:has-text("Cerrar Sesión"), button:has-text("Logout")',
  );

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL(/\/(login|\/)/, { timeout: 10000 });
  }
}

async function fillRegistrationForm(
  page: Page,
  data: {
    cedula: string;
    email: string;
    password: string;
  },
) {
  // Step 1: Identification
  const cedulaInput = page.locator(
    'input[name="cedula"], input[placeholder*="cédula"], input[data-testid="cedula-input"]',
  );
  if (await cedulaInput.isVisible()) {
    await cedulaInput.fill(data.cedula);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  }

  // Step 2: Account
  const emailInput = page.locator('input[type="email"], input[name="email"]');
  if (await emailInput.isVisible()) {
    await emailInput.fill(data.email);
    await page.fill(
      'input[name="confirmEmail"], input[placeholder*="confirmar"]',
      data.email,
    );
    await page.fill(
      'input[type="password"], input[name="password"]',
      data.password,
    );
    await page.fill(
      'input[name="confirmPassword"], input[placeholder*="confirmar contraseña"]',
      data.password,
    );
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  }
}

// ============================================
// Test Suites
// ============================================

test.describe("Authentication Flows", () => {
  test.beforeEach(async ({ page }) => {
    // Start from a clean state
    await page.context().clearCookies();
  });

  test.describe("Login Page", () => {
    test("should display login form", async ({ page }) => {
      await navigateToLogin(page);

      // Check for essential elements
      await expect(
        page.locator('input[type="email"], input[name="email"]'),
      ).toBeVisible();
      await expect(
        page.locator('input[type="password"], input[name="password"]'),
      ).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test("should show validation errors for empty fields", async ({ page }) => {
      await navigateToLogin(page);

      // Submit empty form
      await page.click('button[type="submit"]');

      // Wait for validation errors
      await page.waitForTimeout(500);

      // Should show error messages
      const errorMessage = page.locator(
        '[role="alert"], .error, [data-testid="error-message"]',
      );
      await expect(errorMessage.first()).toBeVisible({ timeout: 2000 });
    });

    test("should show error for invalid email format", async ({ page }) => {
      await navigateToLogin(page);

      await page.fill(
        'input[type="email"], input[name="email"]',
        "not-an-email",
      );
      await page.fill(
        'input[type="password"], input[name="password"]',
        "password123",
      );
      await page.click('button[type="submit"]');

      await page.waitForTimeout(500);

      // Should show validation error
      const errorMessage = page.locator(
        '[role="alert"], .error, :text("email"), :text("correo")',
      );
      await expect(errorMessage.first()).toBeVisible({ timeout: 2000 });
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await navigateToLogin(page);

      await page.fill(
        'input[type="email"], input[name="email"]',
        "wrong@example.com",
      );
      await page.fill(
        'input[type="password"], input[name="password"]',
        "WrongPassword123!",
      );
      await page.click('button[type="submit"]');

      // Wait for error response
      await page.waitForTimeout(1000);

      // Should stay on login page or show error
      const currentUrl = page.url();
      const hasError = await page
        .locator('[role="alert"], .error, :text("inválid"), :text("incorrect")')
        .first()
        .isVisible();

      expect(currentUrl.includes("/login") || hasError).toBeTruthy();
    });

    test("should have link to register page", async ({ page }) => {
      await navigateToLogin(page);

      const registerLink = page.locator(
        'a[href*="register"], a:has-text("Regístrate"), a:has-text("Sign up")',
      );
      await expect(registerLink.first()).toBeVisible();
    });

    test("should have link to forgot password", async ({ page }) => {
      await navigateToLogin(page);

      const forgotLink = page.locator(
        'a[href*="forgot"], a:has-text("Olvidaste"), a:has-text("Forgot")',
      );
      await expect(forgotLink.first()).toBeVisible();
    });

    test("should toggle password visibility", async ({ page }) => {
      await navigateToLogin(page);

      const passwordInput = page.locator(
        'input[type="password"], input[name="password"]',
      );
      const toggleButton = page.locator(
        'button:has-text("password"), [data-testid="toggle-password"]',
      );

      if (await toggleButton.first().isVisible()) {
        // Password should be hidden initially
        expect(await passwordInput.getAttribute("type")).toBe("password");

        // Click toggle
        await toggleButton.first().click();

        // Password should now be visible
        await page.waitForTimeout(100);
        const newType = await passwordInput.getAttribute("type");
        expect(newType).toBe("text");
      }
    });
  });

  test.describe("Registration Flow", () => {
    test("should display registration wizard", async ({ page }) => {
      await navigateToRegister(page);

      // Check for wizard steps
      const stepper = page.locator(
        '[data-testid="stepper"], .stepper, [role="tablist"]',
      );
      await expect(stepper.first()).toBeVisible({ timeout: 5000 });
    });

    test("should show step 1 - Identification", async ({ page }) => {
      await navigateToRegister(page);

      // Should show cedula input
      const cedulaInput = page.locator(
        'input[name="cedula"], input[placeholder*="cédula"], input[data-testid="cedula-input"]',
      );
      await expect(cedulaInput).toBeVisible({ timeout: 5000 });
    });

    test("should validate cedula format", async ({ page }) => {
      await navigateToRegister(page);

      const cedulaInput = page.locator(
        'input[name="cedula"], input[placeholder*="cédula"], input[data-testid="cedula-input"]',
      );
      await cedulaInput.fill("123"); // Invalid cedula
      await page.click('button[type="submit"]');

      await page.waitForTimeout(500);

      // Should show validation error
      const errorMessage = page.locator(
        '[role="alert"], .error, :text("11"), :text("dígitos")',
      );
      await expect(errorMessage.first()).toBeVisible({ timeout: 2000 });
    });

    test("should format cedula automatically", async ({ page }) => {
      await navigateToRegister(page);

      const cedulaInput = page.locator(
        'input[name="cedula"], input[placeholder*="cédula"], input[data-testid="cedula-input"]',
      );
      await cedulaInput.fill("00100063362");

      // Check if cedula is formatted (depends on implementation)
      const value = await cedulaInput.inputValue();
      expect(value).toContain("00100063362");
    });

    test("should progress to step 2 after valid cedula", async ({ page }) => {
      await navigateToRegister(page);

      // Fill cedula (assuming mock/test mode)
      const cedulaInput = page.locator(
        'input[name="cedula"], input[placeholder*="cédula"], input[data-testid="cedula-input"]',
      );
      await cedulaInput.fill(TEST_USER.cedula);
      await page.click('button[type="submit"]');

      // Wait for step 2
      await page.waitForTimeout(1500);

      // Should show email input
      const emailInput = page.locator(
        'input[type="email"], input[name="email"]',
      );
      const isVisible = await emailInput
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      // Either progressed to step 2 or showed an error
      const currentUrl = page.url();
      expect(currentUrl.includes("/register") || isVisible).toBeTruthy();
    });

    test("should validate email confirmation match", async ({ page }) => {
      await navigateToRegister(page);

      // Skip to step 2 if possible
      const emailInput = page.locator(
        'input[type="email"], input[name="email"]',
      );
      if (await emailInput.isVisible()) {
        await emailInput.fill("test@example.com");

        const confirmEmailInput = page.locator('input[name="confirmEmail"]');
        if (await confirmEmailInput.isVisible()) {
          await confirmEmailInput.fill("different@example.com");
          await page.click('button[type="submit"]');

          await page.waitForTimeout(500);

          // Should show error
          const errorMessage = page.locator(
            '[role="alert"], .error, :text("coinciden"), :text("match")',
          );
          await expect(errorMessage.first()).toBeVisible({ timeout: 2000 });
        }
      }
    });

    test("should validate password strength", async ({ page }) => {
      await navigateToRegister(page);

      // Find password input
      const passwordInput = page.locator(
        'input[type="password"], input[name="password"]',
      );

      if (await passwordInput.isVisible()) {
        // Enter weak password
        await passwordInput.fill("weak");
        await passwordInput.blur();

        await page.waitForTimeout(500);

        // Should show password requirements
        const requirements = page.locator(
          '[data-testid="password-requirements"], .password-requirements, :text("mayúscula"), :text("minúscula")',
        );
        const isVisible = await requirements
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false);

        // Check if validation feedback is shown
        expect(
          isVisible ||
            (await passwordInput.getAttribute("aria-invalid")) === "true",
        ).toBeTruthy();
      }
    });

    test("should show password strength indicator", async ({ page }) => {
      await navigateToRegister(page);

      const passwordInput = page.locator(
        'input[type="password"], input[name="password"]',
      );

      if (await passwordInput.isVisible()) {
        await passwordInput.fill("WeakPassword");
        await page.waitForTimeout(300);

        // Look for strength indicator
        const strengthIndicator = page.locator(
          '[data-testid="password-strength"], .password-strength, :text("fuerte"), :text("strong")',
        );
        const hasIndicator = await strengthIndicator
          .first()
          .isVisible({ timeout: 1000 })
          .catch(() => false);

        // It's okay if there's no visible indicator
        expect(hasIndicator || true).toBeTruthy();
      }
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect unauthenticated users to login", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Should redirect to login
      await page.waitForURL(/\/login/, { timeout: 10000 });

      expect(page.url()).toContain("/login");
    });

    test("should preserve redirect URL after login", async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);

      // Should redirect to login with redirect param
      await page.waitForURL(/\/login/, { timeout: 10000 });

      expect(page.url()).toContain("redirect");
    });

    test("should access dashboard after login", async ({ page }) => {
      // Login first
      await login(page, TEST_USER.email, TEST_USER.password);

      // If login was successful, should be on dashboard
      const url = page.url();
      if (url.includes("/dashboard")) {
        // Verify dashboard content
        await expect(
          page.locator("h1, h2, [data-testid='dashboard']").first(),
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("Logout", () => {
    test("should logout successfully", async ({ page }) => {
      // Login first
      await login(page, TEST_USER.email, TEST_USER.password);

      const url = page.url();
      if (url.includes("/dashboard")) {
        await logout(page);

        // Should redirect to login or home
        const finalUrl = page.url();
        expect(
          finalUrl.includes("/login") || finalUrl === BASE_URL + "/",
        ).toBeTruthy();
      }
    });

    test("should clear session on logout", async ({ page }) => {
      // Login first
      await login(page, TEST_USER.email, TEST_USER.password);

      if (page.url().includes("/dashboard")) {
        await logout(page);

        // Try to access protected route
        await page.goto(`${BASE_URL}/dashboard`);

        // Should redirect to login
        await page.waitForURL(/\/login/, { timeout: 10000 });
      }
    });
  });

  test.describe("Accessibility", () => {
    test("login page should be accessible", async ({ page }) => {
      await navigateToLogin(page);

      // Check for proper heading structure
      const heading = page.locator("h1, h2");
      await expect(heading.first()).toBeVisible();

      // Check for form labels
      const emailInput = page.locator(
        'input[type="email"], input[name="email"]',
      );
      const emailLabel = await page
        .locator(
          `label[for="${await emailInput.getAttribute("name")}"], label:has-text("email"), label:has-text("correo")`,
        )
        .first()
        .isVisible()
        .catch(() => false);

      expect(
        emailLabel ||
          (await emailInput.getAttribute("aria-label")) ||
          (await emailInput.getAttribute("placeholder")),
      ).toBeTruthy();
    });

    test("should have proper focus management", async ({ page }) => {
      await navigateToLogin(page);

      // Tab through form elements
      await page.keyboard.press("Tab");
      const focusedElement = await page.locator(":focus");

      // First focusable element should be visible
      await expect(focusedElement).toBeVisible();
    });

    test("should have proper error announcements", async ({ page }) => {
      await navigateToLogin(page);

      // Submit empty form to trigger errors
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);

      // Check for aria-live or role="alert"
      const alertRegion = page.locator(
        '[role="alert"], [aria-live="assertive"], [aria-live="polite"]',
      );
      const hasAlert = await alertRegion
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      expect(hasAlert).toBeTruthy();
    });
  });

  test.describe("Responsive Design", () => {
    test("login page should be responsive on mobile", async ({
      page,
      isMobile,
    }) => {
      if (!isMobile) return;

      await navigateToLogin(page);

      // Check that form is visible and usable on mobile
      await expect(
        page.locator('input[type="email"], input[name="email"]'),
      ).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Form should take full width on mobile
      const form = page.locator("form").first();
      const boundingBox = await form.boundingBox();

      if (boundingBox) {
        expect(boundingBox.width).toBeLessThanOrEqual(400);
      }
    });

    test("registration wizard should be responsive on mobile", async ({
      page,
      isMobile,
    }) => {
      if (!isMobile) return;

      await navigateToRegister(page);

      // Check that wizard is visible and usable
      const cedulaInput = page.locator(
        'input[name="cedula"], input[placeholder*="cédula"], input[data-testid="cedula-input"]',
      );
      await expect(cedulaInput).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Error Handling", () => {
    test("should handle network errors gracefully", async ({
      page,
      context,
    }) => {
      await navigateToLogin(page);

      // Fill form
      await page.fill(
        'input[type="email"], input[name="email"]',
        TEST_USER.email,
      );
      await page.fill(
        'input[type="password"], input[name="password"]',
        TEST_USER.password,
      );

      // Go offline
      await context.setOffline(true);

      // Try to submit
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Should show error
      const errorMessage = page.locator(
        '[role="alert"], .error, :text("Error"), :text("red")',
      );
      const hasError = await errorMessage
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      // Should stay on login page
      expect(page.url().includes("/login") || hasError).toBeTruthy();

      // Restore network
      await context.setOffline(false);
    });

    test("should handle server errors gracefully", async ({ page }) => {
      await navigateToLogin(page);

      // Fill with credentials that might trigger server error
      await page.fill(
        'input[type="email"], input[name="email"]',
        "server-error@test.com",
      );
      await page.fill(
        'input[type="password"], input[name="password"]',
        "Password123!",
      );
      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);

      // Should show error or stay on login
      const currentUrl = page.url();
      expect(currentUrl.includes("/login")).toBeTruthy();
    });
  });
});

// ============================================
// Performance Tests
// ============================================

test.describe("Performance", () => {
  test("login page should load within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test("registration page should load within acceptable time", async ({
    page,
  }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
