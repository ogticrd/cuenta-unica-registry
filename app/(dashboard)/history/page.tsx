"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { SecuritySection } from "@/components/dashboard/security-section"
import { DeviceItem } from "@/components/dashboard/device-item"
import { PortalItem } from "@/components/dashboard/portal-item"
import { UnlinkDeviceModal } from "@/components/dashboard/unlink-device-modal"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { History } from "lucide-react"

export default function HistoryPage() {
  const { session, refreshSession } = useAuth()
  const [unlinkDeviceModal, setUnlinkDeviceModal] = useState<{
    isOpen: boolean
    deviceName: string
    deviceId: string | null
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

  // -- Dynamic Devices from Ory Session --
  const allSessions: any[] = []
  if (session) {
    allSessions.push(session)
    if (session.other_sessions && Array.isArray(session.other_sessions)) {
      allSessions.push(...session.other_sessions)
    }
  }

  const dynamicDevices = allSessions.map((sess: any, index: number) => {
    const dev = sess.devices?.[0] || {}
    const isCurrentSession = index === 0

    return {
      id: sess.id || `fallback-${index}`, // The REAL SESSION ID
      device: dev.user_agent || "Dispositivo Desconocido",
      ipAddress: dev.ip_address || "IP Desconocida",
      location: dev.location || "Ubicación Desconocida",
      lastAccess: sess.authenticated_at
        ? new Date(sess.authenticated_at).toLocaleString("es-DO")
        : "Reciente",
      expirationDate: sess.expires_at
        ? new Date(sess.expires_at).toLocaleString("es-DO")
        : "Indefinido",
      isCurrentSession,
      status: isCurrentSession
        ? { text: "SESIÓN ACTIVA", variant: "current" as const }
        : { text: "ACTIVO", variant: "active" as const }
    }
  })

  // Fallback to empty state if array is empty (instead of static data)
  const devices = dynamicDevices;

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

  const handleOpenUnlinkDeviceModal = (deviceId: string, deviceName: string) => {
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
    if (!unlinkDeviceModal.deviceId) return

    setUnlinkDeviceModal((prev) => ({ ...prev, isLoading: true }))
    const toastId = toast.loading("Desvinculando dispositivo...")

    try {
      const response = await fetch(`/api/ory/sessions/${unlinkDeviceModal.deviceId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to unlink device")
      }

      toast.success("Dispositivo desvinculado correctamente", { id: toastId })

      // Refresh context to reload the devices list
      await refreshSession()

      handleCloseUnlinkDeviceModal()
    } catch (error) {
      console.error("Error al desvincular dispositivo:", error)
      toast.error("Ocurrió un error al desvincular el dispositivo", { id: toastId })
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
      <div className="max-w-4xl mx-auto space-y-12 pb-12">
        {/* Header Section */}
        <div className="pt-4 pb-8 border-b dark:border-border">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Historial de Actividad</h1>
            <div className="bg-primary/10 text-primary p-2 rounded-full">
              <History size={24} />
            </div>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            Consulta y gestiona los dispositivos y portales institucionales vinculados a tu cuenta.
          </p>
        </div>

        <div className="space-y-12">
          {/* Dispositivos Section */}
          <SecuritySection title="Dispositivos vinculados">
            <div className="space-y-0">
              {devices.length > 0 ? (
                devices.map((device: any) => (
                  <DeviceItem
                    key={device.id}
                    device={device.device}
                    ipAddress={device.ipAddress}
                    location={device.location}
                    lastAccess={device.lastAccess}
                    expirationDate={device.expirationDate}
                    status={device.status}
                    onUnlink={device.isCurrentSession ? undefined : () => handleOpenUnlinkDeviceModal(device.id, device.device)}
                  />
                ))
              ) : (
                <div className="py-8 text-muted-foreground text-center border dark:border-border rounded-lg bg-card">
                  No se han detectado dispositivos activos.
                </div>
              )}
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
          <ul className="space-y-2 text-sm text-muted-foreground mt-4 mb-2 pl-4 border-l-2 border-primary/20 dark:border-primary/25 dark:text-white">
            <li>• Perderás acceso directo a este portal desde tu cuenta.</li>
            <li>• Deberás autenticarte nuevamente para acceder al portal.</li>
            <li>• Podrás volver a vincular el portal cuando lo necesites.</li>
          </ul>
        </ConfirmationModal>
      </div>
    </DashboardLayout>
  )
}
