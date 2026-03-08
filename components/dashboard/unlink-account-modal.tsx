"use client"

import { ConfirmationModal } from "@/components/ui/confirmation-modal"

interface UnlinkAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  accountType: "Google" | "Facebook" | string
  isLoading?: boolean
}

export function UnlinkAccountModal({
  isOpen,
  onClose,
  onConfirm,
  accountType,
  isLoading = false,
}: UnlinkAccountModalProps) {
  const getAccountSpecificContent = () => {
    switch (accountType) {
      case "Google":
        return {
          title: "¿Deseas desvincular tu cuenta de Google?",
          description: "Si desvinculas esta cuenta",
          consequences: [
            "Ya no podrás iniciar sesión con Google.",
            "Esta sesión permanecerá activa hasta que cierres sesión.",
            "Podrás volver a vincular una cuenta desde la configuración de seguridad.",
          ],
        }
      case "Facebook":
        return {
          title: "¿Deseas desvincular tu cuenta de Facebook?",
          description: "Si desvinculas esta cuenta",
          consequences: [
            "Ya no podrás iniciar sesión con Facebook.",
            "Esta sesión permanecerá activa hasta que cierres sesión.",
            "Podrás volver a vincular una cuenta desde la configuración de seguridad.",
          ],
        }
      default:
        return {
          title: `¿Deseas desvincular tu cuenta de ${accountType}?`,
          description: "Si desvinculas esta cuenta",
          consequences: [
            `Ya no podrás iniciar sesión con ${accountType}.`,
            "Esta sesión permanecerá activa hasta que cierres sesión.",
            "Podrás volver a vincular una cuenta desde la configuración de seguridad.",
          ],
        }
    }
  }

  const content = getAccountSpecificContent()

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={content.title}
      description={content.description}
      confirmText="DESVINCULAR"
      cancelText="CANCELAR"
      confirmVariant="destructive"
      isLoading={isLoading}
    >
      <ul className="space-y-2 text-sm text-gray-600">
        {content.consequences.map((consequence, index) => (
          <li key={index} className="flex items-start">
            <span className="text-gray-400 mr-2">•</span>
            <span>{consequence}</span>
          </li>
        ))}
      </ul>
    </ConfirmationModal>
  )
}
