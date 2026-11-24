import { expect, type Page, test } from "@playwright/test";
import en from "../i18n/messages/en.json";
import es from "../i18n/messages/es.json";

test.beforeEach(async ({ page }) => {
  await page.route("**/recaptcha/enterprise.js*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "const api = {ready: (callback) => callback(), execute: () => Promise.resolve('feedback-test-token')}; window.grecaptcha = {...api, enterprise: api};",
    }),
  );
  await page.route("**/api/ory/session", (route) =>
    route.fulfill({ json: { isAuthenticated: false } }),
  );
  await page.route("**/api/analytics/journey", (route) =>
    route.fulfill({ json: { success: true } }),
  );
});

async function openFeedback(page: Page) {
  await page.goto("/register");
  await expect(page.getByTestId("registration-wizard")).toHaveAttribute(
    "data-hydrated",
    "true",
  );
  await page.locator("#user-feedback-button").click();
  return page.getByRole("dialog");
}

async function fillFeedback(page: Page) {
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Número de cédula/).fill("40200612345");
  await dialog.getByLabel(/Correo electrónico/).fill("test@example.com");
  await dialog
    .getByLabel(/Comentarios/)
    .fill("Una sugerencia para mejorar mi experiencia");
}

for (const language of ["es", "en"] as const) {
  for (const path of ["/login", "/register"]) {
    test(`offers localized feedback and WhatsApp help on ${path} in ${language}`, async ({
      page,
      context,
      baseURL,
    }) => {
      await context.addCookies([
        {
          name: "NEXT_LOCALE",
          value: language,
          url: baseURL ?? "http://localhost:3000",
        },
      ]);
      let destination = path;
      if (path === "/login") {
        // A native flow lets help UI tests render login without browser callback/cookie host restrictions.
        const response = await page.request.get("/self-service/login/api", {
          headers: { Accept: "application/json" },
        });
        expect(response.ok()).toBe(true);
        const flow = await response.json();
        expect(flow.type).toBe("api");
        destination = `/login?flow=${encodeURIComponent(flow.id)}`;
      }
      await page.goto(destination, { waitUntil: "domcontentloaded" });
      if (path === "/login") {
        await page.waitForURL(
          (url) => url.pathname === "/login" && url.searchParams.has("flow"),
        );
      } else {
        await expect(page.getByTestId("registration-wizard")).toHaveAttribute(
          "data-hydrated",
          "true",
        );
      }
      const messages = { es, en }[language].feedback;
      await expect(page.locator("#user-feedback-button")).toBeVisible();
      const dialog = page.getByRole("dialog");
      await expect(async () => {
        if (!(await dialog.isVisible()))
          await page.locator("#user-feedback-button").click();
        await expect(dialog).toBeVisible({ timeout: 1000 });
      }).toPass({ timeout: 15000 });
      const link = dialog.getByRole("link", { name: messages.whatsapp_help });
      const url = new URL((await link.getAttribute("href")) ?? "");
      expect(url.origin).toBe("https://wa.me");
      expect(url.pathname).toBe("/18097181459");
      expect(url.searchParams.get("text")).toBe(messages.whatsapp_message);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toBeInViewport();
    });
  }
}

test("shows progress and clears the form after confirmed delivery", async ({
  page,
}) => {
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route("**/api/feedback", async (route) => {
    requests++;
    await pending;
    await route.fulfill({ json: { success: true } });
  });
  const dialog = await openFeedback(page);
  await fillFeedback(page);
  await dialog.getByRole("button", { name: es.feedback.report }).click();
  await expect(
    dialog.getByRole("button", { name: es.feedback.sending }),
  ).toBeDisabled();
  await expect(dialog.getByLabel(/Correo electrónico/)).toBeDisabled();
  release();
  await expect(dialog.getByRole("status")).toContainText(es.feedback.sent);
  await expect(dialog.getByLabel(/Número de cédula/)).toHaveValue("");
  await expect(dialog.getByLabel(/Correo electrónico/)).toHaveValue("");
  await expect(dialog.getByLabel(/Comentarios/)).toHaveValue("");
  expect(requests).toBe(1);
});

test("preserves feedback when unavailable and supports a successful retry", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/feedback", (route) => {
    requests++;
    return route.fulfill(
      requests === 1
        ? { status: 503, json: { success: false, code: "NOT_CONFIGURED" } }
        : { json: { success: true } },
    );
  });
  const dialog = await openFeedback(page);
  await fillFeedback(page);
  await dialog.getByRole("button", { name: es.feedback.report }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    es.feedback.unavailable,
  );
  await expect(dialog.getByLabel(/Correo electrónico/)).toHaveValue(
    "test@example.com",
  );
  await expect(dialog.getByLabel(/Comentarios/)).toHaveValue(
    "Una sugerencia para mejorar mi experiencia",
  );
  await dialog.getByRole("button", { name: es.feedback.report }).click();
  await expect(dialog.getByRole("status")).toContainText(es.feedback.sent);
});
