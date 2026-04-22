import { expect, type Page, type Route } from "@playwright/test";

export const VALID_CEDULA = "40200612345";

export function jsonResponse(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

export async function mockUnauthenticatedSession(page: Page) {
  await page.route("**/api/ory/session", async (route) => {
    await jsonResponse(route, { isAuthenticated: false });
  });
}

export async function mockAuthenticatedSession(page: Page) {
  await page.route("**/api/ory/session", async (route) => {
    await jsonResponse(route, {
      isAuthenticated: true,
      identity: {
        id: "user-1",
        traits: {
          email: "juan@example.com",
          name: {
            first: "Juan",
            last: "Perez",
          },
          username: "00100063362",
        },
      },
      session: {
        id: "session-1",
        authenticated_at: "2026-03-31T10:00:00.000Z",
        authenticator_assurance_level: "aal2",
        identity: {
          verifiable_addresses: [{ value: "juan@example.com", verified: true }],
        },
        other_sessions: [],
      },
      otherSessions: [],
    });
  });
}

export async function mockPasswordBreachLookup(page: Page) {
  await page.route("https://api.pwnedpasswords.com/range/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/plain",
      body: "",
    });
  });
}

export async function goToRegistrationStep2(page: Page) {
  await page.route("**/api/registration/citizen", async (route) => {
    await jsonResponse(route, {
      success: true,
      citizen: {
        id: VALID_CEDULA,
        firstName: "Juan",
      },
    });
  });

  await page.goto("/register");
  await page.locator('input[name="cedula"]').fill(VALID_CEDULA);
  await page.getByRole("button", { name: "CONTINUAR" }).click();
  await expect(page.locator('input[name="email"]')).toBeVisible();
}

export async function goToRegistrationStep3(page: Page) {
  await mockPasswordBreachLookup(page);
  await goToRegistrationStep2(page);

  await page.locator('input[name="email"]').fill("juan@example.com");
  await page.locator('input[name="confirmEmail"]').fill("juan@example.com");
  await page.locator('input[name="password"]').fill("Segura!Clave123");
  await page.locator('input[name="confirmPassword"]').fill("Segura!Clave123");
  await page.getByRole("button", { name: "CONTINUAR" }).click();
  await expect(
    page.getByRole("button", { name: "INICIAR PROCESO" }),
  ).toBeVisible();
}
