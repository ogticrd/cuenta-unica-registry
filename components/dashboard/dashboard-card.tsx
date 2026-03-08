import type { ReactNode } from "react"

interface DashboardCardProps {
  title: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function DashboardCard({ title, children, className = "", action }: DashboardCardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}
