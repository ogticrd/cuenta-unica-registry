"use client";

import { Login } from "@ory/elements-react/theme";

import { CucCardFooter, CucCardHeader } from "@/components/auth/ory-components";
import type { FeatureFlag } from "@/lib/services/feature-flags/feature-flags.service";

type LoginFormProps = {
  config: React.ComponentProps<typeof Login>["config"];
  flow: React.ComponentProps<typeof Login>["flow"];
  registrationFlag: FeatureFlag;
};

export function LoginForm({ config, flow, registrationFlag }: LoginFormProps) {
  const disabledFallback = registrationFlag.advancedSettings;
  const DisabledRegistrationFooter = () => {
    if (disabledFallback?.behavior !== "TEXT_MESSAGE") {
      return null;
    }

    return (
      <div className="text-center">
        <p className="text-sm font-semibold text-secondary dark:text-blue-400">
          {disabledFallback.title}
        </p>
        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          {disabledFallback.description}
        </p>
      </div>
    );
  };

  return (
    <Login
      flow={flow}
      config={config}
      components={{
        Card: {
          Header: CucCardHeader,
          Footer: registrationFlag.enabled
            ? CucCardFooter
            : DisabledRegistrationFooter,
        },
      }}
    />
  );
}
