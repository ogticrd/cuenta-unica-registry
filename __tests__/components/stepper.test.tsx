import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stepper } from "@/components/ui/stepper";

describe("Stepper", () => {
  const steps = [
    { title: "Identification", description: "Enter your ID" },
    { title: "Account", description: "Create your account" },
    { title: "Verification", description: "Verify your email" },
  ];

  it("renders the current step title and description from the real component", () => {
    render(<Stepper activeStep={1} steps={steps} />);

    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent(
      "Step 2: Account",
    );
    expect(screen.getByText("Create your account")).toBeInTheDocument();
  });

  it("supports a custom step label", () => {
    render(<Stepper activeStep={0} stepLabel="Paso" steps={steps} />);

    expect(screen.getByText("Paso 1: Identification")).toBeInTheDocument();
  });

  it("applies additional props and classes", () => {
    render(
      <Stepper
        activeStep={0}
        steps={steps}
        className="custom-class"
        data-testid="stepper"
        aria-label="Registration progress"
      />,
    );

    const stepper = screen.getByTestId("stepper");
    expect(stepper).toHaveClass("custom-class");
    expect(stepper).toHaveAttribute("aria-label", "Registration progress");
  });

  it("renders one progress segment per step", () => {
    const { container } = render(<Stepper activeStep={2} steps={steps} />);

    expect(container.querySelectorAll(".flex-1")).toHaveLength(3);
  });

  it("omits the description when the active step has none", () => {
    render(
      <Stepper
        activeStep={0}
        steps={[{ title: "Only Step" }, { title: "Next" }]}
      />,
    );

    expect(screen.getByText("Step 1: Only Step")).toBeInTheDocument();
    expect(screen.queryByText("Enter your ID")).not.toBeInTheDocument();
  });
});
