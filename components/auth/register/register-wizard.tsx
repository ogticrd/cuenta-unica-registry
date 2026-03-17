"use client"

import { useState } from "react"
import Image from "next/image"
import { useT } from "@/hooks/use-t"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Stepper } from "@/components/ui/stepper"
import { StepIdentification } from "./steps/step-identification"
import { StepVerification } from "./steps/step-verification"
import { StepAccount } from "./steps/step-account"

export function RegisterWizard() {
    const t = useT("register")
    const [activeStep, setActiveStep] = useState(0)
    const steps = [
        {
            title: t("steps.identification.title"),
            description: t("steps.identification.description"),
        },
        {
            title: t("steps.verification.title"),
            description: t("steps.verification.description"),
        },
        {
            title: t("steps.account.title"),
            description: t("steps.account.description"),
        },
    ]

    const [wizardData, setWizardData] = useState({
        cedula: "",
        name: "",
        email: "",
        password: "",
    })

    const handleNext = () => {
        setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
    }

    const handleBack = () => {
        setActiveStep((prev) => Math.max(prev - 1, 0))
    }

    const updateWizardData = (data: Partial<typeof wizardData>) => {
        setWizardData((prev) => ({ ...prev, ...data }))
    }

    return (
        <Card className="w-full max-w-[520px] mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-border rounded bg-white">
            <CardHeader className="space-y-4 pb-2 pt-8 flex flex-col items-center text-center border-b border-border mx-6">
                <Image src="/images/cuenta-unica-icon.png" alt={t("logo_alt")} width={64} height={64} className="rounded-lg" />

                <CardTitle className="text-xl font-bold text-primary">
                    {t("title")}
                </CardTitle>

                <div className="w-full">
                    <Stepper activeStep={activeStep} stepLabel={t("step_label")} steps={steps} />
                </div>
            </CardHeader>

            <CardContent className="pt-6">
                {activeStep === 0 && (
                    <StepIdentification
                        onNext={handleNext}
                        updateData={updateWizardData}
                        defaultValues={{ cedula: wizardData.cedula }}
                    />
                )}

                {activeStep === 1 && (
                    <StepVerification
                        onNext={handleNext}
                        onBack={handleBack}
                        userData={{ name: wizardData.name, cedula: wizardData.cedula }}
                    />
                )}

                {activeStep === 2 && (
                    <StepAccount
                        onBack={handleBack}
                        userData={wizardData}
                    />
                )}
            </CardContent>
        </Card>
    )
}
