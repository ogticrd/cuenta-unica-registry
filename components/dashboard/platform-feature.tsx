import type { ReactNode } from "react"

interface PlatformFeatureProps {
  icon: ReactNode
  title: string
  description: string
}

export function PlatformFeature({ icon, title, description }: PlatformFeatureProps) {
  return (
    <div className="flex items-start space-x-4 p-5 bg-gray-50 dark:bg-background/50 rounded-xl hover:bg-gray-100 dark:hover:bg-card transition-colors border border-transparent dark:border-border">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div className="flex-1">
        <h3 className="font-bold text-foreground mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
