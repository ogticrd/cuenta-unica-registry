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
    info: "bg-blue-100 text-blue-800 border border-transparent dark:bg-blue-900/30 dark:text-blue-300",
    warning: "bg-orange-100 text-orange-800 border border-transparent dark:bg-orange-900/30 dark:text-orange-300",
    success: "bg-green-100 text-green-800 border border-transparent dark:bg-green-900/30 dark:text-green-300",
  }

  return (
    <Link href={href} className="block group h-full">
      <div className="bg-gray-50 dark:bg-card/50 rounded-2xl border border-transparent dark:border-border/50 p-5 hover:bg-gray-100 dark:hover:bg-card/80 transition-colors h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="text-muted-foreground group-hover:text-secondary group-hover:bg-secondary/10 bg-white dark:bg-background p-2.5 rounded-xl transition-colors shadow-sm dark:shadow-none">
            {icon}
          </div>
          {badge && (
            <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full ${badgeClasses[badge.variant]}`}>
              {badge.text}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-bold text-foreground mb-1.5 group-hover:text-secondary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </Link>
  )
}
