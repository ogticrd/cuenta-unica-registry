import { JourneyEvent } from "@/components/analytics/journey-event";
import { RegisterWizard } from "@/components/auth/register/register-wizard";

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
    <>
      <JourneyEvent
        eventName="journey.registration.entered"
        step="register"
        returnUrl={params.return_url}
      />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <RegisterWizard
            initialStep={registrationWizardState.initialStep}
            initialCedula={registrationWizardState.initialCedula}
            initialName={registrationWizardState.initialName}
            initialSessionStatus={registrationWizardState.initialSessionStatus}
            hasAccountDraft={registrationWizardState.hasAccountDraft}
            returnUrl={params.return_url}
          />
        </div>
      </main>
    </>
  );
}
