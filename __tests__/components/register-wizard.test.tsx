import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockReset, mockToastError } = vi.hoisted(() => ({
  mockReset: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    // biome-ignore lint/performance/noImgElement: intentional mock of next/image for jsdom
    <img {...props} alt={String(props.alt ?? "")} />
  ),
}));

vi.mock("sonner", () => ({
  toast: {
    error: mockToastError,
  },
}));

vi.mock("@/lib/services/registration/registration-session-api.service", () => ({
  registrationSessionApiService: {
    reset: mockReset,
  },
}));

vi.mock("@/components/auth/register/steps/step-identification", () => ({
  StepIdentification: ({
    onNext,
    updateData,
    returnUrl,
  }: {
    onNext: () => void;
    updateData: (data: { cedula: string; name: string }) => void;
    returnUrl?: string;
  }) => (
    <div data-testid="step-identification">
      <div data-testid="identification-return-url">{returnUrl ?? ""}</div>
      <button
        type="button"
        onClick={() => {
          updateData({ cedula: "00100063362", name: "Juan" });
          onNext();
        }}
      >
        identification-next
      </button>
    </div>
  ),
}));

vi.mock("@/components/auth/register/steps/step-account", () => ({
  StepAccount: ({
    cedula,
    onBack,
    onNext,
    initialErrors,
  }: {
    cedula: string;
    onBack: () => void;
    onNext: (draft: {
      email: string;
      confirmEmail: string;
      password: string;
      confirmPassword: string;
    }) => void;
    initialErrors?: { code?: string };
  }) => (
    <div data-testid="step-account">
      <div data-testid="account-cedula">{cedula}</div>
      <div data-testid="account-error-code">{initialErrors?.code ?? ""}</div>
      <button type="button" onClick={onBack}>
        account-back
      </button>
      <button
        type="button"
        onClick={() =>
          onNext({
            email: "juan@example.com",
            confirmEmail: "juan@example.com",
            password: "Password123!",
            confirmPassword: "Password123!",
          })
        }
      >
        account-next
      </button>
    </div>
  ),
}));

vi.mock("@/components/auth/register/steps/step-verification", () => ({
  StepVerification: ({
    onBack,
    onRequireAccount,
    onRequireIdentification,
    accountDraft,
    userData,
  }: {
    onBack: () => void;
    onRequireAccount: (errors?: { code?: string }) => void;
    onRequireIdentification: () => void;
    accountDraft: { email: string };
    userData: { name: string };
  }) => (
    <div data-testid="step-verification">
      <div data-testid="verification-email">{accountDraft.email}</div>
      <div data-testid="verification-name">{userData.name}</div>
      <button type="button" onClick={onBack}>
        verification-back
      </button>
      <button
        type="button"
        onClick={() => onRequireAccount({ code: "identity_exists" })}
      >
        verification-require-account
      </button>
      <button type="button" onClick={onRequireIdentification}>
        verification-require-identification
      </button>
    </div>
  ),
}));

import { RegisterWizard } from "@/components/auth/register/register-wizard";

describe("RegisterWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the real wizard shell with the identification step", () => {
    render(<RegisterWizard initialStep={0} initialName="" />);

    expect(screen.getByRole("img", { name: "logo_alt" })).toBeInTheDocument();
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(
      screen.getByText("step_label 1: steps.identification.title"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("step-identification")).toBeInTheDocument();
  });

  it("passes the returnUrl through to the identification step", () => {
    render(
      <RegisterWizard
        initialStep={0}
        initialName=""
        returnUrl="https://example.com/dashboard"
      />,
    );

    expect(screen.getByTestId("identification-return-url")).toHaveTextContent(
      "https://example.com/dashboard",
    );
  });

  it("uses the real wizard state to carry cedula and name into later steps", async () => {
    render(<RegisterWizard initialStep={0} initialName="" />);

    fireEvent.click(screen.getByText("identification-next"));

    expect(await screen.findByTestId("step-account")).toBeInTheDocument();
    expect(screen.getByTestId("account-cedula")).toHaveTextContent(
      "00100063362",
    );

    fireEvent.click(screen.getByText("account-next"));

    expect(await screen.findByTestId("step-verification")).toBeInTheDocument();
    expect(screen.getByTestId("verification-email")).toHaveTextContent(
      "juan@example.com",
    );
    expect(screen.getByTestId("verification-name")).toHaveTextContent("Juan");
  });

  it("resets back to step 0 when backing out of step 1 succeeds", async () => {
    mockReset.mockResolvedValueOnce({ success: true });

    render(<RegisterWizard initialStep={1} initialName="Juan" />);

    fireEvent.click(screen.getByText("account-back"));

    await waitFor(() => {
      expect(screen.getByTestId("step-identification")).toBeInTheDocument();
    });
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("stays on step 1 and shows a toast when reset fails", async () => {
    mockReset.mockResolvedValueOnce({
      success: false,
      code: "unexpected_error",
    });

    render(<RegisterWizard initialStep={1} initialName="Juan" />);

    fireEvent.click(screen.getByText("account-back"));

    await waitFor(() => {
      expect(screen.getByTestId("step-account")).toBeInTheDocument();
    });
    expect(mockToastError).toHaveBeenCalledWith("identification.lookup_error");
  });

  it("moves from verification back to account when requested", async () => {
    render(<RegisterWizard initialStep={2} initialName="Juan" />);

    fireEvent.click(screen.getByText("verification-require-account"));

    expect(await screen.findByTestId("step-account")).toBeInTheDocument();
    expect(screen.getByTestId("account-error-code")).toHaveTextContent(
      "identity_exists",
    );
  });

  it("moves from verification back to identification when requested", async () => {
    render(<RegisterWizard initialStep={2} initialName="Juan" />);

    fireEvent.click(screen.getByText("verification-require-identification"));

    expect(
      await screen.findByTestId("step-identification"),
    ).toBeInTheDocument();
  });
});
