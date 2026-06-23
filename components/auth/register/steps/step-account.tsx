"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, Check, Eye, EyeOff, X } from "lucide-react";
import { useLocale } from "next-intl";
import {
  type SyntheticEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { translateOryMessageKey } from "@/lib/ory/custom-translations";
import { createAccountSchema } from "@/lib/schemas/registration";
import type {
  RegisterAccountDraft,
  RegisterAccountStepErrors,
} from "@/lib/types/registration/account";
import { getPasswordRequirementStatus } from "@/lib/utils/password";

interface StepAccountProps {
  onBack: () => void;
  onNext: (accountDraft: RegisterAccountDraft) => Promise<void> | void;
  cedula: string;
  defaultValues: RegisterAccountDraft;
  initialErrors?: RegisterAccountStepErrors;
}

function preventClipboardAction<T extends SyntheticEvent>(event: T) {
  event.preventDefault();
  return false;
}

function translateFieldErrorKey(
  key: string,
  locale: "es" | "en",
  t: ReturnType<typeof useT>,
) {
  if (key.startsWith("identities.messages.")) {
    return translateOryMessageKey(key, locale);
  }

  return t(key);
}

function translateGeneralError(
  errors: RegisterAccountStepErrors,
  t: ReturnType<typeof useT>,
) {
  switch (errors.code) {
    case "invalid_payload":
      return t("account.error");
    case "identity_exists":
      return t("account.identity_exists");
    case "registration_session_missing":
      return t("account.session_missing");
    case "verification_required":
      return t("account.verification_required");
    case "account_draft_missing":
      return t("account.draft_missing");
    case "password_cedula_similarity":
      return t("account.validation.password_cedula_similarity");
    case "password_email_similarity":
      return t("account.validation.password_email_similarity");
    case "password_weak":
      return t("account.validation.password_weak");
    case "password_compromised":
      return t("account.validation.password_compromised");
    case "invalid_cedula":
      return t("identification.id_invalid");
    case "citizen_not_found":
      return t("identification.id_not_found");
    case "ory_validation_error":
    case "unexpected_error":
      return t("account.error");
    default:
      return undefined;
  }
}

function getPasswordErrorMessage(
  code: RegisterAccountStepErrors["code"],
  t: ReturnType<typeof useT>,
) {
  switch (code) {
    case "password_cedula_similarity":
      return t("account.validation.password_cedula_similarity");
    case "password_email_similarity":
      return t("account.validation.password_email_similarity");
    case "password_weak":
      return t("account.validation.password_weak");
    case "password_compromised":
      return t("account.validation.password_compromised");
    default:
      return undefined;
  }
}

export function StepAccount({
  onBack,
  onNext,
  cedula,
  defaultValues,
  initialErrors,
}: StepAccountProps) {
  const t = useT("register");
  const locale = useLocale() as "es" | "en";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const accountSchema = useMemo(
    () => createAccountSchema(t, cedula),
    [cedula, t],
  );
  type AccountValues = z.infer<typeof accountSchema>;

  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    mode: "onChange",
    defaultValues,
  });
  const defaultValuesKey = [
    defaultValues.email,
    defaultValues.confirmEmail,
    defaultValues.password,
    defaultValues.confirmPassword,
  ].join("\u0000");
  const lastDefaultValuesKey = useRef(defaultValuesKey);
  const initialGeneralError = initialErrors
    ? translateGeneralError(initialErrors, t)
    : undefined;
  const initialEmailErrorMessage = initialErrors?.fieldErrors?.email
    ? translateFieldErrorKey(initialErrors.fieldErrors.email, locale, t)
    : undefined;
  const initialPasswordErrorMessage = initialErrors
    ? initialErrors.fieldErrors?.password
      ? translateFieldErrorKey(initialErrors.fieldErrors.password, locale, t)
      : getPasswordErrorMessage(initialErrors.code, t)
    : undefined;
  const hasInitialFieldErrors = Boolean(
    initialEmailErrorMessage || initialPasswordErrorMessage,
  );

  useEffect(() => {
    if (lastDefaultValuesKey.current === defaultValuesKey) {
      return;
    }

    lastDefaultValuesKey.current = defaultValuesKey;
    form.reset({
      email: defaultValues.email,
      confirmEmail: defaultValues.confirmEmail,
      password: defaultValues.password,
      confirmPassword: defaultValues.confirmPassword,
    });
  }, [
    defaultValues.confirmEmail,
    defaultValues.confirmPassword,
    defaultValues.email,
    defaultValues.password,
    defaultValuesKey,
    form,
  ]);

  useEffect(() => {
    if (!initialErrors) {
      return;
    }

    if (
      initialEmailErrorMessage &&
      form.getFieldState("email").error?.message !== initialEmailErrorMessage
    ) {
      form.setError("email", {
        message: initialEmailErrorMessage,
      });
    }

    if (
      initialPasswordErrorMessage &&
      form.getFieldState("password").error?.message !==
        initialPasswordErrorMessage
    ) {
      form.setError("password", {
        message: initialPasswordErrorMessage,
      });
    }

    const generalError = translateGeneralError(initialErrors, t);
    const hasFieldErrors = Boolean(
      initialEmailErrorMessage || initialPasswordErrorMessage,
    );

    if (
      generalError &&
      !hasFieldErrors &&
      initialErrors.code !== "ory_validation_error" &&
      initialErrors.code !== "identity_exists"
    ) {
      toast.error(generalError);
    }
  }, [
    form,
    initialEmailErrorMessage,
    initialErrors,
    initialPasswordErrorMessage,
    t,
  ]);

  const onSubmit = (data: AccountValues) => onNext(data);

  return (
    <div className="space-y-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300 w-full">
      <div className="text-center space-y-2">
        <p className="text-sm text-primary dark:text-blue-100/80 font-medium leading-relaxed">
          {t("account.intro")}
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 w-full mt-4"
          noValidate
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary dark:text-blue-300 font-semibold">
                  {t("account.email_label")}{" "}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("account.email_placeholder")}
                    {...field}
                    onChange={(event) => {
                      field.onChange(event);

                      if (form.formState.errors.email) {
                        form.clearErrors("email");
                      }
                    }}
                    onPaste={preventClipboardAction}
                    onCopy={preventClipboardAction}
                    autoComplete="off"
                    className="h-12 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-500/30"
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
                <FormLabel className="text-primary dark:text-blue-300 font-semibold">
                  {t("account.confirm_email_label")}{" "}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("account.email_placeholder")}
                    {...field}
                    onChange={(event) => {
                      field.onChange(event);

                      if (form.formState.errors.confirmEmail) {
                        form.clearErrors("confirmEmail");
                      }
                    }}
                    onPaste={preventClipboardAction}
                    onCopy={preventClipboardAction}
                    autoComplete="off"
                    className="h-12 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-500/30"
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
                <FormLabel className="text-primary dark:text-blue-300 font-semibold">
                  {t("account.password_label")}{" "}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);

                        if (form.formState.errors.password) {
                          form.clearErrors("password");
                        }
                      }}
                      onPaste={preventClipboardAction}
                      onCopy={preventClipboardAction}
                      autoComplete="off"
                      className="h-12 pr-10 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-500/30"
                    />
                  </FormControl>
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
                    <span className="sr-only">
                      {t("account.toggle_password_visibility")}
                    </span>
                  </Button>
                </div>
                <FormMessage />

                <div className="mt-3 space-y-2 text-sm w-full">
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    {t("account.password_requirements.title")}
                  </p>
                  <ul className="space-y-1.5 pl-1">
                    {[
                      {
                        met: getPasswordRequirementStatus(
                          form.watch("password") || "",
                        ).length,
                        label: t("account.password_requirements.length"),
                      },
                      {
                        met: getPasswordRequirementStatus(
                          form.watch("password") || "",
                        ).uppercase,
                        label: t("account.password_requirements.uppercase"),
                      },
                      {
                        met: getPasswordRequirementStatus(
                          form.watch("password") || "",
                        ).lowercase,
                        label: t("account.password_requirements.lowercase"),
                      },
                      {
                        met: getPasswordRequirementStatus(
                          form.watch("password") || "",
                        ).number,
                        label: t("account.password_requirements.number"),
                      },
                      {
                        met: getPasswordRequirementStatus(
                          form.watch("password") || "",
                        ).symbol,
                        label: t("account.password_requirements.symbol"),
                      },
                    ].map((req) => (
                      <li
                        key={req.label}
                        className={`flex items-center gap-2.5 transition-colors ${req.met ? "text-green-600 dark:text-green-500" : "text-slate-500 dark:text-slate-400"}`}
                      >
                        {req.met ? (
                          <Check className="w-4 h-4 shrink-0 text-green-600 dark:text-green-500" />
                        ) : (
                          <X className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
                        )}
                        <span>{req.label}</span>
                      </li>
                    ))}
                    {!form.watch("password") ||
                    form.formState.errors.password?.message ? (
                      <li className="flex items-center gap-2.5 transition-colors text-slate-500 dark:text-slate-400">
                        <X className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
                        <span>{t("account.validation.password_secure")}</span>
                      </li>
                    ) : (
                      <li className="flex items-center gap-2.5 transition-colors text-green-600 dark:text-green-500">
                        <Check className="w-4 h-4 shrink-0 text-green-600 dark:text-green-500" />
                        <span>{t("account.validation.password_secure")}</span>
                      </li>
                    )}
                    {form.watch("password") !== form.watch("confirmPassword") ||
                    !form.watch("confirmPassword") ? (
                      <li className="flex items-center gap-2.5 transition-colors text-slate-500 dark:text-slate-400">
                        <X className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
                        <span>{t("account.validation.password_match")}</span>
                      </li>
                    ) : (
                      <li className="flex items-center gap-2.5 transition-colors text-green-600 dark:text-green-500">
                        <Check className="w-4 h-4 shrink-0 text-green-600 dark:text-green-500" />
                        <span>{t("account.validation.password_match")}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary dark:text-blue-300 font-semibold">
                  {t("account.confirm_password_label")}{" "}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="********"
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);

                        if (form.formState.errors.confirmPassword) {
                          form.clearErrors("confirmPassword");
                        }
                      }}
                      onPaste={preventClipboardAction}
                      onCopy={preventClipboardAction}
                      autoComplete="off"
                      className="h-12 pr-10 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-500/30"
                    />
                  </FormControl>
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
                    <span className="sr-only">
                      {t("account.toggle_password_visibility")}
                    </span>
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col items-center w-full gap-4">
            {initialGeneralError && !hasInitialFieldErrors && (
              <Alert
                variant="destructive"
                className="border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 w-full text-left"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{initialGeneralError}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="h-12 w-full bg-[#003B73] hover:bg-[#002f5c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={form.formState.isSubmitting}
            >
              {t("account.continue")}
            </Button>

            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground dark:text-slate-400 dark:hover:text-slate-100 hover:text-foreground transition-colors font-medium mt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("common.back")}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}
