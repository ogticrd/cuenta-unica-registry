"use client";

import { useT } from "@/hooks/use-t";

interface LoadingFallbackProps {
  message?: string;
}

export function LoadingFallback({ message }: LoadingFallbackProps) {
  const t = useT("common");
  return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-blue-400 mx-auto"></div>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        {message ? message : t("loading")}
      </p>
    </div>
  );
}
