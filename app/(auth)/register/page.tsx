import { JourneyEvent } from "@/components/analytics/journey-event";
import { RegisterWizard } from "@/components/auth/register/register-wizard";

import { getAnalyticsContext } from "@/lib/analytics/context";
import { getRegistrationWizardState } from "@/lib/services/registration/registration-flow.service";

interface RegistrationPageProps {
  searchParams: Promise<{ return_url?: string }>;
}

export default async function RegistrationPage({
  searchParams,
}: RegistrationPageProps) {
  const [registrationWizardState, params, analyticsContext] = await Promise.all(
    [getRegistrationWizardState(), searchParams, getAnalyticsContext()],
  );
  const returnUrl = params.return_url ?? analyticsContext?.returnUrl;

  return (
    <>
      <JourneyEvent
        eventName="journey.registration.entered"
        step="register"
        clientId={analyticsContext?.clientId}
        clientName={analyticsContext?.clientName}
        institutionName={analyticsContext?.institutionName}
        linkageStatus={analyticsContext?.linkageStatus}
        returnUrl={returnUrl}
      />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <RegisterWizard
            initialStep={registrationWizardState.initialStep}
            initialCedula={registrationWizardState.initialCedula}
            initialName={registrationWizardState.initialName}
            initialSessionStatus={registrationWizardState.initialSessionStatus}
            hasAccountDraft={registrationWizardState.hasAccountDraft}
            returnUrl={returnUrl}
          />
        </div>
      </main>
    </>
  );
}
