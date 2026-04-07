"use client";

import { CheckCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useT } from "@/hooks/use-t";

interface PersonalInfoFieldProps {
  label: string;
  value: string;
  className?: string;
  icon?: ReactNode;
  verified?: boolean;
}

export function PersonalInfoField({
  label,
  value,
  className = "",
  icon,
  verified = false,
}: PersonalInfoFieldProps) {
  const t = useT("profile");

  return (
    <div
      className={`space-y-3 p-4 rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-background/50 hover:shadow-sm dark:hover:bg-background transition-all ${className}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </span>
        {verified && (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600 font-medium">
              {t("verified")}
            </span>
          </div>
        )}
      </div>
      <p className="text-lg font-semibold text-gray-900 dark:text-white pl-6">
        {value}
      </p>
    </div>
  );
}
