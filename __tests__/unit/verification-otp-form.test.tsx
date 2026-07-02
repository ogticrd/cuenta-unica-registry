import { render, screen } from "@testing-library/react";
import type * as React from "react";
import { useActionState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VerificationOTPForm } from "@/components/auth/verification/verification-otp-form";

const { mockFormAction, mockPush, mockToastSuccess } = vi.hoisted(() => ({
  mockFormAction: vi.fn(),
  mockPush: vi.fn(),
  mockToastSuccess: vi.fn(),
}));
const originalLocation = window.location;
const mockAssign = vi.fn();

vi.mock("server-only", () => ({}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    useActionState: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
  },
}));

vi.mock("@/components/ui/input-otp", () => ({
  InputOTP: ({
    children,
    onChange,
    value,
    containerClassName,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & {
    children: React.ReactNode;
    onChange?: (value: string) => void;
    containerClassName?: string;
  }) => (
    <div>
      <input
        {...props}
        value={value}
        onChange={(event) => onChange?.(event.currentTarget.value)}
      />
      {children}
    </div>
  ),
  InputOTPGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  InputOTPSlot: ({ index }: { index: number }) => (
    <span data-testid={`otp-slot-${index}`} />
  ),
}));

vi.mock("@/hooks/use-t", () => ({
  useT: () => {
    const messages: Record<string, string> = {
      success_title: "Cuenta verificada",
      success_description: "Tu cuenta ha sido activada.",
      success_message: "Cuenta activada correctamente",
      success_redirecting: "Redirigiendo...",
      code_label: "Código de verificación",
      verifying: "Verificando...",
      verify_button: "VERIFICAR",
    };

    return (key: string) => messages[key] ?? key;
  },
}));

describe("VerificationOTPForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.mocked(useActionState).mockReturnValue([{}, mockFormAction, false]);
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        assign: mockAssign,
      },
    });
  });

  it("renders coded verification errors as accessible alerts", () => {
    vi.mocked(useActionState).mockReturnValue([
      {
        code: "invalid_code",
        error: "El código ingresado no es válido",
      },
      mockFormAction,
      false,
    ]);

    render(<VerificationOTPForm flowId="verification-flow-123" />);

    const input = screen.getByLabelText("Código de verificación");
    const alert = screen.getByRole("alert");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "El código ingresado no es válido",
    );
    expect(alert).toHaveTextContent("El código ingresado no es válido");
    expect(alert).toHaveAttribute("data-error-code", "invalid_code");
  });

  it("labels the verification code input for assistive technology", () => {
    render(<VerificationOTPForm flowId="verification-flow-123" />);

    const input = screen.getByLabelText("Código de verificación");
    expect(input).toBeVisible();
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("redirects to login after a successful verification without return_url", async () => {
    vi.useFakeTimers();
    vi.mocked(useActionState).mockReturnValue([
      {
        success: true,
      },
      mockFormAction,
      false,
    ]);

    render(<VerificationOTPForm flowId="verification-flow-123" />);

    expect(screen.getByText("Cuenta activada correctamente")).toBeVisible();
    expect(mockToastSuccess).toHaveBeenCalledWith("Cuenta verificada", {
      description: "Tu cuenta ha sido activada.",
    });

    await vi.advanceTimersByTimeAsync(4000);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("uses the sanitized returnUrl after a successful verification", async () => {
    vi.useFakeTimers();
    vi.mocked(useActionState).mockReturnValue([
      {
        success: true,
      },
      mockFormAction,
      false,
    ]);

    render(
      <VerificationOTPForm
        flowId="verification-flow-123"
        returnUrl="https://services.gob.do/dashboard"
      />,
    );

    await vi.advanceTimersByTimeAsync(4000);
    expect(mockAssign).toHaveBeenCalledWith(
      "https://services.gob.do/dashboard",
    );
    expect(mockPush).not.toHaveBeenCalled();
  });
});
