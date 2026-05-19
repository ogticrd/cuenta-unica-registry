"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { notificationService } from "@/lib/services/notifications/notification.service";
import type {
  CitizenNotification,
  NotificationPreference,
  NotificationStatus,
  NotificationsResponse,
} from "./types";

interface NotificationContextType extends NotificationsResponse {
  isLoading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markUnread: (id: string) => Promise<void>;
  archive: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

function getNextNotifications(
  notifications: CitizenNotification[],
  id: string,
  status: NotificationStatus,
) {
  if (status === "archived") {
    return notifications.filter((notification) => notification.id !== id);
  }

  return notifications.map((notification) =>
    notification.id === id ? { ...notification, status } : notification,
  );
}

function getUnreadCount(notifications: CitizenNotification[]) {
  return notifications.filter(
    (notification) => notification.status === "unread",
  ).length;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [notifications, setNotifications] = useState<CitizenNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (isAuthLoading || !isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const result = await notificationService.getNotifications();
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setUnavailable(result.unavailable === true);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
      setUnavailable(true);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const onFocus = () => {
      void refresh();
    };
    const interval = window.setInterval(() => {
      void refresh();
    }, 60_000);

    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, refresh]);

  const updateStatus = useCallback(
    async (id: string, status: NotificationStatus) => {
      const previousNotifications = notifications;
      const nextNotifications = getNextNotifications(notifications, id, status);
      setNotifications(nextNotifications);
      setUnreadCount(getUnreadCount(nextNotifications));

      try {
        const result = await notificationService.updateNotification(id, status);
        if (!result.success) {
          throw new Error(result.error ?? "notification_update_failed");
        }
      } catch {
        setNotifications(previousNotifications);
        setUnreadCount(getUnreadCount(previousNotifications));
        toast.error("No se pudo actualizar la notificacion.");
      }
    },
    [notifications],
  );

  const markAllRead = useCallback(async () => {
    const previousNotifications = notifications;
    const nextNotifications = notifications.map((notification) => ({
      ...notification,
      status: "read" as const,
    }));
    setNotifications(nextNotifications);
    setUnreadCount(0);

    try {
      const result = await notificationService.markAllRead();
      if (!result.success && result.unavailable) {
        throw new Error("notifications_unavailable");
      }
    } catch {
      setNotifications(previousNotifications);
      setUnreadCount(getUnreadCount(previousNotifications));
      toast.error("No se pudieron marcar las notificaciones como leidas.");
    }
  }, [notifications]);

  const value = useMemo<NotificationContextType>(
    () => ({
      notifications,
      unreadCount,
      unavailable,
      isLoading,
      refresh,
      markRead: (id: string) => updateStatus(id, "read"),
      markUnread: (id: string) => updateStatus(id, "unread"),
      archive: (id: string) => updateStatus(id, "archived"),
      markAllRead,
    }),
    [
      notifications,
      unreadCount,
      unavailable,
      isLoading,
      refresh,
      updateStatus,
      markAllRead,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }

  return context;
}

export type { NotificationPreference };
