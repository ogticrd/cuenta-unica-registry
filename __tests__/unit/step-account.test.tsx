import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { StepAccount } from "@/components/auth/register/steps/step-account";
import type { RegisterAccountDraft } from "@/lib/types/registration/account";

vi.mock("next-intl", () => ({
  useLocale: () => "es",
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
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
});
