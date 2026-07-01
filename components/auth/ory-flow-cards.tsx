"use client";

import type { OryClientConfiguration } from "@ory/elements-react";
import { Login, Recovery, Verification } from "@ory/elements-react/theme";
import {
  CucCardFooter,
  CucCardHeader,
  CucRecoveryFooter,
  CucRecoveryHeader,
  CucVerificationFooter,
  CucVerificationHeader,
} from "@/components/auth/ory-components";

type LoginFlow = Parameters<typeof Login>[0]["flow"];
type RecoveryFlow = Parameters<typeof Recovery>[0]["flow"];
type VerificationFlow = Parameters<typeof Verification>[0]["flow"];

interface OryFlowCardProps {
  flow: unknown;
  dynamicConfig: OryClientConfiguration;
}

interface OryLoginCardProps extends OryFlowCardProps {
  recoveryHref: string;
  registerHref: string;
  verificationHref: string;
}

export function OryLoginCard({
  flow,
  dynamicConfig,
  recoveryHref,
  registerHref,
  verificationHref,
}: OryLoginCardProps) {
  return (
    <Login
      flow={flow as LoginFlow}
      config={dynamicConfig}
      components={{
        Card: {
          Header: CucCardHeader,
          Footer: () => (
            <CucCardFooter
              recoveryHref={recoveryHref}
              registerHref={registerHref}
              verificationHref={verificationHref}
            />
          ),
        },
      }}
    />
  );
}

interface OryRecoveryCardProps extends OryFlowCardProps {
  loginHref: string;
}

export function OryRecoveryCard({
  flow,
  dynamicConfig,
  loginHref,
}: OryRecoveryCardProps) {
  return (
    <Recovery
      flow={flow as RecoveryFlow}
      config={dynamicConfig}
      components={{
        Card: {
          Header: CucRecoveryHeader,
          Footer: () => <CucRecoveryFooter loginHref={loginHref} />,
        },
      }}
    />
  );
}

interface OryVerificationCardProps extends OryFlowCardProps {
  loginHref: string;
}

export function OryVerificationCard({
  flow,
  dynamicConfig,
  loginHref,
}: OryVerificationCardProps) {
  return (
    <Verification
      flow={flow as VerificationFlow}
      config={dynamicConfig}
      components={{
        Card: {
          Header: CucVerificationHeader,
          Footer: () => <CucVerificationFooter loginHref={loginHref} />,
        },
      }}
    />
  );
}
