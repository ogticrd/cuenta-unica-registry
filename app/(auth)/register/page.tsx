import { RegisterWizard } from "@/components/auth/register/register-wizard";
import { FeatureFlagDisabledFallback } from "@/components/feature-flags/feature-flag-disabled-fallback";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getAccountRegistrationFeatureFlag } from "@/lib/services/feature-flags/feature-flags.service";
import { getRegistrationWizardState } from "@/lib/services/registration/registration-flow.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RegistrationPageProps {
  searchParams: Promise<{ return_url?: string }>;
}

export default async function RegistrationPage({
  searchParams,
}: RegistrationPageProps) {
  const registrationFlag = await getAccountRegistrationFeatureFlag();

  if (!registrationFlag.enabled) {
    return (
      <FeatureFlagDisabledFallback
        advancedSettings={registrationFlag.advancedSettings}
      />
    );
  }

  const [registrationWizardState, params] = await Promise.all([
    getRegistrationWizardState(),
    searchParams,
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#eff7ff] dark:bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <RegisterWizard
            initialStep={registrationWizardState.initialStep}
            initialName={registrationWizardState.initialName}
            returnUrl={params.return_url}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
