"use client"

import { Building2 } from 'lucide-react'
import { ActionButton } from "./action-button"

interface PortalItemProps {
  name: string
  lastAccess: string
  onUnlink?: () => void
}

export function PortalItem({ name, lastAccess, onUnlink }: PortalItemProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-gray-100 dark:border-border last:border-b-0 space-y-3 sm:space-y-0">
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="flex-shrink-0">
          <Building2 size={20} className="text-gray-400 dark:text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-primary dark:text-white mb-1 break-words">{name}</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Último acceso:</span> {lastAccess}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 sm:ml-4">
        <ActionButton variant="danger" onClick={onUnlink}>
          Desvincular
        </ActionButton>
      </div>
    </div>
  )
}
