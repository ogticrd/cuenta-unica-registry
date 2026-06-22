import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StepAccount } from "@/components/auth/register/steps/step-account";
import type { RegisterAccountDraft } from "@/lib/types/registration/account";

const { mockToastError } = vi.hoisted(() => ({
  mockToastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: mockToastError,
  },
}));

vi.mock("next-intl", () => ({
  useLocale: () => "es",
}));

vi.mock("@/hooks/use-t", () => ({
  useT: () => {
    const messages: Record<string, string> = {
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
      "identification.id_invalid": "La cédula ingresada no es válida",
      "identification.id_not_found": "No encontramos esta cédula",
      "common.back": "Volver al paso anterior",
      "common.continue": "CONTINUAR",
    };

    return (key: string) => messages[key] ?? key;
  },
}));

const emptyDraft: RegisterAccountDraft = {
  email: "",
  confirmEmail: "",
  password: "",
  confirmPassword: "",
};

function renderStepAccount(
  overrides: Partial<React.ComponentProps<typeof StepAccount>> = {},
) {
  const props: React.ComponentProps<typeof StepAccount> = {
    onBack: vi.fn(),
    onNext: vi.fn(),
    cedula: "40224888319",
    defaultValues: emptyDraft,
    ...overrides,
  };

  const view = render(<StepAccount {...props} />);

  return { ...view, props };
}

describe("StepAccount", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockToastError.mockReset();
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("", { status: 200 }),
    );
  });

  it("keeps password inputs associated with their visible labels", () => {
    renderStepAccount();

    expect(screen.getByLabelText("Contraseña *")).toHaveAttribute(
      "name",
      "password",
    );
    expect(screen.getByLabelText("Confirmar contraseña *")).toHaveAttribute(
      "name",
      "confirmPassword",
    );
  });

  it("does not clear typed account values on equivalent parent rerenders", async () => {
    const user = userEvent.setup();
    const { props, rerender } = renderStepAccount();

    await user.type(
      screen.getByLabelText("Correo electrónico *"),
      "marluanespiritusanto@gmail.com",
    );
    await user.type(screen.getByLabelText("Contraseña *"), "GovFlow92817Z!");

    rerender(
      <StepAccount
        {...props}
        defaultValues={{
          email: "",
          confirmEmail: "",
          password: "",
          confirmPassword: "",
        }}
      />,
    );

    expect(screen.getByLabelText("Correo electrónico *")).toHaveValue(
      "marluanespiritusanto@gmail.com",
    );
    expect(screen.getByLabelText("Contraseña *")).toHaveValue("GovFlow92817Z!");
  });

  it("shows a visible email format error and does not continue", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    renderStepAccount({ onNext });

    await user.type(screen.getByLabelText("Correo electrónico *"), "correo");
    await user.click(screen.getByRole("button", { name: "CONTINUAR" }));

    expect(
      await screen.findAllByText("Ingresa un correo electrónico válido"),
    ).not.toHaveLength(0);
    expect(onNext).not.toHaveBeenCalled();
  });

  it("shows a visible confirm email mismatch error and does not continue", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    renderStepAccount({ onNext });

    await user.type(
      screen.getByLabelText("Correo electrónico *"),
      "marluanespiritusanto@gmail.com",
    );
    await user.type(
      screen.getByLabelText("Confirmar correo *"),
      "otro@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña *"), "GovFlow92817Z!");
    await user.type(
      screen.getByLabelText("Confirmar contraseña *"),
      "GovFlow92817Z!",
    );
    await user.click(screen.getByRole("button", { name: "CONTINUAR" }));

    expect(
      await screen.findByText("Los correos electrónicos no coinciden"),
    ).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it("shows a visible weak password error and does not continue", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    renderStepAccount({ onNext });

    await user.type(
      screen.getByLabelText("Correo electrónico *"),
      "marluanespiritusanto@gmail.com",
    );
    await user.type(
      screen.getByLabelText("Confirmar correo *"),
      "marluanespiritusanto@gmail.com",
    );
    await user.type(screen.getByLabelText("Contraseña *"), "abcdefghij");
    await user.type(
      screen.getByLabelText("Confirmar contraseña *"),
      "abcdefghij",
    );
    await user.click(screen.getByRole("button", { name: "CONTINUAR" }));

    expect(
      await screen.findByText(
        "La contraseña es muy débil. Usa mayúsculas, minúsculas, números o caracteres especiales.",
      ),
    ).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it("shows server-side password errors on the password field", async () => {
    renderStepAccount({
      initialErrors: {
        code: "password_email_similarity",
        fieldErrors: {
          password: "account.validation.password_email_similarity",
        },
      },
    });

    expect(
      await screen.findByText("La contraseña no puede contener tu correo"),
    ).toBeInTheDocument();
  });

  it("shows Ory email field errors on the email field", async () => {
    renderStepAccount({
      initialErrors: {
        code: "identity_exists",
        fieldErrors: {
          email: "identities.messages.4000007",
        },
      },
    });

    expect(
      await screen.findByText(
        "Ya existe una cuenta con este correo electrónico.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico *")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("does not show a general toast for server-side password errors", async () => {
    renderStepAccount({
      initialErrors: {
        code: "password_compromised",
      },
    });

    expect(
      await screen.findByText(
        "Esta contraseña ha sido expuesta en filtraciones conocidas",
      ),
    ).toBeInTheDocument();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid_payload", "No pudimos crear tu cuenta"],
    ["verification_required", "Completa la prueba de vida"],
  ] as const)("shows %s as a visible account error", async (code, message) => {
    renderStepAccount({
      initialErrors: {
        code,
      },
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(message);
    });
  });

  it("shows a visible confirm password mismatch error and does not continue", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    renderStepAccount({ onNext });

    await user.type(
      screen.getByLabelText("Correo electrónico *"),
      "marluanespiritusanto@gmail.com",
    );
    await user.type(
      screen.getByLabelText("Confirmar correo *"),
      "marluanespiritusanto@gmail.com",
    );
    await user.type(screen.getByLabelText("Contraseña *"), "GovFlow92817Z!");
    await user.type(
      screen.getByLabelText("Confirmar contraseña *"),
      "GovFlow92818Z!",
    );
    await user.click(screen.getByRole("button", { name: "CONTINUAR" }));

    expect(
      await screen.findByText("Las contraseñas no coinciden"),
    ).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });
});
