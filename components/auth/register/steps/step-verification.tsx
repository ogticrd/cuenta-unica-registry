"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowLeft, Camera, Check, ShieldAlert, Smile } from "lucide-react"
import { useT } from "@/hooks/use-t"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

interface StepVerificationProps {
    onNext: () => void
    onBack: () => void
    userData: { name: string; cedula: string }
}

export function StepVerification({ onNext, onBack, userData }: StepVerificationProps) {
    const t = useT("register")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [verificationSuccess, setVerificationSuccess] = useState(false)
    const [termsAccepted, setTermsAccepted] = useState(false)

    const firstName = userData.name.split(" ")[0]?.toUpperCase() || userData.name.toUpperCase()

    const handleStartVerification = () => {
        setIsModalOpen(true)
        setIsVerifying(false)
        setVerificationSuccess(false)
    }

    const simulateRekognitionProcess = () => {
        setIsVerifying(true)
        setTimeout(() => {
            setVerificationSuccess(true)
            setIsVerifying(false)

            setTimeout(() => {
                setIsModalOpen(false)
                onNext()
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
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-muted-foreground dark:text-slate-400 dark:hover:text-slate-100 hover:text-foreground transition-colors mt-6 font-medium"
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
