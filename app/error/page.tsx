import { AlertTriangle } from "lucide-react";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { getOryClient } from "@/lib/ory/client";
import { getT } from "@/lib/i18n/server";

interface ErrorPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface OryFlowErrorDetails {
  reason?: string;
  message?: string;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const params = await searchParams;
  const flowId = firstParam(params.id);
  const t = await getT("error");

  let reason = t("default_reason");
  let details = t("default_details");

  if (flowId) {
    try {
      const { data } = await getOryClient().getFlowError({ id: flowId });
      const flowError = data.error as OryFlowErrorDetails | undefined;

      if (flowError) {
        reason = flowError.reason || flowError.message || reason;
        details = flowError.message || details;
      }
    } catch {
      // Keep generic copy if Ory error details are unavailable.
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center dark:bg-destructive/25">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-destructive/70 dark:text-destructive">
              Error
            </p>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{reason}</p>
            <p className="text-sm text-muted-foreground">{details}</p>
          </div>

          <Button asChild>
            <Link href={ROUTES.login}>{t("back_to_login")}</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
