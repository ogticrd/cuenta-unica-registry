import { Check } from "lucide-react";

interface SetupStep {
  number: number;
  title: string;
  subtitle: string;
  status: "completed" | "active" | "pending";
}

interface SetupStepsProps {
  steps: SetupStep[];
}

export function SetupSteps({ steps }: SetupStepsProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-8 mb-8 relative">
      {steps.map((step, index) => (
        <div
          key={step.number}
          className="flex items-center space-x-4 w-full md:w-auto"
        >
          <div className="flex items-center space-x-3 flex-1 md:flex-initial">
            {/* Step Circle */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                step.status === "completed"
                  ? "bg-primary text-white"
                  : step.status === "active"
                    ? "bg-primary text-white"
                    : "bg-gray-300 text-gray-600"
              }`}
            >
              {step.status === "completed" ? <Check size={16} /> : step.number}
            </div>

            {/* Step Info */}
            <div className="flex-1 md:flex-initial">
              <h3
                className={`font-semibold text-sm ${step.status === "active" ? "text-primary" : "text-gray-600"}`}
              >
                {step.title}
              </h3>
              <p className="text-xs text-gray-500">{step.subtitle}</p>
            </div>
          </div>

          {/* Connector Line - Hidden on mobile, vertical line on mobile between steps */}
          {index < steps.length - 1 && (
            <>
              {/* Desktop connector */}
              <div className="hidden md:block w-8 h-px bg-gray-300 ml-4"></div>
              {/* Mobile connector - vertical line */}
              <div className="md:hidden absolute left-5 mt-12 w-px h-4 bg-gray-300"></div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
