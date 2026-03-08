"use client"

import { ConfirmationModal } from "@/components/ui/confirmation-modal"

interface UnlinkDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  deviceName: string
  isLoading?: boolean
}

export function UnlinkDeviceModal({
  isOpen,
  onClose,
  onConfirm,
  deviceName,
  isLoading = false,
}: UnlinkDeviceModalProps) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`¿Deseas desvincular el dispositivo "${deviceName}"?`}
      description="Si desvinculas este dispositivo"
      confirmText="DESVINCULAR"
      cancelText="CANCELAR"
      confirmVariant="destructive"
      isLoading={isLoading}
    >
      <ul className="space-y-2 text-sm text-gray-800">
        <li className="flex items-start">
          <span className="text-gray-600 mr-2">•</span>
          <span>Este dispositivo perderá acceso a tu cuenta.</span>
        </li>
        <li className="flex items-start">
          <span className="text-gray-600 mr-2">•</span>
          <span>Deberás iniciar sesión nuevamente desde este dispositivo.</span>
        </li>
        <li className="flex items-start">
          <span className="text-gray-600 mr-2">•</span>
          <span>Esta acción no afectará otros dispositivos vinculados.</span>
        </li>
      </ul>
    </ConfirmationModal>
  )
}
