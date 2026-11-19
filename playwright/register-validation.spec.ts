import { expect, type Page, test } from "@playwright/test";

const VALID_CEDULA = "40214041176";
const INVALID_CEDULA = "00100000000";
const INVALID_CEDULA_FORMATTED = "001-0000000-0";
const VALID_CEDULA_FORMATTED = "402-1404117-6";
const VALID_EMAIL = "john_smith@yopmail.com";
const VALID_PASSWORD = "John4Sm1t5@nSecure#2026";

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  return errors;
}

async function expectNoValidationRuntimeCrash(page: Page, errors: string[]) {
  expect(errors.filter((message) => message.includes("ZodError"))).toEqual([]);
  await expect(page.getByText("Runtime ZodError")).toHaveCount(0);
}

async function gotoRegister(page: Page) {
  await page.goto("/register");
  await expect(page.getByTestId("registration-wizard")).toHaveAttribute(
    "data-hydrated",
    "true",
  );
}

async function mockSuccessfulCitizenLookup(page: Page) {
  let citizenLookupPayload: unknown;

  await page.route("**/api/registration/citizen", async (route) => {
    citizenLookupPayload = route.request().postDataJSON();

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        citizen: {
          firstName: "Marluan",
        },
      }),
    });
  });

  return () => citizenLookupPayload;
}

async function continueFromIdentification(page: Page) {
  await gotoRegister(page);
  const cedulaInput = page.getByRole("textbox", {
    name: /Número de cédula/,
  });
  await cedulaInput.fill(VALID_CEDULA);
  await expect(cedulaInput).toHaveValue(VALID_CEDULA_FORMATTED);

  const continueButton = page.getByRole("button", { name: "CONTINUAR" });
  await expect(continueButton).toBeEnabled();
  await expect(async () => {
    const citizenRequest = page
      .waitForRequest("**/api/registration/citizen", { timeout: 2_000 })
      .catch(() => null);
    await continueButton.click();
    expect(await citizenRequest).not.toBeNull();
  }).toPass({ timeout: 15_000 });
  await expect(page.getByLabel(/^Correo electrónico/)).toBeVisible({
    timeout: 15_000,
  });
}

test.describe("registration form validation", () => {
  test("enters recovery mode from the outlined button for an existing identity", async ({
    page,
  }) => {
    await page.route("**/recaptcha/enterprise.js*", (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: `
          const api = {
            ready: (callback) => callback(),
            execute: () => Promise.resolve("recaptcha-e2e-token"),
          };
          window.grecaptcha = { ...api, enterprise: api };
        `,
      }),
    );
    let recoveryRequested = false;
    await page.route("**/api/registration/citizen", (route) => {
      if (route.request().postDataJSON().recoverAccess === true) {
        recoveryRequested = true;
        return route.fulfill({
          status: 200,
          json: {
            success: true,
            citizen: { id: VALID_CEDULA, firstName: "Prueba" },
            recovery: true,
          },
        });
      }
      return route.fulfill({
        status: 409,
        json: { success: false, code: "identity_exists" },
      });
    });
    await gotoRegister(page);

    const cedula = page.getByRole("textbox", { name: /Número de cédula/ });
    await cedula.fill(VALID_CEDULA);

    const alert = page.getByRole("alert").filter({
      hasText: "Esta cédula ya tiene una Cuenta Única.",
    });
    await expect(async () => {
      await page.getByRole("button", { name: "CONTINUAR" }).click();
      await expect(alert).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await expect(alert).toContainText("Conservarás tu historial de datos.");
    const recreate = alert.getByRole("button", {
      name: "Recuperar acceso",
      exact: true,
    });
    await expect(recreate).toHaveCSS("border-top-width", "2px");
    await expect(recreate).toHaveCSS("border-top-left-radius", "67px");
    await expect(recreate).toHaveCSS("height", "41px");
    await expect(recreate).toHaveCSS("font-size", "14px");
    await expect(alert).toHaveCSS("color", "rgb(0, 135, 255)");
    expect(
      await recreate.evaluate(
        (button) => button.scrollWidth <= button.clientWidth,
      ),
    ).toBe(true);
    await recreate.click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByTestId("registration-wizard").getByRole("alert"),
    ).toHaveText("Modo recuperación");
    await expect(page.getByLabel(/^Correo electrónico/)).toBeVisible();
    expect(recoveryRequested).toBe(true);
  });

  test("shows invalid cedula errors in the form without crashing the page", async ({
    page,
  }) => {
    const runtimeErrors = collectRuntimeErrors(page);

    await gotoRegister(page);
    const cedulaInput = page.getByRole("textbox", {
      name: /Número de cédula/,
    });
    await cedulaInput.fill(INVALID_CEDULA);
    await expect(cedulaInput).toHaveValue(INVALID_CEDULA_FORMATTED);
    await page.getByRole("button", { name: "CONTINUAR" }).click();

    await expect(
      page.getByText("La cédula ingresada no es válida"),
    ).toBeVisible();
    await expectNoValidationRuntimeCrash(page, runtimeErrors);
  });

  test("shows account validation errors before saving the account draft", async ({
    page,
  }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    const getCitizenLookupPayload = await mockSuccessfulCitizenLookup(page);
    let accountDraftCalled = false;

    await page.route("**/api/registration/account-draft", async (route) => {
      accountDraftCalled = true;
      await route.abort();
    });

    await continueFromIdentification(page);
    expect(getCitizenLookupPayload()).toMatchObject({
      cedula: VALID_CEDULA,
    });

    await page.getByLabel(/^Correo electrónico/).fill("correo");
    await page.getByLabel(/^Confirmar correo/).fill("otro@example.com");
    await page.getByLabel(/^Contraseña/).fill("abc");
    await page.getByLabel(/^Confirmar contraseña/).fill("abcd");
    await page.getByRole("button", { name: "CONTINUAR" }).click();

    await expect(
      page.getByText("Ingresa un correo electrónico válido"),
    ).toBeVisible();
    await expect(
      page.getByText("Los correos electrónicos no coinciden"),
    ).toBeVisible();
    await expect(
      page.getByText("La contraseña debe tener al menos 10 caracteres"),
    ).toBeVisible();
    await expect(page.getByText("Las contraseñas no coinciden")).toBeVisible();
    expect(accountDraftCalled).toBe(false);
    await expectNoValidationRuntimeCrash(page, runtimeErrors);
  });

  test("saves the account draft before creating the Rekognition liveness session", async ({
    page,
  }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    const getCitizenLookupPayload = await mockSuccessfulCitizenLookup(page);
    let accountDraftPayload: unknown;
    let livenessSessionRequested = false;
    let passwordBreachRequestCount = 0;

    await page.route("https://api.pwnedpasswords.com/range/**", (route) => {
      passwordBreachRequestCount += 1;
      return route.fulfill({ status: 200, body: "" });
    });
    await page.route("**/api/registration/account-draft", async (route) => {
      accountDraftPayload = route.request().postDataJSON();

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          sessionStatus: "identified",
        }),
      });
    });
    await page.route(
      "**/api/registration/verification/liveness-session",
      async (route) => {
        livenessSessionRequested = true;

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            sessionId: "liveness-session-e2e",
          }),
        });
      },
    );

    await continueFromIdentification(page);
    expect(getCitizenLookupPayload()).toMatchObject({
      cedula: VALID_CEDULA,
    });

    await page.getByLabel(/^Correo electrónico/).fill(VALID_EMAIL);
    await page.getByLabel(/^Confirmar correo/).fill(VALID_EMAIL);
    await page.getByLabel(/^Contraseña/).fill(VALID_PASSWORD);

    await expect.poll(() => passwordBreachRequestCount).toBeGreaterThan(0);
    const requestsAfterPasswordValidation = passwordBreachRequestCount;

    await page.getByLabel(/^Correo electrónico/).fill("correo");
    await expect(
      page.getByText("Ingresa un correo electrónico válido"),
    ).toBeVisible();
    expect(passwordBreachRequestCount).toBe(requestsAfterPasswordValidation);

    await page.getByLabel(/^Correo electrónico/).fill(VALID_EMAIL);
    await expect(
      page.getByText("Ingresa un correo electrónico válido"),
    ).toBeHidden();
    expect(passwordBreachRequestCount).toBe(requestsAfterPasswordValidation);

    await page.getByLabel(/^Confirmar correo/).fill("otro@example.com");
    await expect(
      page.getByText("Los correos electrónicos no coinciden"),
    ).toBeVisible();
    expect(passwordBreachRequestCount).toBe(requestsAfterPasswordValidation);

    await page.getByLabel(/^Confirmar correo/).fill(VALID_EMAIL);
    await expect(
      page.getByText("Los correos electrónicos no coinciden"),
    ).toBeHidden();
    expect(passwordBreachRequestCount).toBe(requestsAfterPasswordValidation);

    await page.getByLabel(/^Confirmar contraseña/).fill(VALID_PASSWORD);
    await page.waitForTimeout(1_000);

    expect(passwordBreachRequestCount).toBe(requestsAfterPasswordValidation);

    await page.getByRole("button", { name: "CONTINUAR" }).click();

    await expect(page.getByText("¡Hola, MARLUAN!")).toBeVisible();
    expect(passwordBreachRequestCount).toBe(requestsAfterPasswordValidation);
    expect(accountDraftPayload).toMatchObject({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    });

    await page.getByLabel("Aceptar términos y políticas de privacidad").check();
    await page.getByRole("button", { name: "INICIAR PROCESO" }).click();

    await expect(
      page.getByRole("dialog", {
        name: "Verificación biométrica a pantalla completa",
      }),
    ).toBeVisible();
    await expect(page.getByTestId("rekognition-liveness")).toBeVisible();
    expect(livenessSessionRequested).toBe(true);
    await expectNoValidationRuntimeCrash(page, runtimeErrors);
  });
});
