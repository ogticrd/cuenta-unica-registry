"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

import type {
  RegisterAccountDraft,
  RegisterAccountStepErrors,
} from "@/lib/types/registration/account";
import { useT } from "@/hooks/use-t";
import { registrationSessionApiService } from "@/lib/services/registration/registration-session-api.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepIdentification } from "./steps/step-identification";
import { StepVerification } from "./steps/step-verification";
import { StepAccount } from "./steps/step-account";
import { Stepper } from "@/components/ui/stepper";

interface RegisterWizardProps {
  initialStep: 0 | 1 | 2;
  initialName: string;
  returnUrl?: string;
}

export function RegisterWizard({
  initialStep,
  initialName,
  returnUrl,
}: RegisterWizardProps) {
  const t = useT("register");
  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(initialStep);
  const steps = [
    {
      title: t("steps.identification.title"),
      description: t("steps.identification.description"),
    },
    {
      title: t("steps.account.title"),
      description: t("steps.account.description"),
    },
    {
      title: t("steps.verification.title"),
      description: t("steps.verification.description"),
    },
  ];

  const [wizardData, setWizardData] = useState({
    cedula: "",
    name: initialName,
    accountDraft: {
      email: "",
      confirmEmail: "",
      password: "",
      confirmPassword: "",
    } satisfies RegisterAccountDraft,
    accountErrors: undefined as RegisterAccountStepErrors | undefined,
  });

  const handleNext = () => {
    setActiveStep((prev) => {
      if (prev === 0) {
        return 1;
      }

      if (prev === 1) {
        return 2;
      }

      return 2;
    });
  };

  const handleBack = async () => {
    if (activeStep === 2) {
      setActiveStep(1);
      return;
    }

    if (activeStep === 1) {
      const result = await registrationSessionApiService.reset();

      if (!result.success) {
        toast.error(t("identification.lookup_error"));
        return;
      }

      setWizardData((prev) => ({
        cedula: prev.cedula,
        name: "",
        accountDraft: {
          email: "",
          confirmEmail: "",
          password: "",
          confirmPassword: "",
        },
        accountErrors: undefined,
      }));
      setActiveStep(0);
      return;
    }

    setActiveStep(0);
  };

  const handleRequireIdentification = () => {
    setWizardData({
      cedula: "",
      name: "",
      accountDraft: {
        email: "",
        confirmEmail: "",
        password: "",
        confirmPassword: "",
      },
      accountErrors: undefined,
    });
    setActiveStep(0);
  };

  const handleRequireAccount = (accountErrors?: RegisterAccountStepErrors) => {
    setWizardData((prev) => ({
      ...prev,
      accountErrors,
    }));
    setActiveStep(1);
  };

  const updateWizardData = (data: Partial<typeof wizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const handleAccountNext = (accountDraft: RegisterAccountDraft) => {
    setWizardData((prev) => ({
      ...prev,
      accountDraft,
      accountErrors: undefined,
    }));
    setActiveStep(2);
  };

  return (
    <Card className="w-full max-w-[520px] mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-border dark:border-slate-800 rounded bg-white dark:bg-card">
      <CardHeader className="space-y-4 pb-2 pt-8 flex flex-col items-center text-center border-b border-border dark:border-slate-800 mx-6">
        <Image
          src="/images/cuenta-unica-icon.png"
          alt={t("logo_alt")}
          width={98}
          height={96}
          className="h-16 w-auto rounded-lg"
        />

        <CardTitle className="text-xl font-bold text-primary dark:text-blue-400">
          {t("title")}
        </CardTitle>

        <div className="w-full">
          <Stepper
            activeStep={activeStep}
            stepLabel={t("step_label")}
            steps={steps}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {activeStep === 0 && (
          <StepIdentification
            onNext={handleNext}
            updateData={updateWizardData}
            defaultValues={{ cedula: wizardData.cedula }}
            returnUrl={returnUrl}
          />
        )}

        {activeStep === 1 && (
          <StepAccount
            onBack={handleBack}
            onNext={handleAccountNext}
            cedula={wizardData.cedula}
            defaultValues={wizardData.accountDraft}
            initialErrors={wizardData.accountErrors}
          />
        )}

        {activeStep === 2 && (
          <StepVerification
            onBack={handleBack}
            onRequireAccount={handleRequireAccount}
            onRequireIdentification={handleRequireIdentification}
            accountDraft={wizardData.accountDraft}
            userData={{ name: wizardData.name }}
          />
        )}
      </CardContent>
    </Card>
  );
}
