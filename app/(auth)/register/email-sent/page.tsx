import Image from "next/image";
import Link from "next/link";

import { JourneyEvent } from "@/components/analytics/journey-event";
import { VerificationOTPForm } from "@/components/auth/verification/verification-otp-form";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
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
    <div className="min-h-screen flex flex-col bg-[#eff7ff] dark:bg-background">
      <JourneyEvent
        eventName="journey.registration.email_verification.entered"
        step="email_verification"
        flowId={flowId}
        oryFlowType="verification"
        returnUrl={returnUrl}
      />
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="w-full max-w-sm mx-auto ory-auth-scope">
            <div className="bg-white dark:bg-card rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 p-8 sm:p-10 flex flex-col text-center space-y-6 relative overflow-hidden">
              {/* Header — CUC logo + title */}
              <div>
                <div className="flex justify-center mb-5">
                  <Image
                    src="/images/cuenta-unica-icon.png"
                    alt={t("logo_alt")}
                    width={98}
                    height={96}
                    className="h-16 w-auto rounded-lg shadow-sm"
                  />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-primary dark:text-blue-400">
                  {t("title")}
                </h1>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  {t("subtitle")}
                </p>
              </div>

              {/* OTP Form or error */}
              {flowId ? (
                <VerificationOTPForm flowId={flowId} returnUrl={returnUrl} />
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-red-500 dark:text-red-400">
                    {t("no_flow_error")}
                  </p>
                  <Link
                    href={ROUTES.login}
                    className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                  >
                    {t("back_to_login")}
                  </Link>
                </div>
              )}

              {/* Help info */}
              <div className="w-full bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-xl px-4 py-3 text-left">
                <p className="text-xs font-semibold text-primary dark:text-blue-300 uppercase tracking-wide mb-1">
                  {t("help_title")}
                </p>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t("help_description", {
                    spam: t("help_spam"),
                    junk: t("help_junk"),
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
