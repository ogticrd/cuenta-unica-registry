import type { ReactNode } from "react"

interface PlatformFeatureProps {
  icon: ReactNode
  title: string
  description: string
}

export function PlatformFeature({ icon, title, description }: PlatformFeatureProps) {
  return (
    <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="flex-shrink-0 p-3 bg-white rounded-lg shadow-sm">{icon}</div>
      <div className="flex-1">
        <h3 className="font-bold text-gray-900 mb-2 text-lg">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
