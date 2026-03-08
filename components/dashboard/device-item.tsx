"use client"

import { Monitor } from 'lucide-react'
import { ActionButton } from "./action-button"

interface DeviceItemProps {
  device: string
  ipAddress: string
  location: string
  lastAccess: string
  provider: string
  status: {
    text: string
    variant: "active" | "current"
  }
  onUnlink?: () => void
}

export function DeviceItem({ device, ipAddress, location, lastAccess, provider, status, onUnlink }: DeviceItemProps) {
  const statusClasses = {
    active: "bg-blue-100 text-blue-800 border border-blue-200",
    current: "bg-green-100 text-green-800 border border-green-200",
  }

  return (
    <div className="flex flex-col space-y-4 py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-1">
            <Monitor size={20} className="text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 mb-3">
              <h3 className="font-medium text-gray-900 truncate">{device}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full w-fit ${statusClasses[status.variant]}`}>
                {status.text}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          <ActionButton variant="danger" onClick={onUnlink}>
            Desvincular
          </ActionButton>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600 ml-0 sm:ml-12">
        <div>
          <div className="font-medium text-gray-900 mb-1">IP address</div>
          <div className="break-all">{ipAddress}</div>
        </div>
        <div>
          <div className="font-medium text-gray-900 mb-1">Ubicación</div>
          <div>{location}</div>
        </div>
        <div>
          <div className="font-medium text-gray-900 mb-1">Último acceso</div>
          <div>{lastAccess}</div>
        </div>
        <div>
          <div className="font-medium text-gray-900 mb-1">Proveedor</div>
          <div>{provider}</div>
        </div>
      </div>
    </div>
  )
}
