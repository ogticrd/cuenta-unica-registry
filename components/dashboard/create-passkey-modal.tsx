"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface CreatePasskeyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreatePasskeyModal({ isOpen, onClose }: CreatePasskeyModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCreatePasskey = async () => {
    setIsLoading(true)

    try {
      // Simulate passkey creation process
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Navigate to two-factor authentication setup
      router.push("/settings/two-factor-auth")
      onClose()
    } catch (error) {
      console.error("Error creating passkey:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0">
        <div className="relative p-8">
          {/* Header */}
          <div className="mb-8">
            <DialogTitle className="text-lg font-semibold text-primary pr-8">
              Passkeys (Acceso sin contraseña)
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-900 mt-2">
              Accede a tu cuenta sin necesidad de contraseña utilizando la verificación biométrica o PIN de tu
              dispositivo. Requiere un navegador y dispositivo compatible.
            </DialogDescription>
            <div className="space-y-6 text-gray-700">
              <p className="text-sm leading-relaxed text-secondary font-medium mt-4">
                Vas a crear una passkey vinculada a este dispositivo. Asegúrate de que tengas acceso biométrico o PIN
                habilitado.
              </p>
            </div>
          </div>

          {/* Separator Line */}
          <div className="border-t border-gray-200 mb-8"></div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-secondary text-secondary hover:bg-secondary hover:text-white font-medium px-8 py-3 bg-transparent"
            >
              CANCELAR
            </Button>
            <Button
              onClick={handleCreatePasskey}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3"
            >
              {isLoading ? "Creando..." : "CREAR PASSKEY"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
