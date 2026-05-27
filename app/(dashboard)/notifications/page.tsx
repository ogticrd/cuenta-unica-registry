"use client";

import { NotificationCenter } from "@/components/notifications/notification-center";
import { useT } from "@/hooks/use-t";

export default function NotificationsPage() {
  const t = useT("notifications_page");

  return (
    <div className="space-y-8">
      <div className="space-y-4 pb-8 border-b dark:border-border">
        <h1 className="text-3xl font-bold text-primary dark:text-blue-400 tracking-tight">
          {t("title")}
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>
      <NotificationCenter />
    </div>
  );
}
