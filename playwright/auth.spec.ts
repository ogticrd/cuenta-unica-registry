import { expect, test } from "@playwright/test";
import { mockUnauthenticatedSession } from "./helpers";

test.describe("Authentication routing", () => {
  test("redirects unauthenticated users away from the protected dashboard", async ({
    page,
  }) => {
    await mockUnauthenticatedSession(page);

    await page.goto("/");
    await page.waitForURL(/\/login(\?|$)/);
    await expect(page).toHaveURL(/\/login(\?|$)/);
  });
});
