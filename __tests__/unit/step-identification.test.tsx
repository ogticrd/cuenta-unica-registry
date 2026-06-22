import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StepIdentification } from "@/components/auth/register/steps/step-identification";
import { citizenService } from "@/lib/services/registration/citizen.service";

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

vi.mock("@/lib/services/registration/citizen.service", () => ({
  citizenService: {
    identifyCitizen: vi.fn(),
  },
}));

vi.mock("@/hooks/use-t", () => ({
  useT: () => {
    const messages: Record<string, string> = {
      "identification.intro": "Ingresa tu cédula para iniciar el registro.",
      "identification.id_label": "Cédula",
      "identification.id_placeholder": "000-0000000-0",
      "identification.id_required": "La cédula es requerida",
      "identification.id_invalid_length": "La cédula debe tener 11 dígitos",
      "identification.id_invalid": "La cédula ingresada no es válida",
      "identification.continue": "CONTINUAR",
      "identification.loading": "Validando...",
      "identification.existing_account": "¿Ya tienes una cuenta?",
      "identification.login_cta": "Inicia sesión",
      "identification.account_exists": "Ya existe una cuenta con esta cédula",
      "identification.id_not_found": "No encontramos esta cédula",
      "identification.lookup_error": "No pudimos validar la cédula",
    };

    return (key: string) => messages[key] ?? key;
  },
}));

function renderStepIdentification(
  overrides: Partial<React.ComponentProps<typeof StepIdentification>> = {},
) {
  const props: React.ComponentProps<typeof StepIdentification> = {
    onNext: vi.fn(),
    updateData: vi.fn(),
    defaultValues: { cedula: "" },
    ...overrides,
  };

  const view = render(<StepIdentification {...props} />);

  return { ...view, props };
}

describe("StepIdentification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an invalid cedula validation message without calling the API", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { props } = renderStepIdentification();

    await user.type(screen.getByLabelText("Cédula *"), "00000000000");
    await expect(
      user.click(screen.getByRole("button", { name: "CONTINUAR" })),
    ).resolves.toBeUndefined();

    expect(
      await screen.findByText("La cédula ingresada no es válida"),
    ).toBeInTheDocument();
    expect(citizenService.identifyCitizen).not.toHaveBeenCalled();
    expect(props.onNext).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
