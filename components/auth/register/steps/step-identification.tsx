"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useT } from "@/hooks/use-t";
import { ROUTES } from "@/lib/constants/routes";
import { createCedulaSchema } from "@/lib/schemas/registration";
import { citizenService } from "@/lib/services/registration/citizen.service";
import type { CitizenLookupErrorCode } from "@/lib/types/registration/citizen";
import {
  CEDULA_MASK_LENGTH,
  formatCedula,
  normalizeCedula,
} from "@/lib/utils/cedula";

interface StepIdentificationProps {
  onNext: () => void;
  updateData: (data: { cedula: string; name: string }) => void;
  defaultValues: {
    cedula: string;
  };
  returnUrl?: string;
}

export function StepIdentification({
  onNext,
  updateData,
  defaultValues,
  returnUrl,
}: StepIdentificationProps) {
  const t = useT("register");
  const [isLoading, setIsLoading] = useState(false);
  const identificationSchema = createCedulaSchema(t);

  const form = useForm({
    resolver: zodResolver(identificationSchema),
    mode: "onChange",
    defaultValues: {
      cedula: formatCedula(defaultValues.cedula),
    },
  });

  useEffect(() => {
    form.reset({
      cedula: formatCedula(defaultValues.cedula),
    });
  }, [defaultValues.cedula, form]);

  const onSubmit = async (data: { cedula: string }) => {
    setIsLoading(true);

    try {
      const cedula = normalizeCedula(data.cedula);
      const result = await citizenService.identifyCitizen(cedula, returnUrl);

      if (!result.success) {
        const messageByErrorCode: Record<CitizenLookupErrorCode, string> = {
          invalid_cedula: t("identification.id_invalid"),
          identity_exists: t("identification.account_exists"),
          citizen_not_found: t("identification.id_not_found"),
          unexpected_error: t("identification.lookup_error"),
        };

        form.setError("cedula", {
          message: messageByErrorCode[result.code],
        });

        return;
      }

      updateData({
        cedula,
        name: result.citizen.firstName,
      });
      onNext();
    } catch (error) {
      console.error("Error validating ID:", error);
      form.setError("cedula", {
        message: t("identification.lookup_error"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col w-full animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center space-y-2 mb-2">
        <p className="text-sm text-primary dark:text-blue-100/80 font-medium leading-relaxed">
          {t("identification.intro")}
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 w-full"
        >
          <FormField
            control={form.control}
            name="cedula"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary dark:text-blue-300 font-semibold">
                  {t("identification.id_label")}{" "}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("identification.id_placeholder")}
                    {...field}
                    value={field.value}
                    onChange={(event) => {
                      const formattedValue = formatCedula(event.target.value);
                      field.onChange(formattedValue);

                      if (form.formState.errors.cedula) {
                        form.clearErrors("cedula");
                      }

                      if (normalizeCedula(formattedValue).length === 11) {
                        void form.trigger("cedula");
                      }
                    }}
                    className="h-12 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-500/30"
                    disabled={isLoading}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={CEDULA_MASK_LENGTH}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-full bg-[#003B73] hover:bg-[#002f5c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={isLoading || !form.formState.isValid}
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
          <Link
            href={ROUTES.login}
            className="text-secondary dark:text-blue-400 font-medium hover:underline"
          >
            {t("identification.login_cta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
