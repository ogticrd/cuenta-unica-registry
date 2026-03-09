"use client"

import { X, Bell, CheckCircle, AlertCircle, Info, Calendar } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Notification {
  id: string
  type: "info" | "success" | "warning" | "reminder"
  title: string
  message: string
  time: string
  isRead: boolean
}

interface NotificationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const notifications: Notification[] = [
    {
      id: "1",
      type: "info",
      title: "Actualización de seguridad",
      message:
        "Se ha actualizado la política de seguridad de tu cuenta. Revisa los cambios en la sección de privacidad.",
      time: "Hace 2 horas",
      isRead: false,
    },
    {
      id: "2",
      type: "success",
      title: "Verificacion completada",
      message: "Tu autenticacion de dos factores ha sido configurada exitosamente.",
      time: "Hace 1 dia",
      isRead: false,
    },
    {
      id: "3",
      type: "reminder",
      title: "Revision de seguridad",
      message: "Te recomendamos revisar los dispositivos conectados a tu cuenta periodicamente.",
      time: "Hace 2 dias",
      isRead: true,
    },
    {
      id: "4",
      type: "warning",
      title: "Intento de acceso sospechoso",
      message:
        "Se detectó un intento de acceso desde una ubicación no reconocida. Si no fuiste tú, cambia tu contraseña.",
      time: "Hace 3 días",
      isRead: true,
    },
    {
      id: "5",
      type: "info",
      title: "Nueva funcionalidad disponible",
      message: "Ya puedes usar passkeys para acceder a tu cuenta sin contraseña. Configúralo en ajustes de seguridad.",
      time: "Hace 1 semana",
      isRead: true,
    },
  ]

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} className="text-green-600" />
      case "warning":
        return <AlertCircle size={20} className="text-orange-600" />
      case "reminder":
        return <Calendar size={20} className="text-blue-600" />
      default:
        return <Info size={20} className="text-primary" />
    }
  }

  const getNotificationBgColor = (type: Notification["type"], isRead: boolean) => {
    if (isRead) return "bg-gray-50 dark:bg-gray-800/50"

    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500"
      case "warning":
        return "bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500"
      case "reminder":
        return "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-primary dark:border-blue-400"
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (!isOpen) return null

  return (
    <>
      {/* Overlay with fade animation */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 animate-in fade-in duration-300`}
        onClick={onClose}
      />

      {/* Drawer with slide animation */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-background shadow-xl z-50 animate-in slide-in-from-right duration-300 ease-out border-l border-transparent dark:border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-border animate-in fade-in slide-in-from-top duration-500 delay-150">
          <div className="flex items-center space-x-3">
            <Bell size={24} className="text-primary dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-primary dark:text-white">Notificaciones</h2>
              {unreadCount > 0 && <p className="text-sm text-gray-600 dark:text-gray-400">{unreadCount} sin leer</p>}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2 hover:bg-accent-100 hover:scale-110 transition-all duration-200">
            <X size={20} className="text-accent hover:rotate-90 transition-transform duration-200" />
          </Button>
        </div>

        {/* Actions */}
        <div className="p-4 border-b border-gray-200 dark:border-border animate-in fade-in slide-in-from-top duration-500 delay-300">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm"
              className="border-secondary text-secondary dark:border-blue-400 dark:text-blue-400 hover:bg-secondary dark:hover:bg-blue-400 hover:text-white dark:hover:text-blue-900 bg-transparent hover:scale-105 transition-all duration-200">
              Marcar todas como leídas
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
          <div className="p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 animate-in fade-in duration-500 delay-500">
                <Bell size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-300 animate-in slide-in-from-right fade-in ${getNotificationBgColor(notification.type, notification.isRead)
                    }`}
                  style={{
                    animationDelay: `${400 + index * 100}ms`,
                    animationDuration: '400ms'
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1 hover:scale-110 transition-transform duration-200">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`text-sm font-semibold ${notification.isRead ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white"}`}
                        >
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 animate-pulse"></div>
                        )}
                      </div>
                      <p
                        className={`text-sm leading-relaxed ${notification.isRead ? "text-gray-600 dark:text-gray-400" : "text-gray-800 dark:text-gray-300"}`}
                      >
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-border animate-in fade-in slide-in-from-bottom duration-500 delay-700">
          <Button variant="outline" className="w-full text-sm bg-transparent hover:scale-105 transition-transform duration-200">
            Ver todas las notificaciones
          </Button>
        </div>
      </div>
    </>
  )
}
