"use client";

import {
  Archive,
  Bell,
  CheckCircle,
  Info,
  MailOpen,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useT } from "@/hooks/use-t";
import { ROUTES } from "@/lib/constants/routes";
import { useNotifications } from "@/lib/notifications/notification-context";
import type { CitizenNotification } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function getNotificationIcon(notification: CitizenNotification) {
  if (
    notification.priority === "critical" ||
    notification.topic === "security"
  ) {
    return <ShieldAlert className="text-destructive" />;
  }

  if (notification.status === "read") {
    return <CheckCircle className="text-muted-foreground" />;
  }

  return <Info className="text-secondary" />;
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function NotificationRow({
  notification,
}: {
  notification: CitizenNotification;
}) {
  const t = useT("notification_drawer");
  const { markRead, markUnread, archive } = useNotifications();
  const isUnread = notification.status === "unread";

  return (
    <article
      className={cn(
        "rounded-lg border p-4 transition-colors",
        isUnread ? "bg-secondary/5" : "bg-card",
      )}
    >
      <div className="flex gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-background">
          {getNotificationIcon(notification)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "truncate text-sm font-semibold",
                !isUnread && "text-muted-foreground",
              )}
            >
              {notification.title}
            </h3>
            {isUnread ? <Badge>{t("new_badge")}</Badge> : null}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {notification.message}
          </p>
          <p className="mt-3 text-xs font-medium uppercase text-muted-foreground">
            {formatNotificationDate(notification.createdAt)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {notification.actionUrl ? (
              <Button asChild size="sm" variant="outline">
                <Link href={notification.actionUrl}>
                  {notification.actionLabel ?? t("open")}
                </Link>
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                isUnread
                  ? markRead(notification.id)
                  : markUnread(notification.id)
              }
            >
              {isUnread ? (
                <MailOpen data-icon="inline-start" />
              ) : (
                <RotateCcw data-icon="inline-start" />
              )}
              {isUnread ? t("mark_read") : t("mark_unread")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => archive(notification.id)}
            >
              <Archive data-icon="inline-start" />
              {t("archive")}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function NotificationDrawer({
  isOpen,
  onClose,
}: NotificationDrawerProps) {
  const t = useT("notification_drawer");
  const { notifications, unreadCount, isLoading, unavailable, markAllRead } =
    useNotifications();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-secondary/10">
              <Bell className="text-secondary" />
            </div>
            <div>
              <SheetTitle>{t("title")}</SheetTitle>
              <SheetDescription>
                {unreadCount > 0
                  ? t("unread", { count: unreadCount })
                  : t("up_to_date")}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex items-center justify-between gap-3 border-b px-6 py-3">
          {unavailable ? (
            <p className="text-xs text-muted-foreground">{t("unavailable")}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {isLoading ? t("loading") : t("canonical")}
            </p>
          )}
          <Button
            size="sm"
            variant="ghost"
            disabled={unreadCount === 0}
            onClick={markAllRead}
          >
            {t("mark_all_read")}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-3 p-4">
            {notifications.length === 0 ? (
              <Empty className="border-0 py-14">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Bell />
                  </EmptyMedia>
                  <EmptyTitle>{t("all_caught_up")}</EmptyTitle>
                  <EmptyDescription>{t("no_pending")}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              notifications
                .slice(0, 8)
                .map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                  />
                ))
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <Button asChild className="w-full" variant="outline">
            <Link href={ROUTES.notifications} onClick={onClose}>
              {t("view_all")}
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
