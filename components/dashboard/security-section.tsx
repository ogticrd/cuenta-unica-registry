import { Info } from 'lucide-react'
import type { ReactNode } from "react"

interface SecuritySectionProps {
  title: string
  children: ReactNode
  hasInfoIcon?: boolean
  className?: string
}

export function SecuritySection({ title, children, hasInfoIcon = false, className = "" }: SecuritySectionProps) {
  return (
    <div className={`${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-6">
        <h2 className="text-xl font-semibold text-primary dark:text-blue-400">{title}</h2>
        {hasInfoIcon && <Info size={20} className="text-yellow-500 flex-shrink-0" />}
      </div>
      {children}
    </div>
  )
}
