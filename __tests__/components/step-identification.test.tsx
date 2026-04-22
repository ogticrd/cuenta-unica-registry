import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockIdentifyCitizen } = vi.hoisted(() => ({
  mockIdentifyCitizen: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/services/registration/citizen.service", () => ({
  citizenService: {
    identifyCitizen: mockIdentifyCitizen,
  },
}));

import { StepIdentification } from "@/components/auth/register/steps/step-identification";

describe("StepIdentification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the formatted default cedula from the real component", () => {
    render(
      <StepIdentification
        onNext={vi.fn()}
        updateData={vi.fn()}
        defaultValues={{ cedula: "40200612345" }}
      />,
    );

    expect(screen.getByRole("textbox")).toHaveValue("402-0061234-5");
  });

  it("submits the normalized cedula and returnUrl on success", async () => {
    const onNext = vi.fn();
    const updateData = vi.fn();
    mockIdentifyCitizen.mockResolvedValueOnce({
      success: true,
      citizen: {
        id: "40200612345",
        firstName: "Juan",
      },
    });

    render(
      <StepIdentification
        onNext={onNext}
        updateData={updateData}
        defaultValues={{ cedula: "" }}
        returnUrl="https://example.com/dashboard"
      />,
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "40200612345" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "identification.continue" }),
    );

    await waitFor(() => {
      expect(mockIdentifyCitizen).toHaveBeenCalledWith(
        "40200612345",
        "https://example.com/dashboard",
      );
    });
    expect(updateData).toHaveBeenCalledWith({
      cedula: "40200612345",
      name: "Juan",
    });
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("maps service errors onto the cedula field", async () => {
    mockIdentifyCitizen.mockResolvedValueOnce({
      success: false,
      code: "identity_exists",
    });

    render(
      <StepIdentification
        onNext={vi.fn()}
        updateData={vi.fn()}
        defaultValues={{ cedula: "" }}
      />,
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "40200612345" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "identification.continue" }),
    );

    expect(
      await screen.findByText("identification.account_exists"),
    ).toBeInTheDocument();
  });
});
