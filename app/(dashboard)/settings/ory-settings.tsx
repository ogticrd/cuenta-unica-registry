"use client"

import { Settings } from "@ory/elements-react/theme"

type OrySettingsFlow = Parameters<typeof Settings>[0]["flow"]

interface OrySettingsWrapperProps {
  flow: unknown;
  dynamicConfig: any;
}

function OrySettings({ flow, dynamicConfig }: OrySettingsWrapperProps) {
  return (
    <Settings
      flow={flow as OrySettingsFlow}
      config={dynamicConfig}
      components={{
        Page: {
          Header: () => null,
        },
      }}
    />
  )
}

export default OrySettings
