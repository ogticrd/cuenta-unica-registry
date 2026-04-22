import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCreateLivenessSession,
  mockVerifyLiveness,
  mockRegisterAccount,
  mockToastError,
  mockToastSuccess,
  mockRouterPush,
} = vi.hoisted(() => ({
  mockCreateLivenessSession: vi.fn(),
  mockVerifyLiveness: vi.fn(),
  mockRegisterAccount: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockRouterPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: mockToastError,
    success: mockToastSuccess,
  },
}));

vi.mock("@/components/auth/register/face-liveness-detector", () => ({
  FaceLivenessLoader: () => <div>loader</div>,
  FaceLiveness: ({
    sessionId,
    onComplete,
  }: {
    sessionId: string;
    onComplete: () => Promise<void>;
  }) => (
    <div>
      <div data-testid="liveness-session-id">{sessionId}</div>
      <button type="button" onClick={() => void onComplete()}>
        complete-liveness
      </button>
    </div>
  ),
}));

vi.mock("@/lib/services/registration/verification.service", () => ({
  verificationService: {
    createLivenessSession: mockCreateLivenessSession,
    verifyLiveness: mockVerifyLiveness,
  },
}));

vi.mock("@/lib/services/registration/account.service", () => ({
  accountService: {
    registerAccount: mockRegisterAccount,
  },
}));

vi.mock("@/hooks/use-t", () => ({
  useT: () => {
    const t = ((key: string, values?: Record<string, string>) => {
      if (values?.firstName) {
        return `${key}:${values.firstName}`;
      }

      return key;
    }) as ((key: string, values?: Record<string, string>) => string) & {
      rich: (key: string, _values: Record<string, unknown>) => string;
    };

    t.rich = (key: string) => key;

    return t;
  },
}));

import { StepVerification } from "@/components/auth/register/steps/step-verification";

describe("StepVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLivenessSession.mockResolvedValue({
      success: true,
      sessionId: "session-123",
    });
    mockVerifyLiveness.mockResolvedValue({
      success: true,
      confidence: 99,
      similarity: 96,
    });
    mockRegisterAccount.mockResolvedValue({
      success: true,
      destination: "login",
      redirectTo: "/login?registered=true",
    });
  });

  it("requires accepted terms before enabling the start button", () => {
    render(
      <StepVerification
        onBack={vi.fn()}
        onRequireAccount={vi.fn()}
        onRequireIdentification={vi.fn()}
        accountDraft={{
          email: "juan@example.com",
          confirmEmail: "juan@example.com",
          password: "Password123!",
          confirmPassword: "Password123!",
        }}
        userData={{ name: "Juan Perez" }}
      />,
    );

    expect(
      screen.getByRole("button", { name: "verification.start_process" }),
    ).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/verification.terms_label/i));

    expect(
      screen.getByRole("button", { name: "verification.start_process" }),
    ).toBeEnabled();
  });

  it("requests a liveness session and shows the liveness component", async () => {
    render(
      <StepVerification
        onBack={vi.fn()}
        onRequireAccount={vi.fn()}
        onRequireIdentification={vi.fn()}
        accountDraft={{
          email: "juan@example.com",
          confirmEmail: "juan@example.com",
          password: "Password123!",
          confirmPassword: "Password123!",
        }}
        userData={{ name: "Juan Perez" }}
      />,
    );

    fireEvent.click(screen.getByLabelText(/verification.terms_label/i));
    fireEvent.click(
      screen.getByRole("button", { name: "verification.start_process" }),
    );

    await waitFor(() => {
      expect(mockCreateLivenessSession).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByTestId("liveness-session-id")).toHaveTextContent(
      "session-123",
    );
  });

  it("sends users back to identification when liveness session creation fails because the session is missing", async () => {
    const onRequireIdentification = vi.fn();
    mockCreateLivenessSession.mockResolvedValueOnce({
      success: false,
      code: "registration_session_missing",
    });

    render(
      <StepVerification
        onBack={vi.fn()}
        onRequireAccount={vi.fn()}
        onRequireIdentification={onRequireIdentification}
        accountDraft={{
          email: "juan@example.com",
          confirmEmail: "juan@example.com",
          password: "Password123!",
          confirmPassword: "Password123!",
        }}
        userData={{ name: "Juan Perez" }}
      />,
    );

    fireEvent.click(screen.getByLabelText(/verification.terms_label/i));
    fireEvent.click(
      screen.getByRole("button", { name: "verification.start_process" }),
    );

    await waitFor(() => {
      expect(onRequireIdentification).toHaveBeenCalledTimes(1);
    });
    expect(mockToastError).toHaveBeenCalledWith(
      "verification.session_creation_failed",
    );
  });

  it("requires account details before starting verification", async () => {
    const onRequireAccount = vi.fn();

    render(
      <StepVerification
        onBack={vi.fn()}
        onRequireAccount={onRequireAccount}
        onRequireIdentification={vi.fn()}
        accountDraft={{
          email: "",
          confirmEmail: "",
          password: "",
          confirmPassword: "",
        }}
        userData={{ name: "Juan Perez" }}
      />,
    );

    fireEvent.click(screen.getByLabelText(/verification.terms_label/i));
    fireEvent.click(
      screen.getByRole("button", { name: "verification.start_process" }),
    );

    await waitFor(() => {
      expect(onRequireAccount).toHaveBeenCalledWith();
    });
    expect(mockCreateLivenessSession).not.toHaveBeenCalled();
  });

  it("registers the account and redirects after successful liveness verification", async () => {
    render(
      <StepVerification
        onBack={vi.fn()}
        onRequireAccount={vi.fn()}
        onRequireIdentification={vi.fn()}
        accountDraft={{
          email: "juan@example.com",
          confirmEmail: "juan@example.com",
          password: "Password123!",
          confirmPassword: "Password123!",
        }}
        userData={{ name: "Juan Perez" }}
      />,
    );

    fireEvent.click(screen.getByLabelText(/verification.terms_label/i));
    fireEvent.click(
      screen.getByRole("button", { name: "verification.start_process" }),
    );

    await screen.findByTestId("liveness-session-id");
    fireEvent.click(screen.getByText("complete-liveness"));

    await waitFor(() => {
      expect(mockVerifyLiveness).toHaveBeenCalledWith("session-123");
    });
    await waitFor(() => {
      expect(mockRegisterAccount).toHaveBeenCalledWith({
        email: "juan@example.com",
        password: "Password123!",
      });
    });

    expect(
      await screen.findByText("verification.modal.verified"),
    ).toBeInTheDocument();
    expect(mockToastSuccess).toHaveBeenCalledWith("account.success_title", {
      description: "account.success_description",
    });
  });
});
