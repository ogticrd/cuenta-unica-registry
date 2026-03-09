import Link from "next/link"
import type { ReactNode } from "react"

interface QuickActionCardProps {
  title: string
  description: string
  icon: ReactNode
  href: string
  badge?: {
    text: string
    variant: "info" | "warning" | "success"
  }
}

export function QuickActionCard({ title, description, icon, href, badge }: QuickActionCardProps) {
  const badgeClasses = {
    info: "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    warning: "bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    success: "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  }

  return (
    <Link href={href} className="block group">
      <div className="bg-white dark:bg-background rounded-lg border border-gray-200 dark:border-border p-6 hover:shadow-md dark:hover:shadow-gray-800/30 transition-shadow duration-200 h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-primary dark:text-blue-400 group-hover:text-primary/80 dark:group-hover:text-blue-300 transition-colors">
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                {title}
              </h3>
            </div>
          </div>
          {badge && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeClasses[badge.variant]}`}>
              {badge.text}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
      </div>
    </Link>
  )
}
