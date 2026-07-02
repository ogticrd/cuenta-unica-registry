"use client";

import { Bug } from "lucide-react";
import { useState } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { useT } from "@/hooks/use-t";

import { UserFeedbackModal } from "./user-feedback-modal";

export function UserFeedbackButton() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const t = useT("feedback");

  return (
    <>
      <UserFeedbackModal open={open} onClose={() => setOpen(false)} />

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 z-50 flex items-center gap-2 rounded-full bg-white px-4 py-3 font-semibold text-primary shadow-lg ring-1 ring-black/5 transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95 dark:bg-card dark:text-foreground dark:ring-white/10 sm:right-8 sm:top-[40vh] top-[80vh]"
        aria-label={t("report")}
        id="user-feedback-button"
      >
        <Bug className="h-5 w-5 shrink-0 text-secondary" />
        {!isMobile && <span className="text-sm">{t("report")}</span>}
      </button>
    </>
  );
}
