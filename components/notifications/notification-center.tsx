"use client";

import { Archive, Bell, CheckCircle, MailOpen, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/hooks/use-t";
import { useNotifications } from "@/lib/notifications/notification-context";
import type { CitizenNotification } from "@/lib/notifications/types";
import { notificationService } from "@/lib/services/notifications/notification.service";

type Filter = "all" | "unread" | "read" | "archived";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function NotificationCard({
  notification,
}: {
  notification: CitizenNotification;
}) {
  const t = useT("notifications_page");
  const { markRead, markUnread, archive } = useNotifications();
  const isUnread = notification.status === "unread";
  const isArchived = notification.status === "archived";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-lg">
              {notification.title}
            </CardTitle>
            <CardDescription>
              {formatDate(notification.createdAt)}
            </CardDescription>
          </div>
          <Badge variant={isUnread ? "default" : "outline"}>
            {isArchived ? t("archived") : isUnread ? t("unread") : t("read")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {notification.message}
          </p>
          <div className="flex flex-wrap gap-2">
            {notification.actionUrl ? (
              <Button asChild size="sm" variant="outline">
                <Link href={notification.actionUrl}>
                  {notification.actionLabel ?? t("open")}
                </Link>
              </Button>
            ) : null}
            {isArchived ? null : (
              <>
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
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationCenter() {
  const t = useT("notifications_page");
  const { notifications, unreadCount, unavailable, markAllRead } =
    useNotifications();
  const [filter, setFilter] = useState<Filter>("all");
  const [archivedNotifications, setArchivedNotifications] = useState<
    CitizenNotification[]
  >([]);
  const [archivedUnavailable, setArchivedUnavailable] = useState(false);

  const loadArchivedNotifications = useCallback(async () => {
    try {
      const result = await notificationService.getNotifications("archived");
      setArchivedNotifications(result.notifications);
      setArchivedUnavailable(result.unavailable === true);
    } catch {
      setArchivedNotifications([]);
      setArchivedUnavailable(true);
    }
  }, []);

  const handleFilterChange = useCallback(
    (value: string) => {
      const nextFilter = value as Filter;
      setFilter(nextFilter);

      if (nextFilter === "archived") {
        void loadArchivedNotifications();
      }
    },
    [loadArchivedNotifications],
  );

  const filteredNotifications = useMemo(() => {
    if (filter === "archived") {
      return archivedNotifications;
    }

    if (filter === "all") {
      return notifications;
    }

    return notifications.filter(
      (notification) => notification.status === filter,
    );
  }, [archivedNotifications, filter, notifications]);

  const isUnavailable =
    filter === "archived" ? archivedUnavailable : unavailable;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={handleFilterChange}>
          <TabsList>
            <TabsTrigger value="all">{t("filters.all")}</TabsTrigger>
            <TabsTrigger value="unread">{t("filters.unread")}</TabsTrigger>
            <TabsTrigger value="read">{t("filters.read")}</TabsTrigger>
            <TabsTrigger value="archived">{t("filters.archived")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="outline"
          disabled={filter === "archived" || unreadCount === 0}
          onClick={markAllRead}
        >
          <CheckCircle data-icon="inline-start" />
          {t("mark_all_read")}
        </Button>
      </div>

      {isUnavailable ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {t("unavailable")}
        </div>
      ) : null}

      {filteredNotifications.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bell />
            </EmptyMedia>
            <EmptyTitle>{t("empty.title")}</EmptyTitle>
            <EmptyDescription>{t("empty.desc")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>
      )}
    </div>
  );
}
