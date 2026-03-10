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
    info: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
    success: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
    warning: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30"
  }

  return (
    <div className="flex items-start gap-4 py-4 border-b border-border dark:border-border/50 last:border-0 hover:bg-secondary/10 transition-colors rounded-xl px-2 sm:px-4">
      <div className={`flex-shrink-0 p-2 rounded-full ${typeClasses[type]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1">
          <p className="text-sm font-bold text-foreground truncate">{title}</p>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{time}</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
