import type { ReactNode } from "react"

interface PlatformFeatureProps {
  icon: ReactNode
  title: string
  description: string
}

export function PlatformFeature({ icon, title, description }: PlatformFeatureProps) {
  return (
    <div className="flex items-start space-x-4 p-6 bg-gray-50 dark:bg-background/50 rounded-xl hover:bg-gray-100 dark:hover:bg-background transition-colors border border-transparent dark:border-border">
      <div className="flex-shrink-0 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-transparent dark:border-border">{icon}</div>
      <div className="flex-1">
        <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
