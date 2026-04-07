"use client";

import {
  Activity,
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Globe,
  Info,
  Lock,
  Shield,
  Smartphone,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ActionButton } from "@/components/dashboard/action-button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { QuickActionCard } from "@/components/dashboard/quick-action-card";
import { RecentActivityItem } from "@/components/dashboard/recent-activity-item";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useT } from "@/hooks/use-t";
import { useAuth } from "@/lib/auth-context";
import { ROUTES } from "@/lib/constants/routes";

export default function DashboardPage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const t = useT("dashboard");
  // -- Dynamic Session Data --
  let lastAccessStr = t("loading");
  if (session?.authenticated_at) {
    const authDate = new Date(session.authenticated_at);
    lastAccessStr = authDate.toLocaleString("es-DO", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  const isVerified =
    session?.identity?.verifiable_addresses?.some(
      (addr) => addr.verified === true,
    ) || false;
  const devicesCount = session ? 1 + (session.other_sessions?.length || 0) : 1;
  const isAal2 = session?.authenticator_assurance_level === "aal2";
  const securityLevel = isAal2
    ? t("stats_cards.security.level_high")
    : t("stats_cards.security.level_standard");
  const securityDesc = isAal2
    ? t("stats_cards.security.desc_2fa")
    : t("stats_cards.security.desc_password");

  type QuickAction = {
    id: string;
    title: string;
    description: string;
    icon: ReactNode;
    href: string;
    badge?: {
      text: string;
      variant: "info" | "warning" | "success";
    };
  };

  const quickActions: QuickAction[] = [
    {
      id: "personal_data",
      title: t("quick_actions_list.personal_data.title"),
      description: t("quick_actions_list.personal_data.desc"),
      icon: <User size={24} />,
      href: ROUTES.settings,
    },
    {
      id: "privacy",
      title: t("quick_actions_list.privacy.title"),
      description: t("quick_actions_list.privacy.desc"),
      icon: <Shield size={24} />,
      href: ROUTES.settings,
    },
    {
      id: "history_clock",
      title: t("quick_actions_list.history.title"),
      description: t("quick_actions_list.history.desc"),
      icon: <Clock size={24} />,
      href: ROUTES.history,
    },
    {
      id: "history_bell",
      title: t("quick_actions_list.history.title"),
      description: t("quick_actions_list.history.desc"),
      icon: <Bell size={24} />,
      href: ROUTES.history,
    },
  ];

  const recentActivities = [
    {
      icon: <CheckCircle size={16} />,
      title: t("recent_activities_list.login_success.title"),
      description: t("recent_activities_list.login_success.desc"),
      time: t("recent_activities_list.login_success.time"),
      type: "success" as const,
    },
    {
      icon: <Shield size={16} />,
      title: t("recent_activities_list.security_updated.title"),
      description: t("recent_activities_list.security_updated.desc"),
      time: t("recent_activities_list.security_updated.time"),
      type: "info" as const,
    },
    {
      icon: <AlertTriangle size={16} />,
      title: t("recent_activities_list.new_device.title"),
      description: t("recent_activities_list.new_device.desc"),
      time: t("recent_activities_list.new_device.time"),
      type: "warning" as const,
    },
    {
      icon: <Info size={16} />,
      title: t("recent_activities_list.password_updated.title"),
      description: t("recent_activities_list.password_updated.desc"),
      time: t("recent_activities_list.password_updated.time"),
      type: "info" as const,
    },
  ];

  const governmentServices = [
    {
      title: t("gov_services_list.insurance.title"),
      description: t("gov_services_list.insurance.desc"),
      icon: <Shield size={20} />,
      href: "#",
    },
    {
      title: t("gov_services_list.portal.title"),
      description: t("gov_services_list.portal.desc"),
      icon: <Globe size={20} />,
      href: "#",
    },
    {
      title: t("gov_services_list.history.title"),
      description: t("gov_services_list.history.desc"),
      icon: <Activity size={20} />,
      href: ROUTES.history,
    },
    {
      title: t("gov_services_list.settings.title"),
      description: t("gov_services_list.settings.desc"),
      icon: <Lock size={20} />,
      href: ROUTES.settings,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 pb-6 border-b dark:border-border">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
            {t.rich("welcome", {
              name: user?.name || "",
              highlight: (chunks) => (
                <span className="text-secondary dark:text-blue-400">
                  {chunks}
                </span>
              ),
            })}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed mb-6">
            {t("subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 bg-secondary/10 px-3 py-1.5 rounded-full dark:bg-secondary/20">
              <Calendar size={16} className="text-secondary" />
              <span className="font-medium text-secondary">
                {t("last_access", { date: lastAccessStr })}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full dark:bg-green-50/20">
              {isVerified ? (
                <>
                  <CheckCircle
                    size={16}
                    className="text-green-600 dark:text-green-400"
                  />
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {t("account_verified")}
                  </span>
                </>
              ) : (
                <>
                  <Lock
                    size={16}
                    className="text-orange-600 dark:text-orange-400"
                  />
                  <span className="font-medium text-orange-700 dark:text-orange-400">
                    {t("account_unverified")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title={t("stats_cards.devices.title")}
          value={devicesCount.toString()}
          icon={<Smartphone size={24} />}
          description={
            devicesCount === 1
              ? t("stats_cards.devices.desc_singular")
              : t("stats_cards.devices.desc_plural")
          }
        />
        <StatsCard
          title={t("stats_cards.services.title")}
          value="12"
          icon={<Globe size={24} />}
          description={t("stats_cards.services.desc")}
        />
        <StatsCard
          title={t("stats_cards.actions.title")}
          value="8"
          icon={<Activity size={24} />}
          description={t("stats_cards.actions.desc")}
        />
        <StatsCard
          title={t("stats_cards.security.title")}
          value={securityLevel}
          icon={<Shield size={24} />}
          description={securityDesc}
        />
      </div>

      {/* Quick Actions */}
      <DashboardCard title={t("quick_actions")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.id}
              title={action.title}
              description={action.description}
              icon={action.icon}
              href={action.href}
              badge={action.badge}
            />
          ))}
        </div>
      </DashboardCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <DashboardCard
          title={t("recent_activity")}
          action={
            <ActionButton
              variant="secondary"
              onClick={() => router.push(ROUTES.history)}
            >
              {t("view_all")}
            </ActionButton>
          }
        >
          <div className="space-y-1">
            {recentActivities.map((activity) => (
              <RecentActivityItem
                key={activity.title}
                icon={activity.icon}
                title={activity.title}
                description={activity.description}
                time={activity.time}
                type={activity.type}
              />
            ))}
          </div>
        </DashboardCard>

        {/* Security Status */}
        <DashboardCard
          title={t("security_status")}
          action={
            <ActionButton
              variant="secondary"
              onClick={() => router.push(ROUTES.settings)}
            >
              {t("configure")}
            </ActionButton>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-xl border border-transparent dark:border-border/50 hover:bg-secondary/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 p-2 rounded-full">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {t("security_status_items.2fa.title")}
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
                    {t("security_status_items.2fa.desc")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-xl border border-transparent dark:border-border/50 hover:bg-secondary/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 p-2 rounded-full">
                  <Info size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {t("security_status_items.password.title")}
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
                    {t("security_status_items.password.desc")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-xl border border-transparent dark:border-border/50 hover:bg-secondary/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 p-2 rounded-full">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {t("security_status_items.passkeys.title")}
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
                    {t("security_status_items.passkeys.desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Government Services */}
      <DashboardCard title={t("gov_services")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {governmentServices.map((service) => (
            <QuickActionCard
              key={service.title}
              title={service.title}
              description={service.description}
              icon={service.icon}
              href={service.href}
            />
          ))}
        </div>
      </DashboardCard>

      {/* Important Notifications */}
      <DashboardCard title={t("notifications")}>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-5 bg-secondary/5 rounded-2xl border border-transparent dark:border-border/50 transition-colors hover:bg-secondary/10">
            <div className="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 p-2.5 rounded-full flex-shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-foreground mb-1">
                {t("notifications_list.security.title")}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {t("notifications_list.security.desc")}
              </p>
              <ActionButton
                variant="primary"
                onClick={() => router.push(ROUTES.settings)}
              >
                {t("notifications_list.security.action")}
              </ActionButton>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-secondary/5 rounded-2xl border border-transparent dark:border-border/50 transition-colors hover:bg-secondary/10">
            <div className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 p-2.5 rounded-full flex-shrink-0">
              <Info size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-foreground mb-1">
                {t("notifications_list.new_feature.title")}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {t("notifications_list.new_feature.desc")}
              </p>
              <ActionButton
                variant="secondary"
                onClick={() => router.push(ROUTES.settings)}
                className="hover:bg-secondary/10"
              >
                {t("notifications_list.new_feature.action")}
              </ActionButton>
            </div>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
