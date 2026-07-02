import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterWizard } from "@/components/auth/register/register-wizard";
import { accountService } from "@/lib/services/registration/account.service";
import { registrationSessionApiService } from "@/lib/services/registration/registration-session-api.service";

const { mockToastError } = vi.hoisted(() => ({
  mockToastError: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { alt: string }) =>
    createElement("img", { alt, ...props }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("sonner", () => ({
  toast: {
    error: mockToastError,
  },
}));

vi.mock("@/lib/services/registration/account.service", () => ({
  accountService: {
    saveAccountDraft: vi.fn(),
  },
}));

vi.mock("@/lib/services/registration/registration-session-api.service", () => ({
  registrationSessionApiService: {
    reset: vi.fn(),
  },
}));

vi.mock("@/components/auth/register/steps/step-verification", () => ({
  StepVerification: () => <div>verification step</div>,
}));

vi.mock("@/hooks/use-t", () => ({
  useT: () => {
    const messages: Record<string, string> = {
      logo_alt: "Cuenta Única",
      title: "Registro",
      step_label: "Paso",
      "steps.identification.title": "Identificación",
      "steps.identification.description": "Valida tu cédula",
      "steps.account.title": "Cuenta",
      "steps.account.description": "Crea tus credenciales",
      "steps.verification.title": "Verificación",
      "steps.verification.description": "Prueba de vida",
      "identification.intro": "Ingresa tu cédula para iniciar el registro.",
      "identification.id_label": "Cédula",
      "identification.id_placeholder": "000-0000000-0",
      "identification.continue": "CONTINUAR",
      "identification.existing_account": "¿Ya tienes una cuenta?",
      "identification.login_cta": "Inicia sesión",
      "account.intro": "Crea las credenciales de tu cuenta",
      "account.email_label": "Correo electrónico",
      "account.confirm_email_label": "Confirmar correo",
      "account.password_label": "Contraseña",
      "account.confirm_password_label": "Confirmar contraseña",
      "account.email_placeholder": "tucorreo@ejemplo.com",
      "account.toggle_password_visibility": "Mostrar u ocultar contraseña",
      "account.password_requirements.title": "Tu contraseña debe contener:",
      "account.password_requirements.length": "Al menos 10 caracteres",
      "account.password_requirements.uppercase": "Una letra mayúscula",
      "account.password_requirements.lowercase": "Una letra minúscula",
      "account.password_requirements.number": "Un número",
      "account.password_requirements.symbol": "Un carácter especial",
      "account.continue": "CONTINUAR",
      "account.validation.email_invalid":
        "Ingresa un correo electrónico válido",
      "account.validation.email_mismatch":
        "Los correos electrónicos no coinciden",
      "account.validation.password_min":
        "La contraseña debe tener al menos 10 caracteres",
      "account.validation.password_weak":
        "La contraseña es muy débil. Usa mayúsculas, minúsculas, números o caracteres especiales.",
      "account.validation.password_mismatch": "Las contraseñas no coinciden",
      "account.validation.password_cedula_similarity":
        "La contraseña no puede contener tu cédula",
      "account.validation.password_email_similarity":
        "La contraseña no puede contener tu correo",
      "account.validation.password_compromised":
        "Esta contraseña ha sido expuesta en filtraciones conocidas",
      "account.session_missing": "La sesión de registro expiró",
      "account.verification_required": "Completa la prueba de vida",
      "account.draft_missing": "Vuelve a ingresar los datos de la cuenta",
      "account.identity_exists": "Ya existe una cuenta con este correo",
      "account.error": "No pudimos crear tu cuenta",
      "common.back": "Volver al paso anterior",
      "common.continue": "CONTINUAR",
    };

    return (key: string) => messages[key] ?? key;
  },
}));

function renderAccountStepWizard() {
  render(
    <RegisterWizard
      initialStep={1}
      initialCedula="40214041176"
      initialName="Juan Perez"
      initialSessionStatus="identified"
      hasAccountDraft={false}
    />,
  );
}

describe("RegisterWizard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mockToastError.mockReset();
    vi.mocked(registrationSessionApiService.reset).mockResolvedValue({
      success: true,
    });
    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve(new Response("", { status: 200 })),
    );
  });

  it("keeps account draft field errors visible in the account form", async () => {
    vi.mocked(accountService.saveAccountDraft).mockResolvedValueOnce({
      success: false,
      code: "password_compromised",
      fieldErrors: {
        password: "account.validation.password_compromised",
      },
    });

    renderAccountStepWizard();

    fireEvent.change(screen.getByLabelText("Correo electrónico *"), {
      target: { value: "secure@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar correo *"), {
      target: { value: "secure@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña *"), {
      target: { value: "GovFlow92817Z!" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña *"), {
      target: { value: "GovFlow92817Z!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "CONTINUAR" }));

    expect(
      await screen.findByText(
        "Esta contraseña ha sido expuesta en filtraciones conocidas",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("verification step")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(accountService.saveAccountDraft).toHaveBeenCalledWith({
        email: "secure@example.com",
        password: "GovFlow92817Z!",
      });
    });
  });

  it("resets temporary registration state when returning from account to identification", async () => {
    renderAccountStepWizard();

    fireEvent.change(screen.getByLabelText("Correo electrónico *"), {
      target: { value: "secure@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar correo *"), {
      target: { value: "secure@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña *"), {
      target: { value: "GovFlow92817Z!" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña *"), {
      target: { value: "GovFlow92817Z!" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Volver al paso anterior" }),
    );

    await waitFor(() => {
      expect(registrationSessionApiService.reset).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByLabelText("Cédula *")).toHaveValue("");
    expect(
      screen.queryByLabelText("Correo electrónico *"),
    ).not.toBeInTheDocument();
    expect(accountService.saveAccountDraft).not.toHaveBeenCalled();
  });
});
