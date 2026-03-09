"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { SecuritySection } from "@/components/dashboard/security-section"
import { DeviceItem } from "@/components/dashboard/device-item"
import { PortalItem } from "@/components/dashboard/portal-item"
import { UnlinkDeviceModal } from "@/components/dashboard/unlink-device-modal"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

export default function HistoryPage() {
  const [unlinkDeviceModal, setUnlinkDeviceModal] = useState<{
    isOpen: boolean
    deviceName: string
    deviceId: number | null
    isLoading: boolean
  }>({
    isOpen: false,
    deviceName: "",
    deviceId: null,
    isLoading: false,
  })

  const [unlinkPortalModal, setUnlinkPortalModal] = useState<{
    isOpen: boolean
    portalName: string
    portalId: number | null
    isLoading: boolean
  }>({
    isOpen: false,
    portalName: "",
    portalId: null,
    isLoading: false,
  })

  const devices = [
    {
      id: 1,
      device: "Mac OS X100 / Chrome / 108.00",
      ipAddress: "190.122.100.10",
      location: "Santo Domingo Este, Rep. Dom.",
      lastAccess: "Enero 4, 2023 - 1:30pm",
      provider: "Google",
      status: { text: "SESIÓN ACTIVA", variant: "current" as const },
    },
    {
      id: 2,
      device: "Mac OS X100 / Chrome / 108.00",
      ipAddress: "190.122.100.10",
      location: "Santo Domingo Este, Rep. Dom.",
      lastAccess: "Enero 4, 2023 - 1:30pm",
      provider: "Google",
      status: { text: "ACTIVO", variant: "active" as const },
    },
    {
      id: 3,
      device: "Mac OS X100 / Chrome / 108.00",
      ipAddress: "190.122.100.10",
      location: "Santo Domingo Este, Rep. Dom.",
      lastAccess: "Enero 4, 2023 - 1:30pm",
      provider: "Google",
      status: { text: "ACTIVO", variant: "active" as const },
    },
    {
      id: 4,
      device: "Mac OS X100 / Chrome / 108.00",
      ipAddress: "190.122.100.10",
      location: "Santo Domingo Este, Rep. Dom.",
      lastAccess: "Enero 4, 2023 - 1:30pm",
      provider: "Google",
      status: { text: "ACTIVO", variant: "active" as const },
    },
  ]

  const portals = [
    {
      id: 1,
      name: "ONAPI",
      lastAccess: "Enero 4, 2023 - 1:30pm",
    },
    {
      id: 2,
      name: "Ventanilla Única de Inversión",
      lastAccess: "Enero 4, 2023 - 1:30pm",
    },
    {
      id: 3,
      name: "Portal de Becas",
      lastAccess: "Enero 4, 2023 - 1:30pm",
    },
    {
      id: 4,
      name: "Ministerio de Salud Pública y Asistencia Social",
      lastAccess: "Enero 4, 2023 - 1:30pm",
    },
    {
      id: 5,
      name: "Consejo Nacional de la Reforma del Estado",
      lastAccess: "Enero 4, 2023 - 1:30pm",
    },
  ]

  const handleOpenUnlinkDeviceModal = (deviceId: number, deviceName: string) => {
    setUnlinkDeviceModal({
      isOpen: true,
      deviceName,
      deviceId,
      isLoading: false,
    })
  }

  const handleCloseUnlinkDeviceModal = () => {
    setUnlinkDeviceModal({
      isOpen: false,
      deviceName: "",
      deviceId: null,
      isLoading: false,
    })
  }

  const handleConfirmUnlinkDevice = async () => {
    setUnlinkDeviceModal((prev) => ({ ...prev, isLoading: true }))

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log("Desvincular dispositivo:", unlinkDeviceModal.deviceId)

      // Close modal after successful unlink
      handleCloseUnlinkDeviceModal()
    } catch (error) {
      console.error("Error al desvincular dispositivo:", error)
      setUnlinkDeviceModal((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const handleOpenUnlinkPortalModal = (portalId: number, portalName: string) => {
    setUnlinkPortalModal({
      isOpen: true,
      portalName,
      portalId,
      isLoading: false,
    })
  }

  const handleCloseUnlinkPortalModal = () => {
    setUnlinkPortalModal({
      isOpen: false,
      portalName: "",
      portalId: null,
      isLoading: false,
    })
  }

  const handleConfirmUnlinkPortal = async () => {
    setUnlinkPortalModal((prev) => ({ ...prev, isLoading: true }))

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log("Desvincular portal:", unlinkPortalModal.portalId)

      // Close modal after successful unlink
      handleCloseUnlinkPortalModal()
    } catch (error) {
      console.error("Error al desvincular portal:", error)
      setUnlinkPortalModal((prev) => ({ ...prev, isLoading: false }))
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-bold text-primary dark:text-blue-400 mb-6 sm:mb-8">Historial de actividad</h1>

        <div className="space-y-6 sm:space-y-8">
          {/* Dispositivos Section */}
          <SecuritySection title="Dispositivos">
            <div className="space-y-0">
              {devices.map((device) => (
                <DeviceItem
                  key={device.id}
                  device={device.device}
                  ipAddress={device.ipAddress}
                  location={device.location}
                  lastAccess={device.lastAccess}
                  provider={device.provider}
                  status={device.status}
                  onUnlink={() => handleOpenUnlinkDeviceModal(device.id, device.device)}
                />
              ))}
            </div>
          </SecuritySection>

          {/* Portales institucionales Section */}
          <SecuritySection title="Portales institucionales">
            <div className="space-y-0">
              {portals.map((portal) => (
                <PortalItem
                  key={portal.id}
                  name={portal.name}
                  lastAccess={portal.lastAccess}
                  onUnlink={() => handleOpenUnlinkPortalModal(portal.id, portal.name)}
                />
              ))}
            </div>
          </SecuritySection>
        </div>

        {/* Unlink Device Modal */}
        <UnlinkDeviceModal
          isOpen={unlinkDeviceModal.isOpen}
          onClose={handleCloseUnlinkDeviceModal}
          onConfirm={handleConfirmUnlinkDevice}
          deviceName={unlinkDeviceModal.deviceName}
          isLoading={unlinkDeviceModal.isLoading}
        />

        {/* Unlink Portal Modal */}
        <ConfirmationModal
          isOpen={unlinkPortalModal.isOpen}
          onClose={handleCloseUnlinkPortalModal}
          onConfirm={handleConfirmUnlinkPortal}
          title={`¿Deseas desvincular el portal "${unlinkPortalModal.portalName}"?`}
          description="Si desvinculas este portal"
          confirmText="DESVINCULAR"
          cancelText="CANCELAR"
          confirmVariant="destructive"
          isLoading={unlinkPortalModal.isLoading}
        >
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <span className="text-gray-400 dark:text-gray-500 mr-2">•</span>
              <span>Perderás acceso directo a este portal desde tu cuenta.</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 dark:text-gray-500 mr-2">•</span>
              <span>Deberás autenticarte nuevamente para acceder al portal.</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 dark:text-gray-500 mr-2">•</span>
              <span>Podrás volver a vincular el portal cuando lo necesites.</span>
            </li>
          </ul>
        </ConfirmationModal>
      </div>
    </DashboardLayout>
  )
}
