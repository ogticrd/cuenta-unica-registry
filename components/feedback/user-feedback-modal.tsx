"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/hooks/use-t";
import { reportClientError } from "@/lib/logging/client";
import {
  createFeedbackSchema,
  type FeedbackFormData,
} from "@/lib/schemas/feedback/feedback.schema";
import { submitFeedback } from "@/lib/services/feedback/feedback.service";
import {
  CEDULA_MASK_LENGTH,
  formatCedula,
  normalizeCedula,
} from "@/lib/utils/cedula";

interface UserFeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

export function UserFeedbackModal({ open, onClose }: UserFeedbackModalProps) {
  const t = useT("feedback");
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<
    "send_error" | "unavailable" | null
  >(null);
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_PHONE?.replace(
    /\D/g,
    "",
  );
  const isValidPhone = phone && /^[1-9]\d{6,14}$/.test(phone);

  const whatsappUrl = isValidPhone
    ? `https://wa.me/${phone}?${new URLSearchParams({ text: t("whatsapp_message") })}`
    : undefined;

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(createFeedbackSchema(t)),
    defaultValues: {
      cedula: "",
      email: "",
      name: "",
      comments: "",
    },
  });

  const closeModal = useCallback(() => {
    if (form.formState.isSubmitting) return;
    setSent(false);
    setSendError(null);
    form.reset();
    onClose();
  }, [form, form.formState.isSubmitting, onClose]);

  const onSubmit = async (data: FeedbackFormData) => {
    setSendError(null);
    const result = await submitFeedback(data);

    if (!result.success) {
      reportClientError("feedback_failed", {
        form: "feedback",
        code: "SERVER_ERROR",
      });
      const errorMessage =
        result.code === "NOT_CONFIGURED" ? "unavailable" : "send_error";
      toast.error(t(errorMessage));
      setSendError(errorMessage);
      return;
    }

    toast.success(t("sent"));
    form.reset();
    setSent(true);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closeModal()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary font-semibold">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        {whatsappUrl && (
          <Button
            asChild
            className="h-12 w-full gap-2 rounded-full bg-[#20c15c] px-4 text-base font-semibold text-white shadow-md hover:bg-[#1aab50] focus-visible:ring-[#20c15c]"
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("whatsapp_help")}
              title={t("whatsapp_help")}
            >
              <Image
                src="/images/whatsapp.svg"
                alt=""
                width={20}
                height={20}
                aria-hidden="true"
              />
              WhatsApp
            </a>
          </Button>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-6"
            aria-busy={form.formState.isSubmitting}
          >
            <FormField
              control={form.control}
              name="cedula"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary dark:text-blue-300 font-semibold">
                    {t("cedula_label")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
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
                      placeholder={t("cedula_placeholder")}
                      autoComplete="off"
                      inputMode="numeric"
                      disabled={sent || form.formState.isSubmitting}
                      className="h-12 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-500/30"
                      maxLength={CEDULA_MASK_LENGTH}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary dark:text-blue-300 font-semibold">
                    {t("name_label")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="off"
                      disabled={sent || form.formState.isSubmitting}
                      className="h-12 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-500/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary dark:text-blue-300 font-semibold">
                    {t("email_label")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      autoComplete="off"
                      disabled={sent || form.formState.isSubmitting}
                      className="h-12 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-500/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary dark:text-blue-300 font-semibold">
                    {t("comments_label")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder={t("comments_placeholder")}
                      autoComplete="off"
                      disabled={sent || form.formState.isSubmitting}
                      className="resize-none focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-500/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {sent && (
              <Alert
                role="status"
                className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <AlertDescription>{t("sent")}</AlertDescription>
              </Alert>
            )}

            {sendError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <AlertDescription>{t(sendError)}</AlertDescription>
              </Alert>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={sent || form.formState.isSubmitting}
                className="w-full h-12 text-base font-semibold rounded-full bg-primary hover:bg-[#002f5c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t("sending")}
                  </>
                ) : (
                  t("report")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
