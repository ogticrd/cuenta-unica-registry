import { expect, test } from "@playwright/test";
import { jsonResponse, mockAuthenticatedSession } from "./helpers";

test.describe("Dashboard session flows", () => {
  test("loads the dashboard for an authenticated user and logs out through the real client flow", async ({
    page,
  }) => {
    await mockAuthenticatedSession(page);
    await page.route("**/api/ory/logout", async (route) => {
      await jsonResponse(route, {
        success: true,
        redirect_to: "/login",
      });
    });

    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Juan", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("00100063362")).toBeVisible();

    await page.getByRole("button", { name: "Cerrar sesi\u00f3n" }).click();
    await page.waitForURL(/\/login(\?|$)/);
  });
});
