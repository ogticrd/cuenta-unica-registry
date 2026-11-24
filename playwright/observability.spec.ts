import { expect, test } from "@playwright/test";

test("reports browser failures to the server without sending raw error messages", async ({
  page,
}) => {
  await page.goto("/register");
  await expect(page.getByTestId("registration-wizard")).toHaveAttribute(
    "data-hydrated",
    "true",
  );
  const report = page.waitForRequest(
    (request) =>
      request.url().endsWith("/api/observability/client-errors") &&
      request.method() === "POST" &&
      request.postDataJSON().errorType === "RangeError",
  );
  await page.evaluate(() => {
    const error = new RangeError(
      "private-password test@example.com 40214041176",
    );
    window.dispatchEvent(new ErrorEvent("error", { error }));
  });
  const request = await report;
  expect(request.postDataJSON()).toMatchObject({
    event: "client_error",
    errorType: "RangeError",
  });
  expect(request.postData()).not.toContain("private-password");
  expect(request.postData()).not.toContain("test@example.com");
  expect(request.postData()).not.toContain("40214041176");
  const response = await request.response();
  expect(response?.status()).toBe(204);
});

test("deduplicates identical browser failures", async ({ page }) => {
  let reports = 0;
  await page.route("**/api/observability/client-errors", (route) => {
    if (route.request().postDataJSON().errorType === "RangeError") reports++;
    return route.fulfill({ status: 204 });
  });
  await page.goto("/register");
  await expect(page.getByTestId("registration-wizard")).toHaveAttribute(
    "data-hydrated",
    "true",
  );
  await page.evaluate(() => {
    const error = new RangeError("Repeated error");
    window.dispatchEvent(new ErrorEvent("error", { error }));
    window.dispatchEvent(new ErrorEvent("error", { error }));
  });
  await expect.poll(() => reports).toBe(1);
  await page.waitForTimeout(200);
  expect(reports).toBe(1);
});
