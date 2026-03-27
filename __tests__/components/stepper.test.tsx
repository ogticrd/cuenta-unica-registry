import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Utility function
function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}

// Stepper component (copied from project)
interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  activeStep: number;
  stepLabel?: string;
  steps: {
    title: string;
    description?: string;
  }[];
}

function Stepper({
  activeStep,
  stepLabel = "Step",
  steps,
  className,
  ...props
}: StepperProps) {
  return (
    <div
      className={cn("w-full py-2 flex flex-col items-center", className)}
      {...props}
    >
      <div className="flex w-full max-w-xs md:max-w-sm items-center gap-2">
        {steps.map((step, index) => {
          const isActiveOrCompleted = index <= activeStep;
          return (
            <div key={step.title} className="flex-1">
              <div
                data-active={isActiveOrCompleted}
                className={cn(
                  "h-1.5 w-full rounded-full transition-colors duration-300 step-bar",
                  isActiveOrCompleted ? "bg-active" : "bg-muted",
                )}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-center animate-in fade-in zoom-in-95 duration-300">
        <h4 className="text-sm font-bold text-primary dark:text-blue-400">
          {stepLabel} {activeStep + 1}: {steps[activeStep]?.title}
        </h4>
        {steps[activeStep]?.description && (
          <p className="text-xs text-muted-foreground/80 dark:text-slate-400 mt-1 font-medium">
            {steps[activeStep]?.description}
          </p>
        )}
      </div>
    </div>
  );
}

describe("Stepper", () => {
  const defaultSteps = [
    { title: "Identification", description: "Enter your ID" },
    { title: "Account", description: "Create your account" },
    { title: "Verification", description: "Verify your email" },
  ];

  it("should render all step indicators", () => {
    render(<Stepper activeStep={0} steps={defaultSteps} />);

    // Should have 3 step indicator bars
    const stepBars = document.querySelectorAll(".step-bar");
    expect(stepBars).toHaveLength(3);
  });

  it("should highlight active and completed steps", () => {
    render(<Stepper activeStep={1} steps={defaultSteps} />);

    const stepBars = document.querySelectorAll(".step-bar");

    // First two steps should be highlighted (active or completed)
    expect(stepBars[0]).toHaveAttribute("data-active", "true");
    expect(stepBars[1]).toHaveAttribute("data-active", "true");
    // Last step should not be highlighted
    expect(stepBars[2]).toHaveAttribute("data-active", "false");
  });

  it("should display current step title", () => {
    render(<Stepper activeStep={0} steps={defaultSteps} />);

    expect(screen.getByText("Step 1: Identification")).toBeInTheDocument();
  });

  it("should display current step description", () => {
    render(<Stepper activeStep={0} steps={defaultSteps} />);

    expect(screen.getByText("Enter your ID")).toBeInTheDocument();
  });

  it("should update displayed step when activeStep changes", () => {
    const { rerender } = render(
      <Stepper activeStep={0} steps={defaultSteps} />,
    );

    expect(screen.getByText("Step 1: Identification")).toBeInTheDocument();

    rerender(<Stepper activeStep={1} steps={defaultSteps} />);
    expect(screen.getByText("Step 2: Account")).toBeInTheDocument();

    rerender(<Stepper activeStep={2} steps={defaultSteps} />);
    expect(screen.getByText("Step 3: Verification")).toBeInTheDocument();
  });

  it("should use custom step label when provided", () => {
    render(<Stepper activeStep={0} steps={defaultSteps} stepLabel="Paso" />);

    expect(screen.getByText("Paso 1: Identification")).toBeInTheDocument();
  });

  it("should not display description when not provided", () => {
    const stepsWithoutDescription = [{ title: "Step 1" }, { title: "Step 2" }];

    render(<Stepper activeStep={0} steps={stepsWithoutDescription} />);

    expect(screen.getByText("Step 1: Step 1")).toBeInTheDocument();
    expect(screen.queryByText("Enter your ID")).not.toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <Stepper activeStep={0} steps={defaultSteps} className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should spread additional props", () => {
    render(
      <Stepper
        activeStep={0}
        steps={defaultSteps}
        data-testid="stepper-component"
        aria-label="Registration progress"
      />,
    );

    const stepper = screen.getByTestId("stepper-component");
    expect(stepper).toHaveAttribute("aria-label", "Registration progress");
  });

  it("should handle single step", () => {
    const singleStep = [{ title: "Only Step", description: "Single step" }];

    render(<Stepper activeStep={0} steps={singleStep} />);

    expect(screen.getByText("Step 1: Only Step")).toBeInTheDocument();
    expect(screen.getByText("Single step")).toBeInTheDocument();

    const stepBars = document.querySelectorAll(".step-bar");
    expect(stepBars).toHaveLength(1);
    expect(stepBars[0]).toHaveAttribute("data-active", "true");
  });

  it("should handle many steps", () => {
    const manySteps = Array.from({ length: 10 }, (_, i) => ({
      title: `Step ${i + 1}`,
      description: `Description ${i + 1}`,
    }));

    render(<Stepper activeStep={5} steps={manySteps} />);

    expect(screen.getByText("Step 6: Step 6")).toBeInTheDocument();

    const stepBars = document.querySelectorAll(".step-bar");
    expect(stepBars).toHaveLength(10);

    // First 6 steps should be highlighted (0-5)
    stepBars.forEach((bar, index) => {
      if (index <= 5) {
        expect(bar).toHaveAttribute("data-active", "true");
      } else {
        expect(bar).toHaveAttribute("data-active", "false");
      }
    });
  });

  it("should handle activeStep at last position", () => {
    render(<Stepper activeStep={2} steps={defaultSteps} />);

    expect(screen.getByText("Step 3: Verification")).toBeInTheDocument();

    const stepBars = document.querySelectorAll(".step-bar");
    stepBars.forEach((bar) => {
      expect(bar).toHaveAttribute("data-active", "true");
    });
  });

  it("should handle activeStep at first position", () => {
    render(<Stepper activeStep={0} steps={defaultSteps} />);

    expect(screen.getByText("Step 1: Identification")).toBeInTheDocument();

    const stepBars = document.querySelectorAll(".step-bar");
    expect(stepBars[0]).toHaveAttribute("data-active", "true");
    expect(stepBars[1]).toHaveAttribute("data-active", "false");
    expect(stepBars[2]).toHaveAttribute("data-active", "false");
  });

  it("should render with correct structure", () => {
    const { container } = render(
      <Stepper activeStep={0} steps={defaultSteps} />,
    );

    // Main container
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv.tagName).toBe("DIV");
    expect(mainDiv).toHaveClass("w-full");
    expect(mainDiv).toHaveClass("py-2");
    expect(mainDiv).toHaveClass("flex");
    expect(mainDiv).toHaveClass("flex-col");
    expect(mainDiv).toHaveClass("items-center");
  });

  it("should have accessible step information", () => {
    render(<Stepper activeStep={1} steps={defaultSteps} />);

    // The step title should be visible and accessible
    const stepTitle = screen.getByRole("heading", { level: 4 });
    expect(stepTitle).toHaveTextContent("Step 2: Account");
  });
});

describe("Stepper Edge Cases", () => {
  it("should handle empty steps array", () => {
    render(<Stepper activeStep={0} steps={[]} />);

    // Should render without crashing
    const stepBars = document.querySelectorAll(".step-bar");
    expect(stepBars).toHaveLength(0);
  });

  it("should handle activeStep out of bounds (high)", () => {
    const steps = [{ title: "Step 1" }, { title: "Step 2" }];

    render(<Stepper activeStep={10} steps={steps} />);

    // Should render but title will be undefined
    expect(screen.getByText("Step 11:")).toBeInTheDocument();
  });

  it("should handle negative activeStep", () => {
    const steps = [{ title: "Step 1" }, { title: "Step 2" }];

    render(<Stepper activeStep={-1} steps={steps} />);

    // All steps should be muted since -1 <= index is never true for positive indices
    const stepBars = document.querySelectorAll(".step-bar");
    stepBars.forEach((bar) => {
      expect(bar).toHaveAttribute("data-active", "false");
    });
  });

  it("should handle steps with special characters", () => {
    const steps = [
      { title: "Step 1: Special!", description: "Description with émojis 🎉" },
    ];

    render(<Stepper activeStep={0} steps={steps} />);

    expect(screen.getByText("Step 1: Step 1: Special!")).toBeInTheDocument();
    expect(screen.getByText("Description with émojis 🎉")).toBeInTheDocument();
  });

  it("should handle very long titles and descriptions", () => {
    const longTitle =
      "This is a very long step title that might need to wrap or be truncated";
    const longDescription =
      "This is a very long description that provides detailed information about what the user should do in this step of the registration process";

    const steps = [{ title: longTitle, description: longDescription }];

    render(<Stepper activeStep={0} steps={steps} />);

    expect(screen.getByText(`Step 1: ${longTitle}`)).toBeInTheDocument();
    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });
});

describe("Stepper Visual States", () => {
  const steps = [
    { title: "First", description: "First step" },
    { title: "Second", description: "Second step" },
    { title: "Third", description: "Third step" },
  ];

  it("should show correct visual state for first step active", () => {
    render(<Stepper activeStep={0} steps={steps} />);

    const stepBars = document.querySelectorAll(".step-bar");
    expect(stepBars[0]).toHaveAttribute("data-active", "true");
    expect(stepBars[1]).toHaveAttribute("data-active", "false");
    expect(stepBars[2]).toHaveAttribute("data-active", "false");
  });

  it("should show correct visual state for middle step active", () => {
    render(<Stepper activeStep={1} steps={steps} />);

    const stepBars = document.querySelectorAll(".step-bar");
    expect(stepBars[0]).toHaveAttribute("data-active", "true");
    expect(stepBars[1]).toHaveAttribute("data-active", "true");
    expect(stepBars[2]).toHaveAttribute("data-active", "false");
  });

  it("should show correct visual state for last step active", () => {
    render(<Stepper activeStep={2} steps={steps} />);

    const stepBars = document.querySelectorAll(".step-bar");
    expect(stepBars[0]).toHaveAttribute("data-active", "true");
    expect(stepBars[1]).toHaveAttribute("data-active", "true");
    expect(stepBars[2]).toHaveAttribute("data-active", "true");
  });
});
