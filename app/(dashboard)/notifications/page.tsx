"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { useT } from "@/hooks/use-t";

export default function NotificationsPage() {
  const t = useT("notifications_page");

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 border-b pb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            {t("title")}
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <NotificationCenter />
      </div>
    </DashboardLayout>
  );
}
