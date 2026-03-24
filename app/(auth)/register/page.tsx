import { getRegistrationWizardState } from "@/lib/services/registration/registration-flow.service";
import { RegisterWizard } from "@/components/auth/register/register-wizard";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default async function RegistrationPage() {
  const registrationWizardState = await getRegistrationWizardState();

  return (
    <div className="min-h-screen flex flex-col bg-[#eff7ff] dark:bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <RegisterWizard
            initialStep={registrationWizardState.initialStep}
            initialName={registrationWizardState.initialName}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
