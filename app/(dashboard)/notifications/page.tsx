"use client";
import { Inbox, Settings } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { NotificationPreferences } from "@/components/notifications/notification-preferences";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/hooks/use-t";

export default function NotificationsPage() {
  const t = useT("notifications_page");

  return (
    <div className="space-y-8">
      <div className="space-y-4 pb-8 border-b dark:border-border">
        <h1 className="text-3xl font-bold text-primary dark:text-blue-400 tracking-tight">
          {t("title")}
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>
      <Tabs defaultValue="inbox" className="space-y-8">
        <TabsList className="bg-blue-50/50 dark:bg-slate-800/50 p-1 border border-blue-100 dark:border-slate-700/50">
          <TabsTrigger
            value="inbox"
            className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all"
          >
            <Inbox className="w-4 h-4" />
            {t("tabs.inbox")}
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all"
          >
            <Settings className="w-4 h-4" />
            {t("tabs.preferences")}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="inbox"
          className="m-0 focus-visible:outline-none focus-visible:ring-0"
        >
          <NotificationCenter />
        </TabsContent>

        <TabsContent
          value="preferences"
          className="m-0 focus-visible:outline-none focus-visible:ring-0"
        >
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}
