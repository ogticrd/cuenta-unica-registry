"use client"

import { X, Bell, CheckCircle, AlertTriangle, Info, Calendar } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useT } from "@/hooks/use-t"

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
  const t = useT("notification_drawer")

  const notifications: Notification[] = [
    {
      id: "1",
      type: "info",
      title: t("items.n1.title"),
      message: t("items.n1.message"),
      time: t("items.n1.time"),
      isRead: false,
    },
    {
      id: "2",
      type: "success",
      title: t("items.n2.title"),
      message: t("items.n2.message"),
      time: t("items.n2.time"),
      isRead: false,
    },
    {
      id: "3",
      type: "reminder",
      title: t("items.n3.title"),
      message: t("items.n3.message"),
      time: t("items.n3.time"),
      isRead: true,
    },
    {
      id: "4",
      type: "warning",
      title: t("items.n4.title"),
      message: t("items.n4.message"),
      time: t("items.n4.time"),
      isRead: true,
    },
    {
      id: "5",
      type: "info",
      title: t("items.n5.title"),
      message: t("items.n5.message"),
      time: t("items.n5.time"),
      isRead: true,
    },
  ]

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
      case "warning":
        return <AlertTriangle size={18} className="text-orange-600 dark:text-orange-400" />
      case "reminder":
        return <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
      default:
        return <Info size={18} className="text-secondary" />
    }
  }

  const getNotificationBgColor = (type: Notification["type"], isRead: boolean) => {
    if (isRead) return "bg-gray-50/50 dark:bg-card/30"

    switch (type) {
      case "success":
        return "bg-green-50/80 dark:bg-green-900/10"
      case "warning":
        return "bg-orange-50/80 dark:bg-orange-900/10"
      case "reminder":
        return "bg-blue-50/80 dark:bg-blue-900/10"
      default:
        return "bg-secondary/5"
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (!isOpen) return null

  return (
    <>
      {/* Overlay with fade animation */}
      <div
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in duration-300`}
        onClick={onClose}
      />

      {/* Drawer with slide animation */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-background shadow-2xl z-50 animate-in slide-in-from-right duration-300 ease-out border-l border-border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="bg-secondary/10 p-2 rounded-full">
              <Bell size={20} className="text-secondary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t("title")}</h2>
              {unreadCount > 0 ? (
                <p className="text-xs font-medium text-secondary mt-0.5">{t("unread", { count: unreadCount })}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">{t("up_to_date")}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-muted-foreground hover:text-white">
            <X size={20} />
          </Button>
        </div>

        {/* Actions */}
        <div className="px-6 py-3 border-b border-border flex justify-end">
          <button className="text-xs font-medium text-muted-foreground hover:text-secondary transition-colors">
            {t("mark_all_read")}
          </button>
        </div>

        {/* Notifications List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-secondary/5 p-4 rounded-full mb-4">
                  <Bell size={32} className="text-muted-foreground/50" />
                </div>
                <p className="text-foreground font-medium mb-1">{t("all_caught_up")}</p>
                <p className="text-sm text-muted-foreground">{t("no_pending")}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-border/50 ${getNotificationBgColor(notification.type, notification.isRead)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5 bg-background p-1.5 rounded-full shadow-sm">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3
                          className={`text-sm font-bold truncate ${notification.isRead ? "text-muted-foreground" : "text-foreground"}`}
                        >
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-secondary rounded-full flex-shrink-0 mt-1.5"></div>
                        )}
                      </div>
                      <p
                        className={`text-sm leading-relaxed mb-2 ${notification.isRead ? "text-muted-foreground/80" : "text-muted-foreground"}`}
                      >
                        {notification.message}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full rounded-xl bg-transparent border-border hover:bg-secondary/5 hover:text-secondary">
            {t("view_all")}
          </Button>
        </div>
      </div>
    </>
  )
}
