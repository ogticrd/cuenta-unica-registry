import type { ReactNode } from "react"

interface RecentActivityItemProps {
  icon: ReactNode
  title: string
  description: string
  time: string
  type?: "info" | "success" | "warning"
}

export function RecentActivityItem({ icon, title, description, time, type = "info" }: RecentActivityItemProps) {
  const typeClasses = {
    info: "text-blue-600",
    success: "text-green-600", 
    warning: "text-orange-600"
  }

  return (
    <div className="flex items-start space-x-4 py-3">
      <div className={`flex-shrink-0 mt-1 ${typeClasses[type]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  )
}
