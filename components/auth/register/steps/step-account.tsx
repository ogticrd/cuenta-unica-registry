"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useT } from "@/hooks/use-t"
import { createAccountSchema } from "@/lib/schemas/registration"
import { accountService } from "@/lib/services/registration/account.service"
import type { RegisterAccountErrorCode } from "@/lib/types/registration/account"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface StepAccountProps {
    onBack: () => void
    userData: { cedula: string }
}

function preventClipboardAction<T extends React.SyntheticEvent>(event: T) {
    event.preventDefault()
    return false
}

export function StepAccount({ onBack, userData }: StepAccountProps) {
    const t = useT("register")
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const accountSchema = createAccountSchema(t, userData.cedula)
    type AccountValues = z.infer<typeof accountSchema>

    const form = useForm<AccountValues>({
        resolver: zodResolver(accountSchema),
        reValidateMode: "onChange",
        defaultValues: {
            email: "",
            confirmEmail: "",
            password: "",
            confirmPassword: "",
        },
    })

    const onSubmit = async (_data: AccountValues) => {
        setIsLoading(true)

        try {
            const result = await accountService.registerAccount({
                cedula: userData.cedula,
                email: _data.email,
                password: _data.password,
            })

            if (!result.success) {
                const messageByErrorCode: Record<RegisterAccountErrorCode, string> = {
                    invalid_payload: t("account.error"),
                    invalid_cedula: t("identification.id_invalid"),
                    citizen_not_found: t("identification.id_not_found"),
                    identity_exists: t("account.identity_exists"),
                    ory_validation_error: t("account.error"),
                    unexpected_error: t("account.error"),
                }

                if (result.fieldErrors?.email) {
                    form.setError("email", { message: result.fieldErrors.email })
                }

                if (result.fieldErrors?.password) {
                    form.setError("password", { message: result.fieldErrors.password })
                }

                toast.error(result.formError || messageByErrorCode[result.code])
                return
            }

            if (result.destination === "login") {
                toast.success(t("account.success_title"), {
                    description: t("account.success_description"),
                })
            }

            router.push(result.redirectTo)
        } catch (error) {
            console.error("Registration error:", error)
            toast.error(t("account.error"))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300 w-full">
            <div className="text-center space-y-2">
                <p className="text-sm text-primary dark:text-blue-100/80 font-medium leading-relaxed">
                    {t("account.intro")}
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full mt-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-primary dark:text-blue-300 font-semibold">{t("account.email_label")} <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder={t("account.email_placeholder")}
                                        {...field}
                                        onPaste={preventClipboardAction}
                                        onCopy={preventClipboardAction}
                                        autoComplete="off"
                                        className="h-12 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-500/30"
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmEmail"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-primary dark:text-blue-300 font-semibold">{t("account.confirm_email_label")} <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder={t("account.email_placeholder")}
                                        {...field}
                                        onPaste={preventClipboardAction}
                                        onCopy={preventClipboardAction}
                                        autoComplete="off"
                                        className="h-12 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-500/30"
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-primary dark:text-blue-300 font-semibold">{t("account.password_label")} <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="********"
                                            {...field}
                                            onPaste={preventClipboardAction}
                                            onCopy={preventClipboardAction}
                                            autoComplete="off"
                                            className="h-12 pr-10 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-500/30"
                                            disabled={isLoading}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground dark:text-slate-400 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                            <span className="sr-only">{t("account.toggle_password_visibility")}</span>
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-primary dark:text-blue-300 font-semibold">{t("account.confirm_password_label")} <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="********"
                                            {...field}
                                            onPaste={preventClipboardAction}
                                            onCopy={preventClipboardAction}
                                            autoComplete="off"
                                            className="h-12 pr-10 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-500/30"
                                            disabled={isLoading}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground dark:text-slate-400 hover:bg-transparent"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                            <span className="sr-only">{t("account.toggle_password_visibility")}</span>
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="pt-6 flex flex-col items-center w-full gap-4">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="h-12 w-full bg-[#003B73] hover:bg-[#002f5c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-full font-semibold"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {t("account.finalizing")}
                                </>
                            ) : (
                                <>
                                    {t("account.create_account")}
                                    <CheckCircle2 className="ml-2 h-5 w-5 opacity-70" />
                                </>
                            )}
                        </Button>

                        <button
                            type="button"
                            onClick={onBack}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 text-sm text-muted-foreground dark:text-slate-400 dark:hover:text-slate-100 hover:text-foreground transition-colors font-medium mt-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t("common.back")}
                        </button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
