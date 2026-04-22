import { expect, test } from "@playwright/test";
import {
  goToRegistrationStep2,
  goToRegistrationStep3,
  jsonResponse,
  mockPasswordBreachLookup,
  VALID_CEDULA,
} from "./helpers";

test.describe("Registration journeys", () => {
  test("blocks an invalid cedula before citizen lookup", async ({ page }) => {
    let citizenLookupCalled = false;

    await page.route("**/api/registration/citizen", async (route) => {
      citizenLookupCalled = true;
      await jsonResponse(route, { success: true });
    });

    await page.goto("/register");
    await page.locator('input[name="cedula"]').fill("123");
    await page.getByRole("button", { name: "CONTINUAR" }).click();

    await expect(page.locator('input[name="cedula"]')).toHaveValue("123");
    await expect(page.locator('input[name="email"]')).toHaveCount(0);
    expect(citizenLookupCalled).toBe(false);
  });

  test("advances from identification to account and forwards return_url", async ({
    page,
  }) => {
    let capturedBody: { cedula?: string; returnUrl?: string } | null = null;

    await page.route("**/api/registration/citizen", async (route) => {
      capturedBody = JSON.parse(route.request().postData() ?? "{}") as {
        cedula?: string;
        returnUrl?: string;
      };

      await jsonResponse(route, {
        success: true,
        citizen: {
          id: VALID_CEDULA,
          firstName: "Juan",
        },
      });
    });

    await page.goto("/register?return_url=https://example.com/dashboard");
    await page.locator('input[name="cedula"]').fill(VALID_CEDULA);
    await page.getByRole("button", { name: "CONTINUAR" }).click();

    await expect(page.locator('input[name="email"]')).toBeVisible();
    expect(capturedBody).toEqual({
      cedula: VALID_CEDULA,
      returnUrl: "https://example.com/dashboard",
    });
  });

  test("blocks progression to verification when account data is invalid", async ({
    page,
  }) => {
    await mockPasswordBreachLookup(page);
    await goToRegistrationStep2(page);

    await page.locator('input[name="email"]').fill("juan@example.com");
    await page.locator('input[name="confirmEmail"]').fill("otro@example.com");
    await page.locator('input[name="password"]').fill("weak");
    await page.locator('input[name="confirmPassword"]').fill("weak");
    await page.getByRole("button", { name: "CONTINUAR" }).click();

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="confirmEmail"]')).toHaveValue(
      "otro@example.com",
    );
    await expect(page.locator('input[name="password"]')).toHaveValue("weak");
    await expect(
      page.getByRole("button", { name: "INICIAR PROCESO" }),
    ).toHaveCount(0);
  });

  test("advances from account details to the verification step with valid data", async ({
    page,
  }) => {
    await goToRegistrationStep3(page);

    await expect(page.locator("#terms")).toBeVisible();
  });

  test("returns from account to identification by resetting the registration session", async ({
    page,
  }) => {
    await goToRegistrationStep2(page);

    let resetCalled = false;
    await page.route("**/api/registration/session/reset", async (route) => {
      resetCalled = true;
      await jsonResponse(route, { success: true });
    });

    await page.getByRole("button", { name: "Volver al paso anterior" }).click();

    await expect(page.locator('input[name="cedula"]')).toBeVisible();
    expect(resetCalled).toBe(true);
  });
});
