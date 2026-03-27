"use client";

import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/use-t";
import { setLocale } from "@/lib/actions/set-locale";

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();

  async function toggleLocale() {
    const next = locale === "es" ? "en" : "es";
    await setLocale(next);
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      aria-label={locale === "es" ? "Switch to English" : "Cambiar a Español"}
      className="flex items-center gap-1.5 px-2.5 h-9 text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
    >
      <Globe size={16} className="shrink-0" />
      <span className="text-xs font-semibold tracking-wide uppercase">
        {locale === "es" ? "EN" : "ES"}
      </span>
    </Button>
  );
}
