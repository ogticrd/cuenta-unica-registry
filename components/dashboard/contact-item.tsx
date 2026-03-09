import type { ReactNode } from "react"

interface ContactItemProps {
  icon: ReactNode
  children: ReactNode
  className?: string
}

export function ContactItem({ icon, children, className = "" }: ContactItemProps) {
  return (
    <div className={`flex items-start space-x-4 ${className}`}>
      <div className="flex-shrink-0 text-secondary dark:text-blue-400 mt-1">{icon}</div>
      <div className="text-secondary dark:text-blue-400 font-medium">{children}</div>
    </div>
  )
}
