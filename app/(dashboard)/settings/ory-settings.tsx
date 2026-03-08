"use client"

import { Settings } from "@ory/elements-react/theme"
import config from "@/ory.config"
import type { SettingsFlow } from "@ory/client"

interface OrySettingsWrapperProps {
    flow: SettingsFlow
}

function OrySettings({ flow }: OrySettingsWrapperProps) {
    return (
        <Settings
            flow={flow as any}
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