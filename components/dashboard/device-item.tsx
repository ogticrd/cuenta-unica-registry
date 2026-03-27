"use client";

import { Monitor, Smartphone } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { ActionButton } from "./action-button";

interface DeviceItemProps {
  device: string;
  ipAddress: string;
  location: string;
  lastAccess: string;
  expirationDate: string;
  status: {
    text: string;
    variant: "active" | "current";
  };
  onUnlink?: () => void;
}

export function DeviceItem({
  device,
  ipAddress,
  location,
  lastAccess,
  expirationDate,
  status,
  onUnlink,
}: DeviceItemProps) {
  const t = useT("history");
  const isMobile =
    device.toLowerCase().includes("mobile") ||
    device.toLowerCase().includes("android") ||
    device.toLowerCase().includes("iphone");

  return (
    <div className="flex flex-col space-y-4 py-5 border-b border-border last:border-b-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 text-muted-foreground bg-gray-100 p-2 rounded-full dark:bg-gray-800">
            {isMobile ? <Smartphone size={18} /> : <Monitor size={18} />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h3
                className="font-medium text-foreground truncate max-w-full"
                title={device}
              >
                {device}
              </h3>
              {status.variant === "current" && (
                <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {t("session_current_badge")}
                </span>
              )}
            </div>
          </div>
        </div>

        {onUnlink && (
          <div className="flex-shrink-0">
            <ActionButton
              variant="danger"
              onClick={onUnlink}
              className="w-full sm:w-auto dark:hover:bg-red-600/10"
            >
              {t("unlink")}
            </ActionButton>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-foreground sm:ml-12 bg-gray-50 p-4 rounded-lg dark:bg-card">
        <div>
          <div className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-medium">
            {t("ip_address")}
          </div>
          <div className="break-all font-medium">{ipAddress}</div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-medium">
            {t("location")}
          </div>
          <div className="font-medium">{location}</div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-medium">
            {t("last_access")}
          </div>
          <div className="font-medium">{lastAccess}</div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-medium">
            {t("expires_on")}
          </div>
          <div className="font-medium">{expirationDate}</div>
        </div>
      </div>
    </div>
  );
}
