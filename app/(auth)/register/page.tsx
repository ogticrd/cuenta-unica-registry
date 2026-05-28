import { JourneyEvent } from "@/components/analytics/journey-event";
import { RegisterWizard } from "@/components/auth/register/register-wizard";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getRegistrationWizardState } from "@/lib/services/registration/registration-flow.service";

interface RegistrationPageProps {
  searchParams: Promise<{ return_url?: string }>;
}

export default async function RegistrationPage({
  searchParams,
}: RegistrationPageProps) {
  const [registrationWizardState, params] = await Promise.all([
    getRegistrationWizardState(),
    searchParams,
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#eff7ff] dark:bg-background">
      <JourneyEvent
        eventName="journey.registration.entered"
        step="register"
        returnUrl={params.return_url}
      />
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
