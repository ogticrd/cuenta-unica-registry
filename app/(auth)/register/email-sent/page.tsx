import { AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { VerificationOTPForm } from "@/components/auth/verification/verification-otp-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants/routes";
import { getT } from "@/lib/i18n/server";

interface EmailSentPageProps {
  searchParams: Promise<{ flow?: string; return_url?: string }>;
}

export default async function EmailSentPage({
  searchParams,
}: EmailSentPageProps) {
  const params = await searchParams;
  const flowId = params.flow;
  const returnUrl = params.return_url;
  const t = await getT("email_sent");

  return (
    <main className="flex-1 flex items-center justify-center py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="w-full mx-auto ory-auth-scope">
          <Card className="w-full max-w-[420px] mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-border dark:border-slate-800 rounded bg-white dark:bg-card">
            <CardHeader className="space-y-4 pb-4 pt-8 flex flex-col items-center text-center border-b border-border dark:border-slate-800 mx-6">
              <Image
                src="/images/cuenta-unica-icon.svg"
                alt={t("logo_alt")}
                width={98}
                height={96}
                className="h-16 w-auto rounded-lg"
              />

              <CardTitle className="text-xl font-bold tracking-tight text-primary dark:text-blue-400">
                {t("title")}
              </CardTitle>

              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                {t("subtitle")}
              </p>
            </CardHeader>

            <CardContent className="pt-6 flex flex-col space-y-6 text-center">
              {/* OTP Form or error */}
              {flowId ? (
                <VerificationOTPForm flowId={flowId} returnUrl={returnUrl} />
              ) : (
                <div className="space-y-4">
                  <Alert
                    variant="destructive"
                    className="border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 w-full text-left"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{t("no_flow_error")}</AlertDescription>
                  </Alert>
                  <Button
                    asChild
                    className="w-full h-12 text-base font-semibold rounded-full bg-[#003B73] hover:bg-[#002f5c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                  >
                    <Link href={ROUTES.login}>{t("back_to_login")}</Link>
                  </Button>
                </div>
              )}

              {/* Help info */}
              <div className="w-full bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded px-4 py-3 text-left">
                <p className="text-xs font-semibold text-primary dark:text-blue-300 tracking-wide mb-1">
                  {t("help_title")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t("help_description", {
                    spam: t("help_spam"),
                    junk: t("help_junk"),
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
