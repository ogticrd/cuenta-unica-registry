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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-border last:border-b-0 gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-shrink-0 text-muted-foreground bg-gray-100 p-2 rounded-full dark:bg-gray-800">
          <Building2 size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-0.5 truncate">{name}</h3>
          <div className="text-sm text-muted-foreground truncate">
            Último acceso: {lastAccess}
          </div>
        </div>
      </div>
      {onUnlink && (
        <div className="flex-shrink-0">
          <ActionButton variant="danger" onClick={onUnlink} className="w-full sm:w-auto dark:hover:bg-red-600/10">
            Desvincular
          </ActionButton>
        </div>
      )}
    </div>
  )
}
