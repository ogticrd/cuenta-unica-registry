"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { useT } from "@/hooks/use-t"
import { ROUTES } from "@/lib/constants/routes"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

type IdentificationValues = {
    cedula: string
}

interface StepIdentificationProps {
    onNext: () => void
    updateData: (data: { cedula: string; name: string }) => void
    defaultValues: { cedula: string }
}

export function StepIdentification({ onNext, updateData, defaultValues }: StepIdentificationProps) {
    const t = useT("register")
    const [isLoading, setIsLoading] = useState(false)
    const identificationSchema = z.object({
        cedula: z
            .string()
            .min(11, { message: t("identification.id_invalid_length") })
            .max(11, { message: t("identification.id_invalid_length") }),
    })

    const form = useForm<IdentificationValues>({
        resolver: zodResolver(identificationSchema),
        defaultValues: {
            cedula: defaultValues.cedula || "",
        },
    })

    const onSubmit = async (data: IdentificationValues) => {
        setIsLoading(true)

        try {
            await new Promise((resolve) => setTimeout(resolve, 1500))

            let nombreSimulado = "Ciudadano Ejemplo"
            if (data.cedula.startsWith("402")) {
                nombreSimulado = "Juan de los Palotes"
            } else if (data.cedula.startsWith("001")) {
                nombreSimulado = "Mar\u00eda P\u00e9rez Garc\u00eda"
            }

            updateData({ cedula: data.cedula, name: nombreSimulado })
            onNext()
        } catch (error) {
            console.error("Error validating ID:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6 flex flex-col w-full animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-2 mb-2">
                <p className="text-sm text-primary dark:text-blue-100/80 font-medium leading-relaxed">
                    {t("identification.intro")}
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full">
                    <FormField
                        control={form.control}
                        name="cedula"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-primary dark:text-blue-300 font-semibold">
                                    {t("identification.id_label")} <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={t("identification.id_placeholder")}
                                        {...field}
                                        className="h-12 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-500/30"
                                        disabled={isLoading}
                                        maxLength={11}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold rounded-full bg-[#003B73] hover:bg-[#002f5c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {t("identification.loading")}
                                </>
                            ) : (
                                t("identification.continue")
                            )}
                        </Button>
                    </div>
                </form>
            </Form>

            <div className="text-center mt-6 text-sm px-4">
                <div className="text-muted-foreground dark:text-slate-400 leading-relaxed">
                    {t("identification.existing_account")}{" "}
                    <Link href={ROUTES.login} className="text-secondary dark:text-blue-400 font-medium hover:underline">
                        {t("identification.login_cta")}
                    </Link>
                </div>
            </div>
        </div>
    )
}
