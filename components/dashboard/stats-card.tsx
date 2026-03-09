import type { ReactNode } from "react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  description?: string
  trend?: {
    value: string
    isPositive: boolean
  }
}

export function StatsCard({ title, value, icon, description, trend }: StatsCardProps) {
  return (
    <div className="bg-card text-card-foreground rounded-lg border border-gray-200 dark:border-border p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
          {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend.isPositive ? '↗' : '↘'} {trend.value}
              </span>
            </div>
          )}
        </div>
        <div className="text-primary dark:text-blue-400 opacity-80">
          {icon}
        </div>
      </div>
    </div>
  )
}
