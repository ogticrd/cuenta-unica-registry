import type { OryPageParams } from "@ory/nextjs/app";
import { headers } from "next/headers";
import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { NotificationPreferences } from "@/components/notifications/notification-preferences";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingFallback } from "@/components/ui/loading-fallback";
import { getT } from "@/lib/i18n/server";
import { getSettingsFlow } from "@/lib/ory/flow";
import { getServerOryConfig } from "@/lib/ory/server-config";
import OrySettings from "./ory-settings";

async function isLocalRequest() {
  const h = await headers();
  const host = h.get("host") ?? "";
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

function hasFlowParam(params: Record<string, string | string[] | undefined>) {
  return typeof params.flow === "string" || Array.isArray(params.flow);
}

async function SettingsFlowComponent({ searchParams }: OryPageParams) {
  const resolvedSearchParams = await searchParams;
  const t = await getT("settings");

  if (!hasFlowParam(resolvedSearchParams) && (await isLocalRequest())) {
    return (
      <Alert>
        <AlertTitle>{t("flow_unavailable_title")}</AlertTitle>
        <AlertDescription>{t("flow_unavailable_desc")}</AlertDescription>
      </Alert>
    );
  }

  const dynamicConfig = await getServerOryConfig();
  const flow = await getSettingsFlow(
    dynamicConfig,
    Promise.resolve(resolvedSearchParams),
  );

  if (!flow) {
    return <LoadingFallback message={t("loading")} />;
  }

  return <OrySettings flow={flow} dynamicConfig={dynamicConfig} />;
}

export default async function SettingsPage(props: OryPageParams) {
  const t = await getT("settings");
  return (
    <div className="space-y-8">
      <div className="space-y-4 pb-8 border-b dark:border-border">
        <h1 className="text-3xl font-bold text-primary dark:text-blue-400 tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          {t("subtitle")}
        </p>
      </div>
      <Suspense fallback={<LoadingFallback />}>
        <SettingsFlowComponent searchParams={props.searchParams} />
      </Suspense>
      <NotificationPreferences />
    </div>
  );
}
