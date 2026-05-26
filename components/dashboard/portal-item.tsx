"use client";

import { Building2, Clock, Unlink } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { ActionButton } from "./action-button";

interface PortalItemProps {
  name: string;
  lastAccess: string;
  onUnlink?: () => void;
}

export function PortalItem({ name, lastAccess, onUnlink }: PortalItemProps) {
  const t = useT("history");

  return (
    <div className="group flex flex-col p-5 rounded-md border bg-card hover:bg-muted/10 border-border hover:border-border/80 transition-all duration-300 hover:shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0 p-3.5 rounded-xl flex items-center justify-center transition-colors bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary dark:bg-gray-800 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-400">
            <Building2 size={24} strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <h3 className="font-semibold text-lg text-foreground tracking-tight break-words">
              {name}
            </h3>
            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-1.5 break-words">
              <Clock size={14} className="opacity-70" />
              <span>
                {t("last_access_prefix")}: <span className="font-medium text-foreground/80">{lastAccess}</span>
              </span>
            </div>
          </div>
        </div>

        {onUnlink && (
          <div className="flex-shrink-0 mt-2 sm:mt-0">
            <ActionButton
              variant="danger"
              onClick={onUnlink}
              className="w-full sm:w-auto font-medium shadow-sm hover:shadow dark:hover:bg-red-900/20 flex items-center justify-center gap-1.5"
            >
              <Unlink size={16} />
              {t("unlink")}
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  );
}
