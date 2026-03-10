"use client"

import { Monitor } from 'lucide-react'
import { ActionButton } from "./action-button"

interface DeviceItemProps {
  device: string
  ipAddress: string
  location: string
  lastAccess: string
  expirationDate: string
  status: {
    text: string
    variant: "active" | "current"
  }
  onUnlink?: () => void
}

export function DeviceItem({ device, ipAddress, location, lastAccess, expirationDate, status, onUnlink }: DeviceItemProps) {
  const statusClasses = {
    active: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
    current: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800",
  }

  return (
    <div className="flex flex-col space-y-4 py-4 border-b border-gray-100 dark:border-border last:border-b-0">

      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        {/* Left: Icon and Details */}
        <div className="flex items-start sm:items-center space-x-4 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-1 sm:mt-0">
            <Monitor size={20} className="text-gray-400 dark:text-gray-500" />
          </div>

          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">

            {/* Device Name */}
            <h3 className="font-medium text-gray-900 dark:text-white truncate flex-1" title={device}>
              {device}
            </h3>

            {/* Right: Badge + Action Button (Always inline) */}
            <div className="flex flex-row items-center gap-3 mt-1 sm:mt-0">
              <span className={`px-2 py-1 text-xs font-medium rounded-full min-w-32 text-center whitespace-nowrap ${statusClasses[status.variant]}`}>
                {status.text}
              </span>
              {onUnlink && (
                <ActionButton variant="danger" onClick={onUnlink} className="shrink-0">
                  Desvincular
                </ActionButton>
              )}
            </div>

          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-400 ml-0 sm:ml-12">
        <div>
          <div className="font-semibold text-primary dark:text-gray-200 mb-1">IP address</div>
          <div className="break-all">{ipAddress}</div>
        </div>
        <div>
          <div className="font-semibold text-primary dark:text-gray-200 mb-1">Ubicación</div>
          <div>{location}</div>
        </div>
        <div>
          <div className="font-semibold text-primary dark:text-gray-200 mb-1">Inició sesión el</div>
          <div>{lastAccess}</div>
        </div>
        <div>
          <div className="font-semibold text-primary dark:text-gray-200 mb-1">Expira el</div>
          <div>{expirationDate}</div>
        </div>
      </div>
    </div>
  )
}
