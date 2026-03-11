"use client"

import { Settings } from "@ory/elements-react/theme"
import config from "@/ory.config"

type OrySettingsFlow = Parameters<typeof Settings>[0]["flow"]

interface OrySettingsWrapperProps {
  flow: unknown
}

function OrySettings({ flow }: OrySettingsWrapperProps) {
  return (
    <Settings
      flow={flow as OrySettingsFlow}
      config={config}
      components={{
        Page: {
          Header: () => null,
        },
      }}
    />
  )
}

export default OrySettings
