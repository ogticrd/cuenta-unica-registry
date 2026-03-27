"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/use-t";
import { ROUTES } from "@/lib/constants/routes";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: ErrorProps) {
  const t = useT("error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  const details = error?.message?.trim() || t("default_details");

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
            <p className="text-muted-foreground">{t("default_reason")}</p>
            <p className="text-sm text-accent p-3 rounded-md bg-accent/10 mt-2">
              {details}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={reset}>
              {t("try_again")}
            </Button>
            <Button asChild>
              <Link href={ROUTES.login}>{t("back_to_login")}</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
