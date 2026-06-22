"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { useT } from "@/hooks/use-t";
import { accountService } from "@/lib/services/registration/account.service";
import { registrationSessionApiService } from "@/lib/services/registration/registration-session-api.service";
import type {
  RegisterAccountDraft,
  RegisterAccountStepErrors,
} from "@/lib/types/registration/account";
import type { RegistrationSessionStatus } from "@/lib/types/registration/session";
import { StepAccount } from "./steps/step-account";
import { StepIdentification } from "./steps/step-identification";
import { StepVerification } from "./steps/step-verification";

interface RegisterWizardProps {
  initialStep: 0 | 1 | 2;
  initialCedula: string;
  initialName: string;
  initialSessionStatus: RegistrationSessionStatus | null;
  hasAccountDraft: boolean;
  returnUrl?: string;
}

interface RegisterWizardData {
  cedula: string;
  name: string;
  accountDraft: RegisterAccountDraft;
  accountErrors?: RegisterAccountStepErrors;
}

export function RegisterWizard({
  initialStep,
  initialCedula,
  initialName,
  initialSessionStatus,
  hasAccountDraft,
  returnUrl,
}: RegisterWizardProps) {
  const t = useT("register");
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(initialStep);
  const [sessionStatus, setSessionStatus] =
    useState<RegistrationSessionStatus | null>(initialSessionStatus);
  const [canFinalizeFromDraft, setCanFinalizeFromDraft] =
    useState(hasAccountDraft);
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

  const [wizardData, setWizardData] = useState<RegisterWizardData>({
    cedula: initialCedula,
    name: initialName,
    accountDraft: {
      email: "",
      confirmEmail: "",
      password: "",
      confirmPassword: "",
    } satisfies RegisterAccountDraft,
    accountErrors:
      initialSessionStatus === "verified" && !hasAccountDraft
        ? ({
            code: "account_draft_missing",
          } satisfies RegisterAccountStepErrors)
        : undefined,
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

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

      setWizardData(() => ({
        cedula: "",
        name: "",
        accountDraft: {
          email: "",
          confirmEmail: "",
          password: "",
          confirmPassword: "",
        },
        accountErrors: undefined,
      }));
      setSessionStatus(null);
      setCanFinalizeFromDraft(false);
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
    setSessionStatus(null);
    setCanFinalizeFromDraft(false);
    setActiveStep(0);
  };

  const handleRequireAccount = (accountErrors?: RegisterAccountStepErrors) => {
    setWizardData((prev) => ({
      ...prev,
      accountErrors,
    }));
    setActiveStep(1);
  };

  const updateWizardData = (data: Partial<RegisterWizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const handleAccountNext = async (accountDraft: RegisterAccountDraft) => {
    const result = await accountService.saveAccountDraft({
      email: accountDraft.email,
      password: accountDraft.password,
    });

    if (!result.success) {
      if (result.code === "registration_session_missing") {
        handleRequireIdentification();
        toast.error(t("account.session_missing"));
        return;
      }

      setWizardData((prev) => ({
        ...prev,
        accountErrors: {
          code: result.code,
        },
      }));
      return;
    }

    setWizardData((prev) => ({
      ...prev,
      accountDraft,
      accountErrors: undefined,
    }));
    setSessionStatus(result.sessionStatus);
    setCanFinalizeFromDraft(result.sessionStatus === "verified");
    setActiveStep(2);
  };

  return (
    <Card
      className="w-full max-w-[520px] mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-border dark:border-slate-800 rounded bg-white dark:bg-card"
      data-hydrated={isHydrated}
      data-testid="registration-wizard"
    >
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
            autoFinalizeAccount={
              sessionStatus === "verified" && canFinalizeFromDraft
            }
            userData={{ name: wizardData.name }}
          />
        )}
      </CardContent>
    </Card>
  );
}
