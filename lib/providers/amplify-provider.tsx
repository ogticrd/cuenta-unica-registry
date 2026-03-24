"use client";

import { Amplify } from "aws-amplify";
import { getAmplifyConfig } from "@/lib/aws/amplify-config";

Amplify.configure(getAmplifyConfig());

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
