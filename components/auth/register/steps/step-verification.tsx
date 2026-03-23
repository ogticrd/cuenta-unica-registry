"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, Check, ShieldAlert, Smile } from "lucide-react"
import { toast } from "sonner"
import { useT } from "@/hooks/use-t"
import { accountService } from "@/lib/services/registration/account.service"
import { verificationService } from "@/lib/services/registration/verification.service"
import type {
    RegisterAccountDraft,
    RegisterAccountErrorCode,
    RegisterAccountStepErrors,
} from "@/lib/types/registration/account"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

interface StepVerificationProps {
    onBack: () => void
    onRequireAccount: (accountErrors?: RegisterAccountStepErrors) => void
    onRequireIdentification: () => void
    accountDraft: RegisterAccountDraft
    userData: { name: string }
}

export function StepVerification({
    onBack,
    onRequireAccount,
    onRequireIdentification,
    accountDraft,
    userData,
}: StepVerificationProps) {
    const t = useT("register")
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [verificationSuccess, setVerificationSuccess] = useState(false)
    const [termsAccepted, setTermsAccepted] = useState(false)

    const firstName = userData.name.split(" ")[0]?.toUpperCase() || userData.name.toUpperCase()

    const handleStartVerification = () => {
        if (!accountDraft.email || !accountDraft.password) {
            onRequireAccount()
            return
        }

        setIsModalOpen(true)
        setIsVerifying(false)
        setVerificationSuccess(false)
    }

    const simulateRekognitionProcess = () => {
        setIsVerifying(true)
        setTimeout(async () => {
            const result = await verificationService.completeRegistrationVerification()

            if (!result.success) {
                setIsVerifying(false)
                setIsModalOpen(false)

                if (result.code === "registration_session_missing") {
                    onRequireIdentification()
                }

                toast.error(t("verification.session_error"))
                return
            }

            setVerificationSuccess(true)
            const accountResult = await accountService.registerAccount({
                email: accountDraft.email,
                password: accountDraft.password,
            })

            if (!accountResult.success) {
                const messageByErrorCode: Record<RegisterAccountErrorCode, string> = {
                    invalid_payload: t("account.error"),
                    registration_session_missing: t("account.session_missing"),
                    password_cedula_similarity: t("account.validation.password_cedula_similarity"),
                    invalid_cedula: t("identification.id_invalid"),
                    citizen_not_found: t("identification.id_not_found"),
                    identity_exists: t("account.identity_exists"),
                    ory_validation_error: t("account.error"),
                    unexpected_error: t("account.error"),
                }

                setIsVerifying(false)
                setVerificationSuccess(false)
                setIsModalOpen(false)

                if (accountResult.code === "registration_session_missing") {
                    onRequireIdentification()
                    toast.error(messageByErrorCode[accountResult.code])
                    return
                }

                onRequireAccount({
                    code: accountResult.code,
                    fieldErrors: accountResult.fieldErrors,
                })
                return
            }

            setIsVerifying(false)

            if (accountResult.destination === "login") {
                toast.success(t("account.success_title"), {
                    description: t("account.success_description"),
                })
            }

            setTimeout(() => {
                setIsModalOpen(false)
                router.push(accountResult.redirectTo)
            }, 1500)
        }, 3000)
    }

    return (
        <div className="space-y-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
            <Image src="/images/icon-step-2.svg" alt={t("verification.illustration_alt")} width={150} height={150} />

            <div className="text-center">
                <h3 className="text-md font-bold text-primary dark:text-blue-300">
                    {t("verification.greeting", { firstName })}
                </h3>
                <p className="text-sm text-primary dark:text-blue-100/80 font-medium max-w-md mx-auto leading-relaxed">
                    {t("verification.intro")}
                </p>
            </div>

            <div className="w-full space-y-3 mt-4">
                <div className="bg-[#eff7ff] dark:bg-slate-900/80 dark:border dark:border-slate-800 p-4 rounded flex items-center gap-4 text-sm text-primary dark:text-slate-100">
                    <Camera className="w-8 h-8 opacity-70 shrink-0 text-primary dark:text-blue-300" />
                    <p>
                        {t.rich("verification.requirements.device", {
                            strong: (chunks) => <strong>{chunks}</strong>,
                        })}
                    </p>
                </div>

                <div className="bg-[#eff7ff] dark:bg-slate-900/80 dark:border dark:border-slate-800 p-4 rounded flex items-center gap-4 text-sm text-primary dark:text-slate-100">
                    <Smile className="w-8 h-8 opacity-70 shrink-0 text-primary dark:text-blue-300" />
                    <p>
                        {t.rich("verification.requirements.face", {
                            strong: (chunks) => <strong>{chunks}</strong>,
                        })}
                    </p>
                </div>

                <div className="bg-[#eff7ff] dark:bg-slate-900/80 dark:border dark:border-slate-800 p-4 rounded flex items-center gap-4 text-sm text-primary dark:text-slate-100">
                    <ShieldAlert className="w-8 h-8 opacity-70 shrink-0 text-primary dark:text-blue-300" />
                    <p>
                        {t.rich("verification.requirements.photosensitive", {
                            strong: (chunks) => <strong>{chunks}</strong>,
                        })}
                    </p>
                </div>
            </div>

            <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                    id="terms"
                    className="rounded-sm border-gray-300 data-[state=checked]:bg-red-600 data-[state=checked]:text-white"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-primary dark:text-blue-100 underline decoration-blue-200 dark:decoration-blue-500/40 underline-offset-4 cursor-pointer"
                >
                    {t("verification.terms_label")} <span className="text-destructive">*</span>
                </label>
            </div>

            <Button
                onClick={handleStartVerification}
                className="w-full h-12 text-base font-semibold rounded-full bg-primary hover:bg-[#002f5c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white mt-4"
                disabled={!termsAccepted}
            >
                {t("verification.start_process")}
            </Button>

            <button
                type="button"
                onClick={onBack}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground dark:text-slate-400 dark:hover:text-slate-100 hover:text-foreground transition-colors font-medium mt-2"
            >
                <ArrowLeft className="w-4 h-4" />
                {t("common.back")}
            </button>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-full w-screen h-[100dvh] m-0 p-0 rounded-none border-0 bg-black/95 flex flex-col items-center justify-center pt-8 pb-12">
                    <DialogTitle className="sr-only">{t("verification.modal.screenreader_title")}</DialogTitle>
                    <DialogDescription className="sr-only">{t("verification.modal.screenreader_description")}</DialogDescription>

                    <div className="text-white text-center space-y-8 flex flex-col items-center max-w-md w-full px-6 h-full justify-center">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">{t("verification.modal.title")}</h2>
                            <p className="text-white/70">
                                {t("verification.modal.description")}
                            </p>
                        </div>

                        <div className="relative w-64 h-80 rounded-[120px] border-4 border-dashed border-white/30 flex flex-col items-center justify-center overflow-hidden bg-white/5 my-8">
                            {isVerifying ? (
                                <>
                                    <div className="absolute inset-x-0 h-4 bg-blue-500/50 top-0 animate-[scan_2s_ease-in-out_infinite] blur-sm z-20" />
                                    <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
                                    <Camera className="h-16 w-16 text-white/50 animate-pulse" />
                                </>
                            ) : verificationSuccess ? (
                                <div className="absolute inset-0 bg-green-500 flex flex-col items-center justify-center text-white">
                                    <Check className="h-20 w-20 mb-4" />
                                    <span className="font-bold text-xl">{t("verification.modal.verified")}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-white/50 p-4 text-center">
                                    <Camera className="h-20 w-20 mb-4 opacity-50" />
                                    <span className="text-sm px-4">{t("verification.modal.face_position")}</span>
                                </div>
                            )}
                        </div>

                        <div className="w-full mt-auto">
                            {!isVerifying && !verificationSuccess && (
                                <div className="space-y-4">
                                    <Button
                                        onClick={simulateRekognitionProcess}
                                        className="w-full h-14 text-lg rounded-full bg-blue-600 hover:bg-blue-700"
                                    >
                                        {t("verification.modal.allow_camera")}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-white/70 hover:text-white hover:bg-white/10"
                                    >
                                        {t("common.cancel")}
                                    </Button>
                                </div>
                            )}

                            {isVerifying && (
                                <p className="text-lg font-medium animate-pulse text-blue-400">
                                    {t("verification.modal.analyzing")}
                                </p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
