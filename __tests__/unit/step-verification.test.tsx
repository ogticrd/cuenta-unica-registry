import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type React from "react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StepVerification } from "@/components/auth/register/steps/step-verification";
import { accountService } from "@/lib/services/registration/account.service";
import { verificationService } from "@/lib/services/registration/verification.service";

const { mockToastError, mockToastSuccess } = vi.hoisted(() => ({
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { alt: string }) =>
    createElement("img", { alt, ...props }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: mockToastError,
    success: mockToastSuccess,
  },
}));

vi.mock("@/hooks/use-t", () => ({
  useT: () => {
    const translate = (key: string) => key;
    translate.rich = (
      key: string,
      values: { strong?: (chunks: React.ReactNode) => React.ReactNode },
    ) => {
      const label = key.split(".").at(-1) ?? key;
      return values.strong ? values.strong(label) : label;
    };
    return translate;
  },
}));

vi.mock("@/components/auth/register/face-liveness-detector", () => ({
  FaceLiveness: ({
    onComplete,
    onError,
  }: {
    onComplete: () => Promise<void>;
    onError: (error: unknown) => Promise<void>;
  }) => (
    <>
      <button type="button" onClick={() => void onComplete()}>
        complete liveness
      </button>
      <button
        type="button"
        onClick={() => void onError(new Error("camera unavailable"))}
      >
        fail liveness
      </button>
    </>
  ),
  FaceLivenessLoader: () => <div>creating liveness session</div>,
}));

vi.mock("@/lib/services/registration/verification.service", () => ({
  verificationService: {
    createLivenessSession: vi.fn(),
    verifyLiveness: vi.fn(),
    completeLivenessRegistration: vi.fn(),
  },
}));

vi.mock("@/lib/services/registration/account.service", () => ({
  accountService: {
    registerAccount: vi.fn(),
  },
}));

function renderStepVerification(
  overrides: Partial<React.ComponentProps<typeof StepVerification>> = {},
) {
  const props: React.ComponentProps<typeof StepVerification> = {
    onBack: vi.fn(),
    onRequireAccount: vi.fn(),
    onRequireIdentification: vi.fn(),
    accountDraft: {
      email: "user@example.com",
      confirmEmail: "user@example.com",
      password: "StrongPass123!",
      confirmPassword: "StrongPass123!",
    },
    userData: { name: "Juan Perez" },
    ...overrides,
  };

  const view = render(<StepVerification {...props} />);

  return { ...props, unmount: view.unmount };
}

describe("StepVerification", () => {
  const originalLocation = window.location;
  const assign = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        assign,
      },
    });
  });

  afterEach(() => vi.useRealTimers());

  it.each([
    "email-sent",
    "login",
  ] as const)("shows verified success for five seconds before navigating to %s", async (destination) => {
    vi.mocked(verificationService.createLivenessSession).mockResolvedValueOnce({
      success: true,
      sessionId: "session-123",
    });
    vi.mocked(
      verificationService.completeLivenessRegistration,
    ).mockResolvedValueOnce({
      success: true,
      confidence: 99,
      similarity: 96,
      destination,
      redirectTo:
        destination === "login"
          ? "/login"
          : "/register/email-sent?flow=flow-123",
    });

    renderStepVerification();

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "verification.start_process" }),
    );

    expect(await screen.findByText("complete liveness")).toBeInTheDocument();
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(screen.getByText("complete liveness"));
    });

    expect(
      verificationService.completeLivenessRegistration,
    ).toHaveBeenCalledWith("session-123");
    expect(accountService.registerAccount).not.toHaveBeenCalled();
    expect(screen.getByText("verification.modal.verified")).toBeInTheDocument();
    expect(
      screen.getByText("verification.continuing_registration"),
    ).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await act(() => vi.advanceTimersByTimeAsync(4_999));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("verification.modal.verified")).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith(
      destination === "login" ? "/login" : "/register/email-sent?flow=flow-123",
    );
    if (destination === "login") {
      expect(mockToastSuccess).toHaveBeenCalledWith("account.success_title", {
        description: "account.success_description",
      });
    }
  });

  it("cancels the delayed navigation when the verification step unmounts", async () => {
    vi.mocked(verificationService.createLivenessSession).mockResolvedValueOnce({
      success: true,
      sessionId: "session-123",
    });
    vi.mocked(
      verificationService.completeLivenessRegistration,
    ).mockResolvedValueOnce({
      success: true,
      confidence: 99,
      similarity: 96,
      destination: "email-sent",
      redirectTo: "/register/email-sent?flow=flow-123",
    });
    const { unmount } = renderStepVerification();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "verification.start_process" }),
    );
    await screen.findByText("complete liveness");
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(screen.getByText("complete liveness"));
    });
    expect(screen.getByText("verification.modal.verified")).toBeInTheDocument();
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(5_000));
    expect(assign).not.toHaveBeenCalled();
  });

  it("waits for an explicit continuation before finalizing a verified draft", async () => {
    vi.mocked(accountService.registerAccount).mockResolvedValueOnce({
      success: true,
      destination: "email-sent",
      redirectTo: "/register/email-sent?flow=flow-123",
    });

    renderStepVerification({ isIdentityVerified: true });

    expect(accountService.registerAccount).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "verification.previously_verified",
    );

    fireEvent.click(screen.getByRole("button", { name: "account.continue" }));

    await waitFor(() => {
      expect(accountService.registerAccount).toHaveBeenCalledWith();
    });
    expect(verificationService.createLivenessSession).not.toHaveBeenCalled();
    expect(
      verificationService.completeLivenessRegistration,
    ).not.toHaveBeenCalled();
    expect(assign).toHaveBeenCalledWith("/register/email-sent?flow=flow-123");
  });

  it.each([
    "recovery_failed",
    "recovery_sessions_revocation_failed",
  ] as const)("returns %s after one explicit attempt without reopening the success modal", async (code) => {
    vi.mocked(accountService.registerAccount).mockResolvedValueOnce({
      success: false,
      code,
    });
    const props = renderStepVerification({ isIdentityVerified: true });
    expect(accountService.registerAccount).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "account.continue" }));

    await waitFor(() =>
      expect(props.onRequireAccount).toHaveBeenCalledWith({
        code,
        fieldErrors: undefined,
      }),
    );
    expect(accountService.registerAccount).toHaveBeenCalledTimes(1);
    expect(props.onRequireIdentification).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
  });

  it("always creates a liveness session before account finalization", async () => {
    vi.mocked(verificationService.createLivenessSession).mockResolvedValueOnce({
      success: true,
      sessionId: "session-123",
    });

    renderStepVerification();

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "verification.start_process" }),
    );

    await waitFor(() => {
      expect(verificationService.createLivenessSession).toHaveBeenCalledTimes(
        1,
      );
    });
    expect(accountService.registerAccount).not.toHaveBeenCalled();
    expect(
      verificationService.completeLivenessRegistration,
    ).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it("does not auto-retry or finalize the account when the liveness component errors", async () => {
    vi.mocked(verificationService.createLivenessSession).mockResolvedValueOnce({
      success: true,
      sessionId: "session-123",
    });

    renderStepVerification();

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "verification.start_process" }),
    );

    expect(await screen.findByText("fail liveness")).toBeInTheDocument();
    fireEvent.click(screen.getByText("fail liveness"));

    await waitFor(() => {
      expect(screen.queryByText("complete liveness")).not.toBeInTheDocument();
    });
    expect(verificationService.createLivenessSession).toHaveBeenCalledTimes(1);
    expect(verificationService.verifyLiveness).not.toHaveBeenCalled();
    expect(
      verificationService.completeLivenessRegistration,
    ).not.toHaveBeenCalled();
    expect(accountService.registerAccount).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith(
      "verification.verification_failed",
    );
    expect(assign).not.toHaveBeenCalled();
  });

  it("returns to the account step before verification when account data is missing", async () => {
    const onRequireAccount = vi.fn();

    renderStepVerification({
      onRequireAccount,
      accountDraft: {
        email: "",
        confirmEmail: "",
        password: "",
        confirmPassword: "",
      },
    });

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "verification.start_process" }),
    );

    expect(onRequireAccount).toHaveBeenCalledWith();
    expect(accountService.registerAccount).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it("returns to the account step with exact account errors when account creation fails", async () => {
    const onRequireAccount = vi.fn();
    vi.mocked(verificationService.createLivenessSession).mockResolvedValueOnce({
      success: true,
      sessionId: "session-123",
    });
    vi.mocked(
      verificationService.completeLivenessRegistration,
    ).mockResolvedValueOnce({
      success: false,
      stage: "account",
      code: "identity_exists",
      fieldErrors: {
        email: "identities.messages.4000007",
      },
    });

    renderStepVerification({ onRequireAccount });

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "verification.start_process" }),
    );

    expect(await screen.findByText("complete liveness")).toBeInTheDocument();
    fireEvent.click(screen.getByText("complete liveness"));

    await waitFor(() => {
      expect(onRequireAccount).toHaveBeenCalledWith({
        code: "identity_exists",
        fieldErrors: {
          email: "identities.messages.4000007",
        },
      });
    });
    expect(assign).not.toHaveBeenCalled();
  });
});
