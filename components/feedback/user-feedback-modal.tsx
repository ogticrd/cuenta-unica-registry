"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
  const [sendError, setSendError] = useState(false);

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
    setSent(false);
    setSendError(false);
    form.reset();
    onClose();
  }, [form, onClose]);

  const onSubmit = async (data: FeedbackFormData) => {
    setSendError(false);
    const result = await submitFeedback(data);

    if (!result.success) {
      toast.error(t("send_error"));
      setSendError(true);
      return;
    }

    toast.success(t("sent"));
    setSent(true);
    setTimeout(closeModal, 2300);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closeModal()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary font-semibold">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("title")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-4"
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
              <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300 animate-in fade-in-0 slide-in-from-bottom-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {t("sent")}
              </div>
            )}

            {sendError && (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300 animate-in fade-in-0 slide-in-from-bottom-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {t("send_error")}
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={sent || form.formState.isSubmitting}
                className="w-full h-12 text-base font-semibold rounded-full bg-[#003B73] hover:bg-[#002f5c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t("report")}
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
