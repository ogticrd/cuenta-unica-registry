import { expect, type Page, test } from "@playwright/test";

const VALID_CEDULA = "40224888319";
const INVALID_CEDULA = "00100000000";
const INVALID_CEDULA_FORMATTED = "001-0000000-0";
const VALID_CEDULA_FORMATTED = "402-2488831-9";
const VALID_EMAIL = "marluanespiritusanto@gmail.com";
const VALID_PASSWORD = "M4rlu@nSecure#2026";

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

    await page.route("https://api.pwnedpasswords.com/range/**", (route) =>
      route.fulfill({ status: 200, body: "" }),
    );
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
    await page.getByLabel(/^Confirmar contraseña/).fill(VALID_PASSWORD);
    await page.getByRole("button", { name: "CONTINUAR" }).click();

    await expect(page.getByText("¡Hola, MARLUAN!")).toBeVisible();
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
